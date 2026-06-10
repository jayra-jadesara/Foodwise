// ─────────────────────────────────────────────
// FoodWise · OCR · Ingredient Parser v2
// KEY FIX: unmatched ingredients now shown as
// "unknown" risk — nothing is silently dropped.
// ─────────────────────────────────────────────

import type { IngredientAnnotation, RiskLevel, RiskSummary } from "../types";
import { INGREDIENT_DATABASE, type IngredientEntry } from "./ingredient-database";

export interface ParsedAnalysis {
  ingredients: IngredientAnnotation[];
  risk_summary: RiskSummary;
  ai_verdict: string;
  detected_natural: string[];
  raw_tokens: string[];
}

const RISK_RANK: Record<RiskLevel, number> = {
  high: 4, moderate: 3, low: 2, safe: 1, unknown: 0,
};

// ─────────────────────────────────────────────
// STEP 1 — Extract ingredient section
// ─────────────────────────────────────────────
const HEADER_RE = /^.{0,25}(?:ingredients?|composition|contains?|ingrédients?|zutaten|ingredientes?)\s*[:\-]?\s*/i;
const STOP_RE = /^(?:nutrition(?:al)?\s+(?:info|facts?|value)|allergen\s+(?:info|advice)|best\s+before|storage|serving\s+size|per\s+100\s*g|manufactured|packed\s+by)/i;

export function extractIngredientSection(rawText: string): string {
  const lines = rawText.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (HEADER_RE.test(lines[i]!)) { startIdx = i; break; }
  }
  if (startIdx === -1) return rawText.slice(0, 3000);

  const collected: string[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    if (i > startIdx && STOP_RE.test(lines[i]!)) break;
    collected.push(lines[i]!);
    if (collected.join(" ").length > 3000) break;
  }
  return collected.join(" ");
}

// ─────────────────────────────────────────────
// STEP 2 — Tokenize
// ─────────────────────────────────────────────
export function tokenizeIngredients(raw: string): string[] {
  let text = raw
    // Strip ingredient header
    .replace(/^.{0,40}(?:ingredients?|composition|contains?)\s*[:\-]?\s*/i, "")
    // OCR noise fixes
    .replace(/\|/g, "l")
    .replace(/l(?=\d)/g, "I")     // l before digit → I (e.g. "lNS 627" → "INS 627")
    .replace(/\b0(?=[a-z])/gi, "o")
    .replace(/\s{2,}/g, " ")
    .replace(/–|—/g, "-");

  // Flatten brackets: "Flavour Enhancer (INS 627, INS 631)" → ", INS 627, INS 631,"
  text = text.replace(/\(([^)]{1,120})\)/g, (_match, inner: string) => {
    // Drop pure percentages/weights
    if (/^\s*[\d.]+\s*[%gmlkGML]?\s*$/.test(inner)) return "";
    return `, ${inner},`;
  });

  return text
    .split(/[,;]+/)
    .map((t) =>
      t
        .trim()
        .replace(/^(?:and|or|also\s+contains|contains)\s+/i, "")
        .replace(/\*+$/, "")
        .trim()
    )
    .filter((t) => t.length >= 2 && t.length <= 100)
    .filter((t, i, arr) => arr.indexOf(t) === i); // dedupe
}

// ─────────────────────────────────────────────
// STEP 3 — Match one token
// Returns DB entry or null
// ─────────────────────────────────────────────

// Build lookup structures once at module load
const MATCH_MAP = new Map<string, IngredientEntry>(); // normalised-match → entry
const ENUM_MAP = new Map<string, IngredientEntry>();   // "627", "330", etc. → entry

for (const entry of INGREDIENT_DATABASE) {
  for (const m of entry.matches) {
    MATCH_MAP.set(m.toLowerCase().replace(/\s+/g, ""), entry);
  }
  if (entry.e_number) {
    const digits = entry.e_number.replace(/\D/g, "");
    if (digits) ENUM_MAP.set(digits, entry);
  }
}

// Extra common Indian-label aliases not in main DB matches
const ALIAS_MAP: Record<string, string> = {
  "ins296": "e296", "ins330": "e330", "ins500": "e500",
  "ins551": "e551", "ins627": "e627", "ins631": "e631",
  "ins621": "e621", "ins211": "e211", "ins102": "e102",
  "ins110": "e110", "ins129": "e129", "ins320": "e320",
  "ins322": "e322", "ins407": "e407", "ins412": "e412",
  "ins415": "e415", "ins471": "e471", "ins481": "e481",
  "ins500ii": "e500", "ins503": "e503",
  // Common OCR misreads
  "acesuifame": "acesulfame", "acesutfame": "acesulfame",
  "sodiumbenzoate": "sodium benzoate",
};

function normalise(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "").replace(/[-_.]/g, "");
}

function matchToken(token: string): IngredientEntry | null {
  const norm = normalise(token);

  // 1. Alias map (handles OCR errors + INS variants)
  if (ALIAS_MAP[norm]) {
    const aliased = ALIAS_MAP[norm]!;
    if (MATCH_MAP.has(aliased)) return MATCH_MAP.get(aliased)!;
  }

  // 2. Direct normalised match
  if (MATCH_MAP.has(norm)) return MATCH_MAP.get(norm)!;

  // 3. Extract any 3–4 digit number (INS/E number)
  const digitMatches = token.match(/\b(\d{3,4})\b/g);
  if (digitMatches) {
    for (const d of digitMatches) {
      if (ENUM_MAP.has(d)) return ENUM_MAP.get(d)!;
    }
  }

  // 4. Substring scan — token contains a known match phrase
  for (const [matchKey, entry] of MATCH_MAP.entries()) {
    if (matchKey.length >= 4 && norm.includes(matchKey)) return entry;
    if (matchKey.length >= 6 && matchKey.includes(norm)) return entry;
  }

  return null;
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// Every token appears in output — unmatched → unknown
// ─────────────────────────────────────────────
export function analyzeIngredients(ingredientSection: string): ParsedAnalysis {
  const tokens = tokenizeIngredients(ingredientSection);
  const seenNames = new Set<string>();
  const matched: IngredientAnnotation[] = [];
  const detectedNatural: string[] = [];

  for (const token of tokens) {
    const entry = matchToken(token);

    if (entry) {
      // DB match
      const key = entry.name;
      if (seenNames.has(key)) continue;
      seenNames.add(key);

      matched.push({
        name: entry.name,
        raw: token,
        risk: entry.risk,
        category: entry.category,
        reason: entry.reason,
        ...(entry.alternatives ? { alternatives: entry.alternatives } : {}),
        ...(entry.e_number ? { sources: [entry.e_number] } : {}),
      });

      if (entry.risk === "safe" && entry.category === "natural") {
        detectedNatural.push(entry.name);
      }
    } else {
      // ── KEY FIX: show ALL unmatched tokens as "unknown" ──
      // This means "Cinnamon", "Black Pepper", "Dry Mango" all appear
      const displayName = token
        .replace(/^(ins|e)[\s-]?\d{3,4}/i, (m) => m.toUpperCase()) // capitalise INS codes
        .replace(/\b\w/g, (c) => c.toUpperCase()); // title case

      if (seenNames.has(displayName.toLowerCase())) continue;
      seenNames.add(displayName.toLowerCase());

      matched.push({
        name: displayName,
        raw: token,
        risk: "unknown",
        category: "unknown",
        reason: "Not found in our ingredient database. Likely a natural ingredient or regional name.",
      });
    }
  }

  // Sort: high → moderate → low → unknown → safe
  matched.sort((a, b) => RISK_RANK[b.risk] - RISK_RANK[a.risk]);

  const highCount     = matched.filter((i) => i.risk === "high").length;
  const moderateCount = matched.filter((i) => i.risk === "moderate").length;
  const safeCount     = matched.filter((i) => i.risk === "safe").length;
  const unknownCount  = matched.filter((i) => i.risk === "unknown").length;

  const topConcerns = matched
    .filter((i) => i.risk === "high" || i.risk === "moderate")
    .slice(0, 5)
    .map((i) => i.name);

  const overall: RiskLevel = matched.reduce(
    (max, i) => (RISK_RANK[i.risk] > RISK_RANK[max] ? i.risk : max),
    "unknown" as RiskLevel
  );

  // Verdict
  const high = matched.filter((i) => i.risk === "high");
  const mod  = matched.filter((i) => i.risk === "moderate");
  let verdict = "";
  if (high.length > 0) {
    verdict = `⚠️ Contains ${high.length} high-risk ingredient${high.length > 1 ? "s" : ""}: ${high.slice(0, 3).map((i) => i.name).join(", ")}.${mod.length > 0 ? ` Also ${mod.length} moderate-risk additive${mod.length > 1 ? "s" : ""}.` : ""} Consider a cleaner alternative.`;
  } else if (mod.length > 0) {
    verdict = `This product has ${mod.length} moderate-risk additive${mod.length > 1 ? "s" : ""}. Generally permitted — consume in moderation.`;
  } else if (safeCount > 0 || unknownCount > 0) {
    verdict = `No high-risk additives detected. ${matched.length} ingredient${matched.length !== 1 ? "s" : ""} found — the label appears relatively clean.`;
  } else {
    verdict = "Could not fully analyse the ingredient list. Check the raw text below.";
  }

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
