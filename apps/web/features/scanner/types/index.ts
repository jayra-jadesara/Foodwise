export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  image_url?: string;
  nutriments: any;
  nova_group?: number;
  nutriscore_grade?: string;
}

export interface HealthScore {
  total: number;
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: {
    nutrition: number;
    ingredients: number;
    processing: number;
    profile_match: number;
  };
  ingredient_risks: any[];
}

export interface ScanResult {
  product: Product;
  health_score: HealthScore;
}

export interface BarcodeResult {
  rawValue: string;
  format: string;
  timestamp: number;
}