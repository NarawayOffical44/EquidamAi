import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (
    host === "www.equidamai.com" ||
    (host === "equidamai.com" && forwardedProto === "http")
  ) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.protocol = "https";
    canonicalUrl.host = "equidamai.com";
    return NextResponse.redirect(canonicalUrl, 301);
  }

  if (pathname === "/$") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = "/";
    return NextResponse.redirect(canonicalUrl, 301);
  }

  // Public routes (no auth required)
  const publicRoutes = ["/", "/login", "/signup"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Public path prefixes (no auth required)
  const publicPrefixes = [
    "/pricing",
    "/free-valuation",
    "/contact",
    "/terms",
    "/privacy",
    "/methodology",
    "/comparable-companies",
  ];
  const isPublicPrefix = publicPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Protected routes (auth required)
  const protectedRoutes = [
    "/dashboard",
    "/startup",
    "/valuation-history",
    "/reviewer-dashboard",
    "/success",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const supabaseResponse = NextResponse.next({
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
  if (isProtectedRoute && !isPublicPrefix && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If accessing dashboard without subscription → redirect to pricing
  if (isProtectedRoute && user && !pathname.startsWith("/reviewer-dashboard")) {
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
