import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (no auth required)
  const publicRoutes = ["/", "/login", "/signup"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Protected routes (auth required)
  const protectedRoutes = [
    "/dashboard",
    "/pricing",
    "/startup",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();

  // If public route and user is logged in → redirect to dashboard
  if (isPublicRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If protected route and no user → redirect to login
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If accessing dashboard without subscription → redirect to pricing
  if (pathname === "/dashboard") {
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("plan_active")
        .eq("id", user.id)
        .single();

      if (!userData?.plan_active) {
        return NextResponse.redirect(new URL("/pricing", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)",
  ],
};
