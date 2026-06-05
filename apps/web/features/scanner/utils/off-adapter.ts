// ─────────────────────────────────────────────
// FoodWise · Scanner Module · OFF Adapter
// Maps OpenFoodFacts response → Product entity
// ─────────────────────────────────────────────

import type { Product, Nutriments } from "../types";
import { OFFProductSchema } from "../schemas";

const OFF_API_BASE = "https://world.openfoodfacts.org/api/v2";

// ─── Fetch from OpenFoodFacts ──────────────────
export async function fetchFromOFF(barcode: string): Promise<Product | null> {
  const url = `${OFF_API_BASE}/product/${barcode}?fields=code,product_name,product_name_en,brands,image_front_url,categories_tags,labels_tags,allergens_tags,ingredients_text,nutriments,nova_group,nutriscore_grade,countries_tags`;

  const res = await fetch(url, {
    headers: { "User-Agent": "FoodWise/1.0 (https://foodwise.app)" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`OpenFoodFacts responded with ${res.status}`);
  }

  const raw = await res.json();
  const parsed = OFFProductSchema.safeParse(raw);

  if (!parsed.success || parsed.data.status === 0 || !parsed.data.product) {
    return null;
  }

  return mapOFFToProduct(barcode, parsed.data.product);
}

// ─── Map OFF product fields → Product ──────────
function mapOFFToProduct(
  barcode: string,
  p: NonNullable<ReturnType<typeof OFFProductSchema.parse>["product"]>
): Product {
  const nutriments: Nutriments = {
    energy_kcal_100g: p.nutriments?.["energy-kcal_100g"],
    fat_100g: p.nutriments?.fat_100g,
    saturated_fat_100g: p.nutriments?.["saturated-fat_100g"],
    carbohydrates_100g: p.nutriments?.carbohydrates_100g,
    sugars_100g: p.nutriments?.sugars_100g,
    fiber_100g: p.nutriments?.fiber_100g,
    proteins_100g: p.nutriments?.proteins_100g,
    salt_100g: p.nutriments?.salt_100g,
    sodium_100g: p.nutriments?.sodium_100g,
  };

  const novaGroup = p.nova_group;
  const novaValid =
    novaGroup === 1 || novaGroup === 2 || novaGroup === 3 || novaGroup === 4
      ? (novaGroup as 1 | 2 | 3 | 4)
      : undefined;

  const nutriscoreRaw = p.nutriscore_grade?.toLowerCase();
  const nutriscoreValid =
    nutriscoreRaw === "a" ||
    nutriscoreRaw === "b" ||
    nutriscoreRaw === "c" ||
    nutriscoreRaw === "d" ||
    nutriscoreRaw === "e"
      ? (nutriscoreRaw as "a" | "b" | "c" | "d" | "e")
      : undefined;

  return {
    id: "", // will be assigned by Supabase on upsert
    barcode,
    name: p.product_name_en || p.product_name || "Unknown product",
    brand: p.brands?.split(",")[0]?.trim(),
    image_url: p.image_front_url || undefined,
    categories: p.categories_tags
      ?.map((t) => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " "))
      .slice(0, 5),
    labels: p.labels_tags
      ?.map((t) => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " "))
      .slice(0, 10),
    allergens: p.allergens_tags
      ?.map((t) => t.replace(/^[a-z]{2}:en:/, "").replace(/-/g, " ")),
    ingredients_text: p.ingredients_text,
    nutriments,
    nova_group: novaValid,
    nutriscore_grade: nutriscoreValid,
    countries: p.countries_tags
      ?.map((t) => t.replace(/^[a-z]{2}:/, ""))
      .slice(0, 3),
    source: "openfoodfacts",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
