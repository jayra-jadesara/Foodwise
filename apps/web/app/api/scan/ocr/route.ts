import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/shared/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('ocr_analyses').insert({
        user_id: user.id,
        ocr_full_text: data.ocr.ingredient_section,
        ingredient_section: data.ocr.ingredient_section,
        ingredients: JSON.stringify(data.ingredients),
        ai_verdict: data.ai_verdict,
        risk_summary: JSON.stringify(data.risk_summary)
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}