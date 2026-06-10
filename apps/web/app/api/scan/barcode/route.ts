// ─────────────────────────────────────────────
// FoodWise · API · POST /api/scan/barcode
// Multi-source cascade — free tier only:
//   1. OpenFoodFacts (unlimited, best for EU/global)
//   2. Open Beauty / Product Facts (OFF sister projects)
//   3. UPCItemDB (100/day free — retail fallback)
//   4. Go-UPC (500/month free)
// QR codes supported (non-numeric barcodes pass through)
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { computeHealthScore } from "@/features/scanner/utils/health-score";
import { getSupabaseServiceClient } from "@/shared/lib/supabase/server";

// ── Loose validation — accepts EAN, UPC, QR payloads ──
function isValidBarcode(s: string): boolean {
    // EAN-8, EAN-13, UPC-A, UPC-E: digits only, 6–14 chars
    // QR codes: printable ASCII, up to 200 chars
    return s.length >= 4 && s.length <= 200 && /^[\x20-\x7E]+$/.test(s);
}

// ── Normalize: some QR codes encode a URL to a product page ──
function extractBarcode(raw: string): string {
    // e.g. "https://world.openfoodfacts.org/product/8901058851404"
    const urlMatch = raw.match(/\/product\/(\d{6,14})/);
    if (urlMatch) return urlMatch[1]!;
    // Plain barcode
    return raw.trim();
}

// ═══════════════════════════════════════════
// SOURCE 1 — OpenFoodFacts (unlimited, best)
// ═══════════════════════════════════════════
async function fetchOFF(barcode: string) {
    const fields = [
        "code", "product_name", "product_name_en", "brands",
        "image_front_url", "categories_tags", "labels_tags",
        "allergens_tags", "ingredients_text", "nutriments",
        "nova_group", "nutriscore_grade", "countries_tags",
    ].join(",");

    const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${fields}`,
        {
            headers: { "User-Agent": "FoodWise/1.0 (contact@foodwise.app)" },
            signal: AbortSignal.timeout(6000),
        }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.product || json.status === 0) return null;

    const p = json.product;
    return {
        barcode,
        name: p.product_name_en || p.product_name || null,
        brand: p.brands?.split(",")[0]?.trim() || null,
        image_url: p.image_front_url || null,
        categories: (p.categories_tags ?? [])
            .map((t: string) => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " "))
            .slice(0, 5),
        labels: (p.labels_tags ?? [])
            .map((t: string) => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " "))
            .slice(0, 8),
        allergens: (p.allergens_tags ?? [])
            .map((t: string) => t.replace(/^[a-z]{2}:en:/, "")),
        ingredients_text: p.ingredients_text || null,
        nutriments: {
            energy_kcal_100g: p.nutriments?.["energy-kcal_100g"],
            fat_100g: p.nutriments?.fat_100g,
            saturated_fat_100g: p.nutriments?.["saturated-fat_100g"],
            carbohydrates_100g: p.nutriments?.carbohydrates_100g,
            sugars_100g: p.nutriments?.sugars_100g,
            fiber_100g: p.nutriments?.fiber_100g,
            proteins_100g: p.nutriments?.proteins_100g,
            salt_100g: p.nutriments?.salt_100g,
            sodium_100g: p.nutriments?.sodium_100g,
        },
        nova_group: [1, 2, 3, 4].includes(p.nova_group) ? p.nova_group : null,
        nutriscore_grade: ["a", "b", "c", "d", "e"].includes(p.nutriscore_grade?.toLowerCase())
            ? p.nutriscore_grade.toLowerCase() : null,
        source: "openfoodfacts",
    };
}

// ═══════════════════════════════════════════
// SOURCE 2 — OFF sister projects
// (Open Beauty Facts, Open Pet Food Facts, Open Products Facts)
// Same API, different domains — covers non-food barcodes too
// ═══════════════════════════════════════════
async function fetchOFFSister(barcode: string) {
    const domains = [
        "world.openbeautyfacts.org",
        "world.openproductsfacts.org",
        "world.openpetfoodfacts.org",
    ];

    for (const domain of domains) {
        try {
            const res = await fetch(
                `https://${domain}/api/v0/product/${barcode}.json`,
                {
                    headers: { "User-Agent": "FoodWise/1.0" },
                    signal: AbortSignal.timeout(4000),
                }
            );
            if (!res.ok) continue;
            const json = await res.json();
            if (!json.product || json.status === 0) continue;

            const p = json.product;
            const name = p.product_name_en || p.product_name;
            if (!name) continue;

            return {
                barcode,
                name,
                brand: p.brands?.split(",")[0]?.trim() || null,
                image_url: p.image_front_url || null,
                categories: [],
                labels: [],
                allergens: [],
                ingredients_text: p.ingredients_text || null,
                nutriments: {},
                nova_group: null,
                nutriscore_grade: null,
                source: "openfoodfacts",
            };
        } catch {
            continue;
        }
    }
    return null;
}

// ═══════════════════════════════════════════
// SOURCE 3 — UPCItemDB (100 req/day free)
// Best for US/India retail products
// ═══════════════════════════════════════════
async function fetchUPCItemDB(barcode: string) {
    // Only try for numeric barcodes
    if (!/^\d{6,14}$/.test(barcode)) return null;

    try {
        const res = await fetch(
            `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
            { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return null;
        const json = await res.json();
        const item = json.items?.[0];
        if (!item) return null;

        return {
            barcode,
            name: item.title || null,
            brand: item.brand || null,
            image_url: item.images?.[0] || null,
            categories: item.category ? [item.category.split(">").pop()?.trim()].filter(Boolean) : [],
            labels: [],
            allergens: [],
            ingredients_text: item.description || null,
            nutriments: {},
            nova_group: null,
            nutriscore_grade: null,
            source: "user_submitted",
        };
    } catch {
        return null;
    }
}

// ═══════════════════════════════════════════
// SOURCE 4 — Go-UPC (500 req/month free)
// Good for Indian packaged foods
// ═══════════════════════════════════════════
async function fetchGoUPC(barcode: string) {
    const apiKey = process.env.GOUPC_API_KEY;
    if (!apiKey || !/^\d{6,14}$/.test(barcode)) return null;

    try {
        const res = await fetch(
            `https://go-upc.com/api/v1/code/${barcode}`,
            {
                headers: { Authorization: `Bearer ${apiKey}` },
                signal: AbortSignal.timeout(5000),
            }
        );
        if (!res.ok) return null;
        const json = await res.json();
        const p = json.product;
        if (!p?.name) return null;

        return {
            barcode,
            name: p.name,
            brand: p.brand || null,
            image_url: p.imageUrl || null,
            categories: p.category ? [p.category] : [],
            labels: [],
            allergens: [],
            ingredients_text: null,
            nutriments: {},
            nova_group: null,
            nutriscore_grade: null,
            source: "user_submitted",
        };
    } catch {
        return null;
    }
}

// ═══════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const raw: string = body?.barcode ?? "";

        if (!isValidBarcode(raw)) {
            return NextResponse.json(
                { success: false, error: "Invalid barcode", code: "INVALID_BARCODE" },
                { status: 400 }
            );
        }

        const barcode = extractBarcode(raw);
        const supabase = await getSupabaseServiceClient();
        const { data: { user } } = await supabase.auth.getUser();

        // ── 1. Check Supabase cache ───────────────
        const { data: cached } = await supabase
            .from("products")
            .select("*, product_health_scores(*)")
            .eq("barcode", barcode)
            .maybeSingle();

        if (cached && cached.product_health_scores?.length > 0) {
            // Log history even on cache hit
            if (user) {
                await supabase.from("scan_history").insert({
                    user_id: user.id,
                    product_id: cached.id,
                    barcode,
                    product_name: cached.name,
                    product_image: cached.image_url,
                    health_score_total: cached.product_health_scores[0].total,
                    health_score_grade: cached.product_health_scores[0].grade,
                }).select().single();
            }
            return NextResponse.json({
                success: true,
                data: {
                    product: cached,
                    health_score: cached.product_health_scores[0],
                    scan_id: crypto.randomUUID(),
                },
            });
        }

        // ── 2. Multi-source cascade ───────────────
        // Run OFF first (best quality). Others are parallel fallbacks.
        let productData: any = await fetchOFF(barcode);

        if (!productData) {
            // Try remaining sources in parallel — take first to succeed
            const [sister, upc, goupc] = await Promise.allSettled([
                fetchOFFSister(barcode),
                fetchUPCItemDB(barcode),
                fetchGoUPC(barcode),
            ]);
            productData =
                (sister.status === "fulfilled" && sister.value) ||
                (upc.status === "fulfilled" && upc.value) ||
                (goupc.status === "fulfilled" && goupc.value) ||
                null;
        }

        if (!productData) {
            return NextResponse.json(
                { success: false, error: "Product not found", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // ── 3. Upsert product ──────────────────────
        const { data: product, error: upsertErr } = await supabase
            .from("products")
            .upsert(
                { ...productData, updated_at: new Date().toISOString() },
                { onConflict: "barcode" }
            )
            .select()
            .single();

        if (upsertErr) throw upsertErr;

        // ── 4. Compute + store health score ────────
        const score = computeHealthScore(product);
        await supabase
            .from("product_health_scores")
            .upsert(
                {
                    product_id: product.id,
                    total: score.total,
                    grade: score.grade,
                    breakdown: score.breakdown,
                    ingredient_risks: score.ingredient_risks,
                    computed_at: new Date().toISOString(),
                },
                { onConflict: "product_id" }
            );

        // ── 5. Log scan history ────────────────────
        if (user) {
            await supabase.from("scan_history").insert({
                user_id: user.id,
                product_id: product.id,
                barcode,
                product_name: product.name,
                product_image: product.image_url,
                health_score_total: score.total,
                health_score_grade: score.grade,
            });
        }

        return NextResponse.json({
            success: true,
            data: { product, health_score: score, scan_id: crypto.randomUUID() },
        });
    } catch (err) {
        console.error("[api/scan/barcode]", err);
        return NextResponse.json(
            { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}

export const runtime = "nodejs";
