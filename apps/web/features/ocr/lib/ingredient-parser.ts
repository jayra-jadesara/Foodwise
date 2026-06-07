// ─────────────────────────────────────────────
// FoodWise · OCR · Ingredient Parser
// No AI, no API — pure text processing
//
// Handles:
//  • Comma-separated lists
//  • Bracket sub-ingredients: Sugar (Glucose, Fructose)
//  • "Contains:" declarations
//  • E-numbers: E102, E-102, INS 102, INS102
//  • Percentage declarations: Sugar (25%)
//  • Multi-line OCR artifacts
//  • Indian English spelling variants
// ─────────────────────────────────────────────

import type { IngredientAnnotation, RiskLevel, RiskSummary } from "../types";
import {
  INGREDIENT_DATABASE,
  MATCH_INDEX,
  type IngredientEntry,
} from "./ingredient-database";

export interface ParsedAnalysis {
  ingredients: IngredientAnnotation[];
  risk_summary: RiskSummary;
  ai_verdict: string;
  detected_natural: string[];
  raw_tokens: string[];
}

// ─────────────────────────────────────────────
// STEP 1: Clean & extract ingredient section
// ─────────────────────────────────────────────
const INGREDIENT_HEADER = /ingredients?\s*:?\s*|composition\s*:?\s*|contains?\s*:?\s*|ingrédients?\s*:?\s*|zutaten\s*:?\s*/gi;

const STOP_SECTION = /nutrition\s+facts?|nutritional\s+info|allergen\s+(info|advice|warning)|best\s+before|storage|directions?\s+for|manufactured\s+by|net\s+weight|mkd\s+by|mfg\s+by|\d{3,}\s*(kcal|kj|cal)\b/i;

export function extractIngredientSection(rawText: string): string {
  const lines = rawText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (INGREDIENT_HEADER.test(lines[i]!)) {
      startIdx = i;
      INGREDIENT_HEADER.lastIndex = 0;
      break;
    }
    INGREDIENT_HEADER.lastIndex = 0;
  }

  if (startIdx === -1) return rawText.slice(0, 3000); // no header — try full text

  const collected: string[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    if (i > startIdx && STOP_SECTION.test(lines[i]!)) break;
    collected.push(lines[i]!);
    if (collected.join(" ").length > 3000) break;
  }

  return collected.join(" ");
}

// ─────────────────────────────────────────────
// STEP 2: Tokenize ingredient text into atoms
// ─────────────────────────────────────────────
export function tokenizeIngredients(text: string): string[] {
  // 1. Strip the header itself
  let cleaned = text.replace(INGREDIENT_HEADER, "").trim();
  INGREDIENT_HEADER.lastIndex = 0;

  // 2. Normalize OCR artifacts
  cleaned = cleaned
    .replace(/\|/g, "l")          // pipe → l (common OCR error)
    .replace(/0(?=[a-z])/gi, "o") // zero → o before letters
    .replace(/1(?=[a-z])/gi, "l") // one → l before letters
    .replace(/\s{2,}/g, " ")
    .replace(/[""'']/g, '"')      // smart quotes
    .replace(/–|—/g, "-");

  // 3. Flatten bracket sub-lists: "Sugar (Glucose, Fructose)" → "Sugar, Glucose, Fructose"
  //    but preserve E-number brackets: "Yellow (E102)" → "E102"
  cleaned = cleaned.replace(/\(([^)]*)\)/g, (_, inner: string) => {
    // If inner is just a percentage or weight, drop it
    if (/^\s*\d+\.?\d*\s*%?\s*$/.test(inner)) return "";
    // Otherwise comma-separate with surrounding context
    return `, ${inner},`;
  });

  // 4. Split on commas and semicolons
  const tokens = cleaned
    .split(/[,;]+/)
    .map((t) =>
      t
        .trim()
        .replace(/^(and|or|contains|also contains)\s+/i, "")
        .replace(/\s*\*+\s*$/, "") // strip trailing asterisks
        .trim()
    )
    .filter((t) => t.length > 1 && t.length < 80); // discard noise tokens

  return [...new Set(tokens)]; // deduplicate
}

// ─────────────────────────────────────────────
// STEP 3: Match a single token against the DB
// ─────────────────────────────────────────────
const E_NUMBER_RE = /\b(?:e[-\s]?|ins[-\s]?)(\d{3,4}[a-z]?)\b/gi;
const INS_NUMBER_RE = /\bins[-\s]?(\d{3,4}[a-z]?)\b/gi;

function matchToken(token: string): IngredientEntry | null {
  // Normalize: remove dots and extra spaces 
  const lower = token?.toLowerCase()?.replace(/[\s.]/g, "");

  // 1. Direct full match
  if (MATCH_INDEX.has(lower)) {
    return INGREDIENT_DATABASE[MATCH_INDEX.get(lower)!]!;
  }

  // 2. INS / E-Number Specific Logic
  const digits = token?.match(/\d{3,4}/);
  if (digits) {
    const num = digits[0];
    // Check for "ins627" or "e627"
    // Search DB entries specifically for the e_number/ins number
    const entryByNumber = INGREDIENT_DATABASE.find(i =>
      i.e_number?.replace(/\D/g, "").includes(num)
    );
    if (entryByNumber) return entryByNumber;
  }

  // 3. Fallback to substring search (Cinnamon, etc)
  for (const entry of INGREDIENT_DATABASE) {
    if (entry.matches.some(m => lower?.includes(m.toLowerCase().replace(/[\s.]/g, "")))) {
      return entry;
    }
  }

  // 2. Partial substring match (scan each DB entry's match list)
  for (const [matchStr, idx] of MATCH_INDEX.entries()) {
    if (lower.includes(matchStr) || matchStr.includes(lower)) {
      // Only accept if the overlap is significant (≥5 chars or full word)
      if (matchStr.length >= 5 || lower.includes(` ${matchStr}`) || lower.startsWith(matchStr)) {
        return INGREDIENT_DATABASE[idx]!;
      }
    }
  }

  // 3. E-number / INS extraction
  E_NUMBER_RE.lastIndex = 0;
  let m = E_NUMBER_RE.exec(lower);
  if (m) {
    const eKey = `e${m[1]}`;
    if (MATCH_INDEX.has(eKey)) return INGREDIENT_DATABASE[MATCH_INDEX.get(eKey)!]!;
    const insKey = `ins${m[1]}`;
    if (MATCH_INDEX.has(insKey)) return INGREDIENT_DATABASE[MATCH_INDEX.get(insKey)!]!;
    const insSpaceKey = `ins ${m[1]}`;
    if (MATCH_INDEX.has(insSpaceKey)) return INGREDIENT_DATABASE[MATCH_INDEX.get(insSpaceKey)!]!;
  }

  return null;
}

// ─────────────────────────────────────────────
// STEP 4: Build risk summary from findings
// ─────────────────────────────────────────────
const RISK_RANK: Record<RiskLevel, number> = {
  high: 4, moderate: 3, low: 2, safe: 1, unknown: 0,
};

function overallRisk(ingredients: IngredientAnnotation[]): RiskLevel {
  if (ingredients.length === 0) return "unknown";
  const worst = ingredients.reduce(
    (max, i) => (RISK_RANK[i.risk] > RISK_RANK[max] ? i.risk : max),
    "safe" as RiskLevel
  );
  return worst;
}

function buildVerdict(
  ingredients: IngredientAnnotation[],
  detectedNatural: string[],
  overall: RiskLevel
): string {
  const high = ingredients.filter((i) => i.risk === "high");
  const moderate = ingredients.filter((i) => i.risk === "moderate");

  if (overall === "safe" && detectedNatural.length > 0) {
    return `This product appears to contain mostly natural ingredients (${detectedNatural.slice(0, 3).join(", ")}). No high-risk additives were detected in the ingredient list.`;
  }
  if (high.length > 0) {
    const names = high.slice(0, 3).map((i) => i.name).join(", ");
    return `⚠️ This product contains ${high.length} high-risk ingredient${high.length > 1 ? "s" : ""}: ${names}. ${moderate.length > 0 ? `Additionally, ${moderate.length} moderate-risk additive${moderate.length > 1 ? "s were" : " was"} found.` : ""} Consider choosing an alternative with a cleaner label.`;
  }
  if (moderate.length > 0) {
    return `This product contains ${moderate.length} moderate-risk additive${moderate.length > 1 ? "s" : ""}. These are generally permitted but worth monitoring, especially for regular consumption.`;
  }
  return "No significant additives detected. The ingredient list appears relatively clean, though always check for personal allergens.";
}

// ─────────────────────────────────────────────
// MAIN EXPORT: analyzeIngredients
// ─────────────────────────────────────────────
export function analyzeIngredients(ingredientSection: string): ParsedAnalysis {
  const tokens = tokenizeIngredients(ingredientSection);
  const seenEntries = new Set<number>(); // prevent duplicate DB entries
  const matched: IngredientAnnotation[] = [];
  const unmatched: string[] = [];
  const detectedNatural: string[] = [];

  for (const token of tokens) {
    const entry = matchToken(token);
    if (!entry) {
      if (token.length > 3) unmatched.push(token);
      continue;
    }

    const entryIdx = INGREDIENT_DATABASE.indexOf(entry);
    if (seenEntries.has(entryIdx)) continue;
    seenEntries.add(entryIdx);

    const annotation: IngredientAnnotation = {
      name: entry.name,
      raw: token,
      risk: entry.risk,
      category: entry.category,
      reason: entry.reason,
      ...(entry.alternatives ? { alternatives: entry.alternatives } : {}),
      ...(entry.e_number ? { sources: [`E-number: ${entry.e_number}`] } : {}),
    };

    matched.push(annotation);

    if (entry.risk === "safe" && entry.category === "natural") {
      detectedNatural.push(entry.name);
    }
  }

  // Sort by risk descending
  matched.sort((a, b) => RISK_RANK[b.risk] - RISK_RANK[a.risk]);

  const highCount = matched.filter((i) => i.risk === "high").length;
  const moderateCount = matched.filter((i) => i.risk === "moderate").length;
  const safeCount = matched.filter((i) => i.risk === "safe").length;
  const unknownCount = unmatched.length;
  const overall = overallRisk(matched);

  const topConcerns = matched
    .filter((i) => i.risk === "high" || i.risk === "moderate")
    .slice(0, 5)
    .map((i) => i.name);

  const verdict = buildVerdict(matched, detectedNatural, overall);

  return {
    ingredients: matched,
    detected_natural: detectedNatural,
    raw_tokens: tokens,
    risk_summary: {
      overall_risk: overall,
      high_risk_count: highCount,
      moderate_risk_count: moderateCount,
      safe_count: safeCount,
      unknown_count: unknownCount,
      top_concerns: topConcerns,
    },
    ai_verdict: verdict,
  };
}
