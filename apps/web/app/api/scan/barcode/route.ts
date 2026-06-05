// ─────────────────────────────────────────────
// FoodWise · API Route Handler
// app/api/scan/barcode/route.ts
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { BarcodeInputSchema } from "@/features/scanner/schemas";

const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/barcode-lookup`;

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse + validate input ────────────────
    const body = await req.json();
    const parsed = BarcodeInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Invalid barcode",
          code: "INVALID_BARCODE",
        },
        { status: 400 }
      );
    }

    const { barcode } = parsed.data;

    // ── 2. Get authenticated user (optional) ─────
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ── 3. Delegate to edge function ─────────────
    const edgeRes = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ barcode, user_id: user?.id }),
    });

    const data = await edgeRes.json();

    return NextResponse.json(data, { status: edgeRes.status });
  } catch (err) {
    console.error("[api/scan/barcode]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const runtime = "edge";
