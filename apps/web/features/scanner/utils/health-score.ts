// ─────────────────────────────────────────────
// FoodWise · Scanner Module · Health Score Engine
// Pure computation — no I/O, runs edge + client
// ─────────────────────────────────────────────

import type { Product, HealthScore, ScoreBreakdown, IngredientRisk, RiskLevel } from "../types";

// ─── Known risky additives (E-numbers + names) ────────────────
const HIGH_RISK_ADDITIVES: RegExp[] = [
  /e621|monosodium glutamate|msg/i,
  /e951|aspartame/i,
  /e621|sodium nitrite/i,
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
];

const MODERATE_RISK_ADDITIVES: RegExp[] = [
  /e100|e101|e102|e103|e104|e105/i, // broad colorings
  /e300|e301|e302|e303|e304/i, // antioxidants
  /e400|e401|e402|e403|e404|e405/i, // thickeners
  /e420|e421|sorbitol|mannitol/i,
  /carrageenan/i,
  /e407/i,
  /maltodextrin/i,
  /sodium caseinate/i,
  /modified starch/i,
];

// ─── Nutrition scoring (max 40 pts) ───────────────────────────
function scoreNutrition(product: Product): number {
  const n = product.nutriments;
  let score = 40;

  // Penalty: calories > 400/100g
  if (n.energy_kcal_100g !== undefined) {
    if (n.energy_kcal_100g > 500) score -= 8;
    else if (n.energy_kcal_100g > 400) score -= 4;
    else if (n.energy_kcal_100g > 300) score -= 2;
  }

  // Penalty: saturated fat
  if (n.saturated_fat_100g !== undefined) {
    if (n.saturated_fat_100g > 10) score -= 8;
    else if (n.saturated_fat_100g > 5) score -= 4;
    else if (n.saturated_fat_100g > 2) score -= 2;
  }

  // Penalty: sugars
  if (n.sugars_100g !== undefined) {
    if (n.sugars_100g > 25) score -= 8;
    else if (n.sugars_100g > 15) score -= 5;
    else if (n.sugars_100g > 10) score -= 2;
  }

  // Penalty: salt
  if (n.salt_100g !== undefined) {
    if (n.salt_100g > 1.5) score -= 6;
    else if (n.salt_100g > 0.75) score -= 3;
  }

  // Bonus: protein
  if (n.proteins_100g !== undefined && n.proteins_100g > 10) score += 2;

  // Bonus: fibre
  if (n.fiber_100g !== undefined && n.fiber_100g > 3) score += 2;

  return Math.max(0, Math.min(40, score));
}

// ─── Ingredient scoring (max 30 pts) ──────────────────────────
function scoreIngredients(product: Product): {
  score: number;
  risks: IngredientRisk[];
} {
  const text = (product.ingredients_text ?? "").toLowerCase();
  const risks: IngredientRisk[] = [];
  let score = 30;

  if (!text) return { score: 20, risks: [] }; // unknown penalty

  for (const pattern of HIGH_RISK_ADDITIVES) {
    const match = text.match(pattern);
    if (match) {
      score -= 6;
      risks.push({
        name: match[0],
        risk: "high" as RiskLevel,
        reason: "Associated with health concerns in studies",
      });
    }
  }

  for (const pattern of MODERATE_RISK_ADDITIVES) {
    const match = text.match(pattern);
    if (match) {
      score -= 3;
      risks.push({
        name: match[0],
        risk: "moderate" as RiskLevel,
        reason: "Processed additive — moderation advised",
      });
    }
  }

  return { score: Math.max(0, Math.min(30, score)), risks };
}

// ─── Processing level scoring (max 20 pts) ────────────────────
function scoreProcessing(product: Product): number {
  const nova = product.nova_group;
  if (!nova) return 10; // unknown
  const map: Record<number, number> = { 1: 20, 2: 15, 3: 10, 4: 2 };
  return map[nova] ?? 10;
}

// ─── Profile match scoring (max 10 pts) ───────────────────────
// Placeholder — personalised scoring uses user profile in full app
function scoreProfileMatch(_product: Product): number {
  return 5;
}

// ─── Grade from total ──────────────────────────────────────────
function totalToGrade(total: number): HealthScore["grade"] {
  if (total >= 80) return "A";
  if (total >= 65) return "B";
  if (total >= 45) return "C";
  if (total >= 25) return "D";
  return "F";
}

// ─── Main export ───────────────────────────────────────────────
export function computeHealthScore(product: Product): HealthScore {
  const nutritionScore = scoreNutrition(product);
  const { score: ingredientsScore, risks } = scoreIngredients(product);
  const processingScore = scoreProcessing(product);
  const profileScore = scoreProfileMatch(product);

  const total = nutritionScore + ingredientsScore + processingScore + profileScore;

  const breakdown: ScoreBreakdown = {
    nutrition: nutritionScore,
    ingredients: ingredientsScore,
    processing: processingScore,
    profile_match: profileScore,
  };

  return {
    total: Math.round(total),
    grade: totalToGrade(total),
    breakdown,
    ingredient_risks: risks,
    computed_at: new Date().toISOString(),
  };
}
