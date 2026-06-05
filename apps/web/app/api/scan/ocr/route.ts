// ─────────────────────────────────────────────
// FoodWise · API Route Handler
// app/api/scan/ocr/route.ts
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { OcrRequestSchema } from "@/features/ocr/schemas";

const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ocr-analyze`;

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
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
  const { data: { user } } = await authClient.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = OcrRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid request", code: "INTERNAL_ERROR" },
        { status: 400 }
      );
    }

    const estimatedBytes = (parsed.data.image_base64.length * 3) / 4;
    if (estimatedBytes > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image too large. Maximum 4 MB.", code: "IMAGE_TOO_LARGE" },
        { status: 413 }
      );
    }

    const user = await getAuthenticatedUser();

    const edgeRes = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        image_base64: parsed.data.image_base64,
        mime_type: parsed.data.mime_type,
        user_id: user?.id,
      }),
    });

    const data = await edgeRes.json();
    return NextResponse.json(data, { status: edgeRes.status });
  } catch (err) {
    console.error("[api/scan/ocr]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs"; // cookies() requires nodejs runtime
