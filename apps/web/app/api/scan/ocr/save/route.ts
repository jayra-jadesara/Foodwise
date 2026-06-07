// ─────────────────────────────────────────────
// FoodWise · API · POST /api/scan/ocr/save
// Persists a locally-computed OCR analysis result
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/shared/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated — skip saving, return success silently
      return NextResponse.json({ success: true, saved: false });
    }

    const body = await req.json();
    console.log(body);
    // const supabase_service = getSupabaseServiceClient();
    const { error } = await supabase.from("ocr_analyses").insert({
      user_id: user.id,
      ocr_full_text: body.ocr_full_text ?? "",
      ocr_confidence: body.ocr_confidence ?? null,
      ingredient_section: body.ingredient_section ?? "",
      ingredients: body.ingredients ?? [],
      risk_summary: body.risk_summary ?? {},
      ai_verdict: body.ai_verdict ?? "",
      ai_model: body.ai_model ?? "local-parser-v1",
      processing_ms: body.processing_ms ?? null,
      image_url: null, // local analysis — no server-stored image
    });

    if (error) {
      console.error("[ocr/save]", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, saved: true });
  } catch (err) {
    console.error("[ocr/save]", err);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
