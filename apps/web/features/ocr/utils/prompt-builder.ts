// ─────────────────────────────────────────────
// FoodWise · OCR Module · AI Prompt Builder
// Builds the system + user prompt for GPT analysis
// ─────────────────────────────────────────────

export const ANALYSIS_SYSTEM_PROMPT = `You are FoodWise, an expert food safety and nutrition analyst.

You will be given an ingredient list extracted from a food product label via OCR.
Your task is to analyse every ingredient and return a structured JSON risk report.

RULES:
1. Parse the ingredient list carefully — OCR may have errors; use context to correct obvious mistakes.
2. Identify and annotate every distinct ingredient individually.
3. Assign a risk level to each:
   - "safe": Whole foods, common natural ingredients with no known concerns.
   - "low": Generally recognised as safe, minor processing concerns.
   - "moderate": Debated additives, high amounts may cause issues.
   - "high": Known health concerns, banned in some countries, or linked to adverse effects.
   - "unknown": Cannot determine from the text provided.
4. Assign a category from: additive, preservative, colorant, sweetener, emulsifier, flavoring, natural, allergen, fat, sugar, thickener, antioxidant, unknown.
5. For moderate and high risk items, provide at least one healthier alternative.
6. Write the ai_verdict as a single paragraph of plain English directed at a consumer — no jargon.
7. The ai_verdict should lead with the most important finding.

CRITICAL: Respond ONLY with valid JSON. No markdown fences, no preamble, no trailing text.
The JSON must exactly match this schema:
{
  "ingredients": [
    {
      "name": "string (normalised)",
      "raw": "string (as in OCR text)",
      "risk": "safe|low|moderate|high|unknown",
      "category": "string (from enum)",
      "reason": "string (1–2 sentences)",
      "sources": ["string"],
      "alternatives": ["string"]
    }
  ],
  "risk_summary": {
    "overall_risk": "safe|low|moderate|high|unknown",
    "high_risk_count": 0,
    "moderate_risk_count": 0,
    "safe_count": 0,
    "unknown_count": 0,
    "top_concerns": ["string (max 5 short phrases)"]
  },
  "ai_verdict": "string"
}`;

export function buildUserPrompt(ingredientText: string): string {
  return `Analyse the following ingredient list extracted via OCR from a food product label:

---
${ingredientText.trim()}
---

Return your analysis as JSON following the schema in your system prompt.`;
}

// ── Ingredient section extractor ──────────────
// Attempts to pull just the ingredient block from full OCR text
export function extractIngredientSection(fullText: string): string {
  const lines = fullText.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  // Look for lines that start with common ingredient headers
  const headerPatterns = [
    /^ingredients?\s*:/i,
    /^ingredient\s+list\s*:/i,
    /^composition\s*:/i,
    /^contains\s*:/i,
    /^ingrédients?\s*:/i,
    /^zutaten\s*:/i,
    /^ingredienti\s*:/i,
  ];

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headerPatterns.some((p) => p.test(lines[i]!))) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    // No header found — return full text and let the AI figure it out
    return fullText;
  }

  // Collect from header line until we hit a likely section break
  const stopPatterns = [
    /^nutrition(al)?\s+(facts|information|value)/i,
    /^allerg(en|y)\s+(information|advice|warning)/i,
    /^best\s+before/i,
    /^storage/i,
    /^directions/i,
    /^serving\s+size/i,
    /^\d{3,}\s*(kcal|kj|cal)/i,
  ];

  const collected: string[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    if (i > startIdx && stopPatterns.some((p) => p.test(lines[i]!))) {
      break;
    }
    collected.push(lines[i]!);
    // Reasonable cutoff
    if (collected.join(" ").length > 2000) break;
  }

  return collected.join(" ");
}
