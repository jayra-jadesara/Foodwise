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

// ─── Nutrition scoring (max 40 pts) ───────────────────────────
function scoreNutrition(product: Product): number {
  const n = product.nutriments;
  let score = 40;

  if (n.energy_kcal_100g !== undefined) {
    if (n.energy_kcal_100g > 500) score -= 8;
    else if (n.energy_kcal_100g > 300) score -= 4;
  }

  if (n.sugars_100g !== undefined && n.sugars_100g > 15) score -= 10;
  if (n.salt_100g !== undefined && n.salt_100g > 1.5) score -= 8;
  if (n.saturated_fat_100g !== undefined && n.saturated_fat_100g > 5) score -= 5;

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

// ─── Main export ───────────────────────────────────────────────
export function computeHealthScore(product: Product, userPreferences?: any): HealthScore {
  const nutritionScore = scoreNutrition(product);
  const { score: ingredientsScore, risks } = scoreIngredients(product);

  // NOVA Score
  const nova = product.nova_group;
  const processingScore = nova === 1 ? 20 : nova === 2 ? 15 : nova === 3 ? 10 : 2;

  const profileScore = scoreProfileMatch(product, userPreferences);

  const total = Math.round(nutritionScore + ingredientsScore + processingScore + profileScore);

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