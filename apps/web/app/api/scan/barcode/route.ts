import { NextRequest, NextResponse } from "next/server";
import { fetchProductMetadata } from "@/features/scanner/utils/off-adapter";
import { computeHealthScore } from "@/features/scanner/utils/health-score";
import { getSupabaseServiceClient } from "@/shared/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const resDataObj = await req.json();
        const { barcode } = resDataObj;

        const supabase = await getSupabaseServiceClient();
        const { data: { user } } = await supabase.auth.getUser();


        // 2. Check Database Cache
        const { data: existing } = await supabase
            .from("products")
            .select("*, product_health_scores(*)")
            .eq("barcode", barcode)
            .maybeSingle();

        if (existing && existing.product_health_scores?.[0]) {
            return NextResponse.json({
                success: true,
                data: { product: existing, health_score: existing.product_health_scores[0] }
            });
        }

        // 3. Not in Cache? Fetch from OpenFoodFacts
        const productData = await fetchProductMetadata(barcode);
        console.log("OFF Data:", productData);
        if (!productData) {
            return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
        };

        let { data: product } = await supabase
            .from("products")
            .select("*, product_health_scores(*)")
            .eq("barcode", productData?.barcode)
            .maybeSingle();

        // ── 2. IF NOT IN DB, FETCH & INSERT ──
        if (!product) {
            // 4. Save Product to DB
            const { data: savedProduct, error: pError } = await supabase
                .from("products")
                .insert(productData)
                .select().single();

            if (pError) {
                // FALLBACK: If upsert still fails with duplicate, just fetch it again
                if (pError.code === '23505') {
                    const { data: retryProduct } = await supabase
                        .from("products")
                        .select("*, product_health_scores(*)")
                        .eq("barcode", barcode)
                        .single();
                    product = retryProduct;
                } else {
                    throw pError;
                }
            } else {
                product = savedProduct;
            }
        }

        // 5. Compute Health Score locally
        const score = computeHealthScore(product);
        await supabase.from("product_health_scores").insert({
            product_id: product.id,
            ...score,
            ingredient_risks: JSON.stringify(score.ingredient_risks)
        });

        // 6. Log Scan History
        if (user) {
            await supabase.from("scan_history").insert({
                user_id: user.id,
                product_id: product.id,
                barcode: product.barcode,
                product_name: product.name,
                product_image: product.image_url,
                health_score_total: score.total,
                health_score_grade: score.grade,
            });
        }

        return NextResponse.json({
            success: true,
            data: { product: product, health_score: score }
        });

    } catch (err: any) {
        console.error("API Error:", err);
        if (err.code === '23505') {
            return NextResponse.json({ success: false, error: "Product already exists." }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}