import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const cookieStore = await cookies();

    // Use Service Role to ensure the history is saved regardless of RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Save to ocr_analyses table
    const { error } = await supabase.from('ocr_analyses').insert({
      user_id: user.id,
      ocr_full_text: data.ocr.ingredient_section,
      ingredient_section: data.ocr.ingredient_section,
      ingredients: data.ingredients, // Inserted as JSONB
      ai_verdict: data.ai_verdict,
      risk_summary: data.risk_summary,
      ai_model: 'tesseract-local', // Updated from GPT
      processing_ms: 0
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("OCR Save Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}