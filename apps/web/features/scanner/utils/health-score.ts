import type { Product, HealthScore, ScoreBreakdown, IngredientRisk, RiskLevel } from "../types";

// ─── Known risky additives (E-numbers + names) ────────────────
const HIGH_RISK_ADDITIVES: RegExp[] = [
  /e621|monosodium glutamate|msg/i,
  /e951|aspartame/i,
  /e249|e250|e251|e252|nitrite|nitrate/i,
  /e102|tartrazine/i,
  /e110|sunset yellow/i,
  /e122|carmoisine/i,
  /e124|ponceau/i,
  /e129|allura red/i,
  /e211|sodium benzoate/i,
  /e320|bha|butylated hydroxyanisole/i,
  /e321|bht|butylated hydroxytoluene/i,
  /partially hydrogenated|trans fat/i,
  /high.fructose corn syrup/i,
  /palm oil/i,
];

const MODERATE_RISK_ADDITIVES: RegExp[] = [
  /e100|e101|e102|e103|e104|e105/i,
  /e300|e301|e302|e303|e304/i,
  /e400|e401|e402|e403|e404|e405/i,
  /e420|e421|sorbitol|mannitol/i,
  /carrageenan|e407/i,
  /maltodextrin|modified starch/i,
  /sodium caseinate/i,
];

// New rules for the No-AI Engine
export const SMART_RULES = {
  KID_FRIENDLY: [/sugar/i, /syrup/i, /caffeine/i, /color/i, /e129/i],
  NATURAL_HEROES: [/potato/i, /wheat/i, /milk/i, /fruit/i, /vegetable/i, /oats/i],
  ULTRA_PROCESSED: [/maltodextrin/i, /hydrogenated/i, /emulsifier/i, /lecithin/i, /flavor/i]
};

export function getSmartInsights(text: string) {
  const isHighSugar = text.toLowerCase().includes('sugar') || text.toLowerCase().includes('syrup');
  const hasChemicals = SMART_RULES.ULTRA_PROCESSED.some(r => r.test(text));
  const hasNatural = SMART_RULES.NATURAL_HEROES.some(r => r.test(text));

  const badges = [];
  if (!isHighSugar && hasNatural) badges.push({ label: "School Safe", color: "success" });
  if (!hasChemicals) badges.push({ label: "Clean Label", color: "info" });
  if (hasChemicals) badges.push({ label: "Ultra Processed", color: "warning" });

  return badges;
}

// ─── Nutrition scoring (max 40 pts) ───────────────────────────
function scoreNutrition(product: Product): number {
  const n = product?.nutriments || {};
  let score = 40;

  if (n?.energy_kcal_100g !== undefined) {
    if (n?.energy_kcal_100g > 500) score -= 8;
    else if (n?.energy_kcal_100g > 300) score -= 4;
  }

  if (n?.sugars_100g !== undefined && n?.sugars_100g > 15) score -= 10;
  if (n?.salt_100g !== undefined && n?.salt_100g > 1.5) score -= 8;
  if (n?.saturated_fat_100g !== undefined && n?.saturated_fat_100g > 5) score -= 5;

  return Math.max(0, score);
}

// ─── Ingredient scoring (max 30 pts) ──────────────────────────
function scoreIngredients(product: Product): { score: number; risks: IngredientRisk[] } {
  const text = (product.ingredients_text ?? "").toLowerCase();
  const risks: IngredientRisk[] = [];
  let score = 30;

  if (!text) return { score: 20, risks: [] };

  HIGH_RISK_ADDITIVES.forEach(pattern => {
    const match = text.match(pattern);
    if (match) {
      score -= 6;
      risks.push({ name: match[0], risk: "high", reason: "Known health concern" });
    }
  });

  return { score: Math.max(0, score), risks };
}

// ─── NEW: Profile match scoring (max 10 pts) ───────────────────────
// This checks if the product violates the user's allergens set in DB
function scoreProfileMatch(product: Product, userPreferences?: any): number {
  if (!userPreferences?.allergens) return 10; // Default if no prefs set

  const text = (product.ingredients_text ?? "").toLowerCase();
  const allergens = userPreferences.allergens as string[];

  // If any user allergen is found in text, return 0 (Dangerous)
  const hasAllergen = allergens.some(a => text.includes(a.toLowerCase()));

  return hasAllergen ? 0 : 10;
}

// Add this helper function inside the file
function getHealthVerdict(product: any, score: number) {
  const n = product.nutriments;
  const isHighSugar = n.sugars_100g > 15;
  const isUltraProcessed = product.nova_group === 4;
  const isHighSalt = n.salt_100g > 1.2;

  // 1. Critical Warnings for Children
  if (isHighSugar && isUltraProcessed) {
    return "Not recommended for children. High sugar and ultra-processed.";
  }
  if (isHighSugar) {
    return "Limit for children. High sugar content.";
  }
  if (isHighSalt) {
    return "Not suitable for toddlers. High sodium content.";
  }

  // 2. General Verdicts
  if (score >= 80) return "Excellent choice for the whole family!";
  if (score >= 65) return "Good everyday option.";
  if (score >= 45) return "Okay in moderation.";

  return "Avoid if possible. Look for a healthier alternative.";
}

// ─── Main export ───────────────────────────────────────────────
export function computeHealthScore(product: Product, userPreferences?: any): HealthScore {
  const nutritionScore = scoreNutrition(product);
  const { score: ingredientsScore, risks } = scoreIngredients(product);

  // NOVA Score
  const nova = product.nova_group;
  const processingScore = nova === 1 ? 20 : nova === 2 ? 15 : nova === 3 ? 10 : 2;

  const profileScore = scoreProfileMatch(product, userPreferences);

  const total = Math.round(nutritionScore + ingredientsScore + processingScore + profileScore);

  const verdict = getHealthVerdict(product, total);

  const getGrade = (t: number) => {
    if (t >= 80) return "A";
    if (t >= 65) return "B";
    if (t >= 45) return "C";
    if (t >= 25) return "D";
    return "F";
  };

  return {
    total,
    grade: getGrade(total),
    verdict,
    breakdown: {
      nutrition: nutritionScore,
      ingredients: ingredientsScore,
      processing: processingScore,
      profile_match: profileScore,
    },
    ingredient_risks: risks,
    computed_at: new Date().toISOString(),
  };
}