// ─────────────────────────────────────────────
// FoodWise · API Route Handler (Local Math Version)
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { BarcodeInputSchema } from "@/features/scanner/schemas";

// Import your local logic
import { fetchFromOFF } from "@/features/scanner/utils/off-adapter";
import { computeHealthScore } from "@/features/scanner/utils/health-score";
import { getSupabaseServerClient } from "@/shared/lib/supabase/server";

export async function POST(req: NextRequest) {
  console.log("Service Key Check:", process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + "...");

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from .env.local");
  }

  try {
    // 1. Validate Input
    const body = await req.json();
    const parsed = BarcodeInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid barcode" }, { status: 400 });
    }

    const { barcode } = parsed.data;

    // ── 2. Initialize Supabase (Use SERVICE ROLE for the "Admin" client) ──
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // ✅ USE THIS SECRET KEY HERE
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    // 3. Get User (to personalize the score)
      const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userPrefs = null;

    if (user) {
      const { data } = await supabase
        .from('users')
        .select('dietary_preferences')
        .eq('id', user.id)
        .single();
      userPrefs = data?.dietary_preferences;
    }

    // 4. Check Cache: Is this product already in our DB?
    const { data: cachedProduct } = await supabase
      .from("products")
      .select("*, product_health_scores(*)")
      .eq("barcode", barcode)
      .maybeSingle();

    let product = cachedProduct;
    let healthScore = cachedProduct?.product_health_scores?.[0];

    // 5. If not in DB, fetch from OpenFoodFacts
    if (!product) {
      const offProduct = await fetchFromOFF(barcode);

      if (!offProduct) {
        return NextResponse.json({ success: false, error: "Product not found", code: "NOT_FOUND" }, { status: 404 });
      }

      // Save new product to DB
      const { data: savedProduct, error: pError } = await supabase
        .from("products")
        .insert({ ...offProduct, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (pError) throw pError;
      product = savedProduct;
    }

    // 6. Compute/Re-compute score locally (Zero Cost)
    healthScore = computeHealthScore(product, userPrefs);

    // 7. Upsert the score to the DB
    await supabase.from("product_health_scores").upsert({
      product_id: product.id,
      ...healthScore,
      ingredient_risks: JSON.stringify(healthScore.ingredient_risks),
    });

    // 8. Log to Scan History (if user is logged in)
    if (user) {
      await supabase.from("scan_history").insert({
        user_id: user.id,
        product_id: product.id,
        barcode: product.barcode,
        product_name: product.name,
        product_image: product.image_url,
        health_score_total: healthScore.total,
        health_score_grade: healthScore.grade,
      });
    }

    // 9. Return Result
    return NextResponse.json({
      success: true,
      data: {
        product,
        health_score: healthScore,
        scan_id: crypto.randomUUID()
      }
    });

  } catch (err: any) {
    console.error("[api/scan/barcode] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}