// ─────────────────────────────────────────────
// FoodWise · Supabase Edge Function
// barcode-lookup/index.ts
// Deno runtime
// ─────────────────────────────────────────────

import { getSupabaseBrowserClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OFF_API = "https://world.openfoodfacts.org/api/v2";

const supabase = getSupabaseBrowserClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Types (duplicated from shared — edge fn is isolated) ──────
interface Nutriments {
  energy_kcal_100g?: number;
  fat_100g?: number;
  saturated_fat_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
  sodium_100g?: number;
}

interface Product {
  barcode: string;
  name: string;
  brand?: string;
  image_url?: string;
  categories?: string[];
  labels?: string[];
  allergens?: string[];
  ingredients_text?: string;
  nutriments: Nutriments;
  nova_group?: number;
  nutriscore_grade?: string;
  source: string;
}

// ── Health score (inline — edge fn has no imports) ─────────────
const HIGH_RISK = [
  /e621|msg/i, /e951|aspartame/i, /e249|e250|nitrite|nitrate/i,
  /e211|sodium benzoate/i, /e320|bha/i, /e321|bht/i,
  /partially hydrogenated|trans fat/i, /high.fructose corn syrup/i,
];
const MODERATE_RISK = [
  /carrageenan/i, /maltodextrin/i, /modified starch/i, /e407/i,
];

function computeScore(product: Product) {
  const n = product.nutriments;

  // Nutrition (40)
  let nutrition = 40;
  if (n.energy_kcal_100g) {
    if (n.energy_kcal_100g > 500) nutrition -= 8;
    else if (n.energy_kcal_100g > 400) nutrition -= 4;
  }
  if (n.saturated_fat_100g) {
    if (n.saturated_fat_100g > 10) nutrition -= 8;
    else if (n.saturated_fat_100g > 5) nutrition -= 4;
  }
  if (n.sugars_100g) {
    if (n.sugars_100g > 25) nutrition -= 8;
    else if (n.sugars_100g > 15) nutrition -= 5;
  }
  if (n.salt_100g && n.salt_100g > 1.5) nutrition -= 6;
  if (n.proteins_100g && n.proteins_100g > 10) nutrition += 2;
  if (n.fiber_100g && n.fiber_100g > 3) nutrition += 2;
  nutrition = Math.max(0, Math.min(40, nutrition));

  // Ingredients (30)
  const text = (product.ingredients_text ?? "").toLowerCase();
  let ingredients = text ? 30 : 20;
  const risks: Array<{ name: string; risk: string; reason: string }> = [];
  if (text) {
    for (const p of HIGH_RISK) {
      const m = text.match(p);
      if (m) { ingredients -= 6; risks.push({ name: m[0], risk: "high", reason: "Associated with health concerns" }); }
    }
    for (const p of MODERATE_RISK) {
      const m = text.match(p);
      if (m) { ingredients -= 3; risks.push({ name: m[0], risk: "moderate", reason: "Processed additive" }); }
    }
  }
  ingredients = Math.max(0, Math.min(30, ingredients));

  // Processing (20)
  const novaMap: Record<number, number> = { 1: 20, 2: 15, 3: 10, 4: 2 };
  const processing = novaMap[product.nova_group as number] ?? 10;

  const total = Math.round(nutrition + ingredients + processing + 5);
  const gradeMap = [
    [80, "A"], [65, "B"], [45, "C"], [25, "D"],
  ] as const;
  const grade = gradeMap.find(([min]) => total >= min)?.[1] ?? "F";

  return { total, grade, breakdown: { nutrition, ingredients, processing, profile_match: 5 }, ingredient_risks: risks, computed_at: new Date().toISOString() };
}

// ── OFF fetch ─────────────────────────────────
async function fetchOFF(barcode: string): Promise<Product | null> {
  const url = `${OFF_API}/product/${barcode}?fields=code,product_name,product_name_en,brands,image_front_url,categories_tags,labels_tags,allergens_tags,ingredients_text,nutriments,nova_group,nutriscore_grade`;
  const res = await fetch(url, {
    headers: { "User-Agent": "FoodWise/1.0 (https://foodwise.app)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`OFF ${res.status}`);
  const data = await res.json();
  if (data.status === 0 || !data.product) return null;
  const p = data.product;
  return {
    barcode,
    name: p.product_name_en || p.product_name || "Unknown product",
    brand: p.brands?.split(",")[0]?.trim(),
    image_url: p.image_front_url || undefined,
    categories: p.categories_tags?.map((t: string) => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " ")).slice(0, 5),
    labels: p.labels_tags?.map((t: string) => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " ")).slice(0, 10),
    allergens: p.allergens_tags?.map((t: string) => t.replace(/^[a-z]{2}:en:/, "")),
    ingredients_text: p.ingredients_text,
    nutriments: {
      energy_kcal_100g: p.nutriments?.["energy-kcal_100g"],
      fat_100g: p.nutriments?.fat_100g,
      saturated_fat_100g: p.nutriments?.["saturated-fat_100g"],
      carbohydrates_100g: p.nutriments?.carbohydrates_100g,
      sugars_100g: p.nutriments?.sugars_100g,
      fiber_100g: p.nutriments?.fiber_100g,
      proteins_100g: p.nutriments?.proteins_100g,
      salt_100g: p.nutriments?.salt_100g,
    },
    nova_group: p.nova_group,
    nutriscore_grade: p.nutriscore_grade?.toLowerCase(),
    source: "openfoodfacts",
  };
}

// ── Main handler ──────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { barcode, user_id } = await req.json() as { barcode: string; user_id?: string };

    if (!barcode || !/^\d{8,14}$/.test(barcode)) {
      return Response.json({ success: false, error: "Invalid barcode", code: "INVALID_BARCODE" }, { status: 400 });
    }

    // 1. Check Supabase cache first
    const { data: cached } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();

    let product: Product & { id?: string } = cached;
    let isNewProduct = false;

    // 2. Fetch from OFF if not cached
    if (!cached) {
      const offProduct = await fetchOFF(barcode);
      if (!offProduct) {
        return Response.json({ success: false, error: "Product not found", code: "NOT_FOUND" }, { status: 404 });
      }

      const { data: inserted, error: insertError } = await supabase
        .from("products")
        .upsert({ ...offProduct, updated_at: new Date().toISOString() }, { onConflict: "barcode" })
        .select()
        .single();

      if (insertError) throw insertError;
      product = inserted;
      isNewProduct = true;
    }

    // 3. Compute health score
    const health_score = computeScore(product);

    // 4. Upsert health score cache
    await supabase
      .from("product_health_scores")
      .upsert({
        product_id: product.id,
        ...health_score,
        ingredient_risks: JSON.stringify(health_score.ingredient_risks),
      }, { onConflict: "product_id" });

    // 5. Log scan history (only if authenticated)
    if (user_id) {
      await supabase.from("scan_history").insert({
        user_id,
        product_id: product.id,
        barcode,
        product_name: product.name,
        product_image: product.image_url,
        health_score_total: health_score.total,
        health_score_grade: health_score.grade,
      });
    }

    return Response.json(
      { success: true, data: { product, health_score, scan_id: crypto.randomUUID() } },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": isNewProduct ? "no-cache" : "public, max-age=86400",
        },
      }
    );
  } catch (err) {
    console.error("[barcode-lookup]", err);
    return Response.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
});
