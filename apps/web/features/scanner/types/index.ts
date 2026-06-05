// ─────────────────────────────────────────────
// FoodWise · Scanner Module · Types
// ─────────────────────────────────────────────

export type ScanMode = "barcode" | "manual";

export type ScanStatus =
  | "idle"
  | "scanning"
  | "processing"
  | "success"
  | "error"
  | "not_found";

// ── Raw barcode value ──────────────────────────
export interface BarcodeResult {
  rawValue: string;
  format: string; // EAN_13, UPC_A, QR_CODE, etc.
  timestamp: number;
}

// ── Nutrient map from OpenFoodFacts ───────────
export interface Nutriments {
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

// ── Ingredient risk levels ─────────────────────
export type RiskLevel = "safe" | "moderate" | "high" | "unknown";

export interface IngredientRisk {
  name: string;
  risk: RiskLevel;
  reason?: string;
}

// ── Core product entity ────────────────────────
export interface Product {
  id: string; // Supabase row UUID
  barcode: string;
  name: string;
  brand?: string;
  image_url?: string;
  categories?: string[];
  labels?: string[]; // e.g. ["organic", "gluten-free"]
  allergens?: string[];
  ingredients_text?: string;
  nutriments: Nutriments;
  nova_group?: 1 | 2 | 3 | 4; // NOVA food processing classification
  nutriscore_grade?: "a" | "b" | "c" | "d" | "e";
  countries?: string[];
  source: "openfoodfacts" | "admin" | "user_submitted";
  created_at: string;
  updated_at: string;
}

// ── Health score breakdown ─────────────────────
export interface ScoreBreakdown {
  nutrition: number; // 0–40
  ingredients: number; // 0–30
  processing: number; // 0–20
  profile_match: number; // 0–10 (personalised)
}

export interface HealthScore {
  total: number; // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: ScoreBreakdown;
  ingredient_risks: IngredientRisk[];
  computed_at: string;
}

// ── Full scan result (product + score) ─────────
export interface ScanResult {
  product: Product;
  health_score: HealthScore;
  scan_id: string;
}

// ── Scan history row stored in Supabase ─────────
export interface ScanHistoryItem {
  id: string;
  user_id: string;
  product_id: string;
  barcode: string;
  product_name: string;
  product_image?: string;
  health_score_total: number;
  health_score_grade: string;
  scanned_at: string;
}

// ── API request/response shapes ────────────────
export interface BarcodeLookupRequest {
  barcode: string;
  user_id?: string;
}

export interface BarcodeLookupResponse {
  success: true;
  data: ScanResult;
}

export interface BarcodeLookupError {
  success: false;
  error: string;
  code: "NOT_FOUND" | "INVALID_BARCODE" | "UPSTREAM_ERROR" | "INTERNAL_ERROR";
}

export type BarcodeLookupApiResponse =
  | BarcodeLookupResponse
  | BarcodeLookupError;
