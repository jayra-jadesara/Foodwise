// ─────────────────────────────────────────────
// FoodWise · Scanner Module · Public API
// ─────────────────────────────────────────────

// Components
export { ScannerView }     from "./components/ScannerView";
export { ScanResultSheet } from "./components/ScanResultSheet";
export { HealthScoreDial } from "./components/HealthScoreDial";
export { NutritionPanel }  from "./components/NutritionPanel";
export { ManualEntryForm } from "./components/ManualEntryForm";
export { ScanHistoryList } from "./components/ScanHistoryList";

// Hooks
export { useCamera } from "./hooks/use-camera";

// Queries
export {
  useBarcodeScan,
  useProduct,
  useScanHistory,
  useClearHistory,
  scannerKeys,
} from "./queries/use-scanner";

// Schemas
export {
  BarcodeInputSchema,
  ManualEntrySchema,
  OFFProductSchema,
  HealthScoreSchema,
  ScanHistoryItemSchema,
} from "./schemas";

// Types
export type {
  ScanMode,
  ScanStatus,
  BarcodeResult,
  Nutriments,
  RiskLevel,
  IngredientRisk,
  Product,
  ScoreBreakdown,
  HealthScore,
  ScanResult,
  ScanHistoryItem,
  BarcodeLookupRequest,
  BarcodeLookupApiResponse,
} from "./types";

// Utils
export { computeHealthScore } from "./utils/health-score";
export { fetchProductMetadata }       from "./utils/off-adapter";
