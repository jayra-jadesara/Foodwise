import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // 1. Safety Check: If keys are missing, just continue (prevents 500 error)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) => {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const url = request.nextUrl.clone();

    // 2. Simple Logic: Protect /dashboard and /scan
    const isAppPath = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/scan');

    if (isAppPath && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user && url.pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return supabaseResponse;
  } catch (e) {
    // If anything fails, don't show a 500 error, just show the page
    return supabaseResponse;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};