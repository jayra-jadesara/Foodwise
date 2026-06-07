import type { Product } from "../types";
import { OFFProductSchema } from "../schemas";

const OFF_API_BASE = "https://world.openfoodfacts.org/api/v2";
const UPC_API_BASE = "https://api.upcitemdb.com/prod/trial/lookup";

// We create a "Draft" type that doesn't require the database 'id' yet
type ProductDraft = Omit<Product, 'id'>;

/**
 * MASTER STRATEGY: Tries 4 sources in order of quality/cost
 * 1. OpenFoodFacts -> 2. FatSecret -> 3. Edamam -> 4. UPCItemDB
 
 *  Edamam: developer.edamam.com (Food Database API)
    FatSecret: platform.fatsecret.com (OAuth2 API)

    Edamam  : 10,000 / month
    FatSecret  : 5,000 / month
    UPCItemDB   : 100 / day
 */

export async function fetchProductMetadata(barcode: string): Promise<ProductDraft | null> {
  // Layer 1: OpenFoodFacts (Unlimited/Free)
  try {
    console.log('Trying From OFF for barcode:', barcode);
    const p = await fetchFromOFF(barcode);
    if (p) return p;
  } catch (e) { console.error("OFF Failed"); }

  // Layer 2: FatSecret (Best for Indian/Regional Brands)
  try {
    console.log('Trying Fat Secret for barcode:', barcode);
    const p = await fetchFromFatSecret(barcode);
    if (p) return p;
  } catch (e) { console.error("FatSecret Failed"); }

  // Layer 3: Edamam (High Nutritional Accuracy)
  try {
    console.log('Trying Edamam for barcode:', barcode);
    const p = await fetchFromEdamam(barcode);
    if (p) return p;
  } catch (e) { console.error("Edamam Failed"); }

  // Layer 4: UPCItemDB (Retail Fallback)
  try {
    console.log('Trying UPC for  barcode:', barcode);
    const p = await fetchFromUPCItemDB(barcode);
    if (p) return p;
  } catch (e) { console.error("UPCItemDB Failed"); }

  return null;
}

// ─── SOURCE 1: FATSECRET (OAuth2) ──────────────
async function getFatSecretToken() {
  const auth = btoa(`${process.env.FATSECRET_CLIENT_ID}:${process.env.FATSECRET_CLIENT_SECRET}`);
  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials&scope=basic",
  });
  const data = await res.json();
  return data.access_token;
}

async function fetchFromFatSecret(barcode: string): Promise<ProductDraft | null> {
  const token = await getFatSecretToken();
  const url = `https://platform.fatsecret.com/rest/server.api?method=food.find_id_for_barcode&barcode=${barcode}&format=json`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  const foodId = data.food_id?.value;

  if (!foodId) return null;

  const detailRes = await fetch(`https://platform.fatsecret.com/rest/server.api?method=food.get.v2&food_id=${foodId}&format=json`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const detail = await detailRes.json();
  const f = detail.food;
  const s = f.servings.serving[0];

  return {
    barcode,
    name: f.food_name,
    brand: f.brand_name || "Unknown Brand",
    nutriments: {
      energy_kcal_100g: parseFloat(s.calories),
      proteins_100g: parseFloat(s.protein),
      fat_100g: parseFloat(s.fat),
      carbohydrates_100g: parseFloat(s.carbohydrate),
    },
    source: "openfoodfacts", // Matches your DB check constraints
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as ProductDraft;
}

// ─── SOURCE 2: EDAMAM ───────────────────────────
async function fetchFromEdamam(barcode: string): Promise<ProductDraft | null> {
  const url = `https://api.edamam.com/api/food-database/v2/parser?upc=${barcode}&app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.hints || data.hints.length === 0) return null;
  const f = data?.hints[0]?.food;

  return {
    barcode,
    name: f?.label,
    brand: f?.brand || "Unknown Brand",
    image_url: f?.image,
    nutriments: {
      energy_kcal_100g: f?.nutrients?.ENERC_KCAL,
      proteins_100g: f?.nutrients?.PROCNT,
      fat_100g: f?.nutrients?.FAT,
      carbohydrates_100g: f?.nutrients?.CHOCDF,
      fiber_100g: f?.nutrients?.FIBTG
    },
    source: "admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as ProductDraft;
}

// ─── SOURCE 3: OPEN FOOD FACTS ──────────────────
async function fetchFromOFF(barcode: string): Promise<ProductDraft | null> {
  const url = `${OFF_API_BASE}/product/${barcode}?fields=code,product_name,product_name_en,brands,image_front_url,categories_tags,labels_tags,allergens_tags,ingredients_text,nutriments,nova_group,nutriscore_grade`;

  const res = await fetch(url, {
    headers: { "User-Agent": "FoodWise/1.0" },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) return null;
  const raw = await res.json();
  const parsed = OFFProductSchema.safeParse(raw);

  if (!parsed.success || parsed.data.status === 0 || !parsed.data.product) return null;

  const p = parsed.data.product;

  return {
    barcode,
    name: p.product_name_en || p.product_name || "Unknown",
    brand: p.brands?.split(",")[0]?.trim() || "Unknown",
    image_url: p.image_front_url,
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
      sodium_100g: p.nutriments?.sodium_100g,
    },
    nova_group: p.nova_group,
    nutriscore_grade: (p.nutriscore_grade === 'unknown' ? null : p.nutriscore_grade) as any,
    source: "openfoodfacts",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as ProductDraft;
}

// ─── SOURCE 4: UPCITEMDB ────────────────────────
async function fetchFromUPCItemDB(barcode: string): Promise<ProductDraft | null> {
  const url = `${UPC_API_BASE}?upc=${barcode}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.items || data.items.length === 0) return null;

  const item = data.items[0];

  return {
    barcode,
    name: item.title,
    brand: item.brand,
    image_url: item.images?.[0],
    categories: [item.category?.split(">")?.pop()?.trim()],
    nutriments: {},
    source: "user_submitted",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as ProductDraft;
}