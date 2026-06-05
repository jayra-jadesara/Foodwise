// ─────────────────────────────────────────────
// FoodWise · Supabase Edge Function
// ocr-analyze/index.ts  —  Deno runtime
//
// Pipeline:
//  1. Validate request — raw base64, no data: prefix
//  2. Google Vision DOCUMENT_TEXT_DETECTION
//  3. Extract ingredient section
//  4. GPT-4o-mini structured JSON analysis
//  5. Validate AI response shape
//  6. Store image (Supabase Storage, best-effort)
//  7. Insert ocr_analyses row
//  8. Return OcrAnalysisResult
// ─────────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_VISION_KEY = Deno.env.get("GOOGLE_VISION_API_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Inline types (Deno edge fn is isolated) ───
interface IngredientAnnotation {
  name: string;
  raw: string;
  risk: "safe" | "low" | "moderate" | "high" | "unknown";
  category: string;
  reason: string;
  sources?: string[];
  alternatives?: string[];
}

interface AiPayload {
  ingredients: IngredientAnnotation[];
  risk_summary: {
    overall_risk: "safe" | "low" | "moderate" | "high" | "unknown";
    high_risk_count: number;
    moderate_risk_count: number;
    safe_count: number;
    unknown_count: number;
    top_concerns: string[];
  };
  ai_verdict: string;
}

// ── Validation helpers ─────────────────────────
function isValidBase64(s: string): boolean {
  // Must not contain data: prefix — we always want raw base64
  if (s.startsWith("data:")) return false;
  if (s.length < 1000) return false; // too short to be a real image
  return /^[A-Za-z0-9+/]+=*$/.test(s.slice(0, 100)); // spot-check first 100 chars
}

// ── Google Vision OCR ──────────────────────────
async function runVisionOCR(
  base64: string
): Promise<{ fullText: string; confidence: number }> {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
            imageContext: { languageHints: ["en", "fr", "de", "it", "es", "hi"] },
          },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    }
  );

  if (!res.ok) {
    const msg = await res.text();
    throw Object.assign(new Error(`Vision API error: ${res.status}`), {
      code: "OCR_FAILED",
      detail: msg,
    });
  }

  const json = await res.json();
  const annotation = json.responses?.[0]?.fullTextAnnotation;

  if (!annotation?.text?.trim()) {
    throw Object.assign(new Error("No text detected in image"), {
      code: "NO_TEXT_FOUND",
    });
  }

  // Average block confidence
  let total = 0, count = 0;
  for (const page of annotation.pages ?? []) {
    for (const block of page.blocks ?? []) {
      total += block.confidence ?? 0;
      count++;
    }
  }

  return {
    fullText: annotation.text as string,
    confidence: count > 0 ? total / count : 0.5,
  };
}

// ── Extract ingredient section ─────────────────
function extractIngredientSection(fullText: string): string {
  const lines = fullText
    .split(/\n+/)
    .map((l: string) => l.trim())
    .filter(Boolean);

  const headerPatterns = [
    /^ingredients?\s*:/i,
    /^ingredient\s+list\s*:/i,
    /^composition\s*:/i,
    /^contains\s*:/i,
    /^ingrédients?\s*:/i,
    /^zutaten\s*:/i,
    /^ingredienti\s*:/i,
    /^ingredientes?\s*:/i,
    /^सामग्री\s*:/i,
  ];

  const stopPatterns = [
    /^nutrition(al)?\s+(facts?|information|value)/i,
    /^allerg(en|y)\s+(information|advice|warning|declaration)/i,
    /^best\s+before/i,
    /^expiry/i,
    /^storage\s+(condition|instruction)/i,
    /^directions?\s+(for\s+use)?/i,
    /^manufactured\s+by/i,
    /^\d{3,}\s*(kcal|kj)/i,
  ];

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headerPatterns.some((p) => p.test(lines[i]!))) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    // No header — return the first 2000 chars and let GPT figure it out
    return fullText.slice(0, 2000);
  }

  const collected: string[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    if (i > startIdx && stopPatterns.some((p) => p.test(lines[i]!))) break;
    collected.push(lines[i]!);
    if (collected.join(" ").length > 2500) break;
  }

  return collected.join(" ");
}

// ── OpenAI analysis ────────────────────────────
async function analyzeIngredients(ingredientText: string): Promise<AiPayload> {
  const systemPrompt = `You are FoodWise, a food safety and nutrition expert.
Analyse the ingredient list below and return a structured JSON risk report.

Rules:
- Identify EVERY distinct ingredient individually.
- risk must be one of: "safe", "low", "moderate", "high", "unknown"
- category must be one of: additive, preservative, colorant, sweetener, emulsifier, flavoring, natural, allergen, fat, sugar, thickener, antioxidant, unknown
- For moderate/high risk items always include at least 1 alternative.
- ai_verdict must be a single plain-English paragraph for a consumer — no jargon. Lead with the most important finding.
- RESPOND ONLY WITH VALID JSON. No markdown, no preamble, no code fences.

Required JSON schema:
{
  "ingredients": [
    { "name": "string", "raw": "string", "risk": "string", "category": "string", "reason": "string", "sources": ["string"], "alternatives": ["string"] }
  ],
  "risk_summary": {
    "overall_risk": "string",
    "high_risk_count": 0, "moderate_risk_count": 0, "safe_count": 0, "unknown_count": 0,
    "top_concerns": ["string"]
  },
  "ai_verdict": "string"
}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyse this ingredient list:\n\n${ingredientText.trim()}\n\nReturn JSON only.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(28_000),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw Object.assign(new Error(`OpenAI error: ${res.status}`), {
      code: "AI_FAILED",
      detail: msg,
    });
  }

  const completion = await res.json();
  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) throw Object.assign(new Error("Empty response from AI"), { code: "AI_FAILED" });

  try {
    const parsed = JSON.parse(raw) as AiPayload;
    // Minimal shape validation
    if (!Array.isArray(parsed.ingredients) || parsed.ingredients.length === 0) {
      throw new Error("AI returned no ingredients");
    }
    return parsed;
  } catch (e) {
    throw Object.assign(new Error("Invalid JSON from AI"), { code: "AI_FAILED" });
  }
}

// ── Store image in Supabase Storage ───────────
async function storeImage(
  base64: string,
  userId?: string
): Promise<string | undefined> {
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const folder = userId ?? "anon";
    const path = `ocr/${folder}/${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: false });

    if (error) {
      console.warn("[ocr] storage upload failed (non-fatal):", error.message);
      return undefined;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.warn("[ocr] storage error (non-fatal):", e);
    return undefined;
  }
}

// ── Main handler ──────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== "POST") {
    return Response.json(
      { success: false, error: "Method not allowed", code: "INTERNAL_ERROR" },
      { status: 405, headers: CORS }
    );
  }

  const t0 = Date.now();

  try {
    // ── 1. Parse body ────────────────────────
    let body: { image_base64?: string; mime_type?: string; user_id?: string };
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { success: false, error: "Invalid JSON body", code: "INTERNAL_ERROR" },
        { status: 400, headers: CORS }
      );
    }

    const { image_base64, mime_type = "image/jpeg", user_id } = body;

    // ── 2. Validate base64 ───────────────────
    if (!image_base64 || !isValidBase64(image_base64)) {
      return Response.json(
        {
          success: false,
          error: "Invalid image data. Send raw base64 without data: prefix.",
          code: "INTERNAL_ERROR",
        },
        { status: 400, headers: CORS }
      );
    }

    // ── 3. Vision OCR ────────────────────────
    const { fullText, confidence } = await runVisionOCR(image_base64);

    // ── 4. Extract ingredients section ───────
    const ingredientSection = extractIngredientSection(fullText);

    if (ingredientSection.trim().length < 8) {
      return Response.json(
        {
          success: false,
          error: "No ingredient list found in the image.",
          code: "NO_INGREDIENTS_FOUND",
        },
        { status: 422, headers: CORS }
      );
    }

    // ── 5. AI analysis ───────────────────────
    const aiPayload = await analyzeIngredients(ingredientSection);

    // ── 6. Store image (non-fatal) ────────────
    const imageUrl = await storeImage(image_base64, user_id);

    // ── 7. Insert DB row ─────────────────────
    const { data: saved, error: dbErr } = await supabase
      .from("ocr_analyses")
      .insert({
        user_id: user_id ?? null,
        image_url: imageUrl ?? null,
        ocr_full_text: fullText,
        ocr_confidence: confidence,
        ingredient_section: ingredientSection,
        ingredients: aiPayload.ingredients,
        risk_summary: aiPayload.risk_summary,
        ai_verdict: aiPayload.ai_verdict,
        ai_model: "gpt-4o-mini",
        processing_ms: Date.now() - t0,
      })
      .select("id")
      .single();

    if (dbErr) {
      // Non-fatal: still return the analysis
      console.error("[ocr] db insert error (non-fatal):", dbErr.message);
    }

    // ── 8. Return result ─────────────────────
    const result = {
      id: saved?.id ?? crypto.randomUUID(),
      user_id: user_id ?? null,
      image_url: imageUrl ?? null,
      ocr: {
        full_text: fullText,
        confidence,
        ingredient_section: ingredientSection,
      },
      ingredients: aiPayload.ingredients,
      risk_summary: aiPayload.risk_summary,
      ai_verdict: aiPayload.ai_verdict,
      ai_model: "gpt-4o-mini",
      processing_ms: Date.now() - t0,
      created_at: new Date().toISOString(),
    };

    return Response.json(
      { success: true, data: result },
      { headers: CORS }
    );
  } catch (err: unknown) {
    console.error("[ocr-analyze] unhandled:", err);
    const code = (err as { code?: string }).code ?? "INTERNAL_ERROR";
    const status =
      code === "NO_TEXT_FOUND" || code === "NO_INGREDIENTS_FOUND" ? 422 : 500;

    return Response.json(
      {
        success: false,
        error: (err as Error).message ?? "Internal server error",
        code,
      },
      { status, headers: CORS }
    );
  }
});
