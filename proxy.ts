import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSafeInternalPath(value: string | null) {
  const nextPath = value?.trim() || "";
  if (!nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath.includes("\\")) return "";
  if (nextPath.startsWith("/api/")) return "";
  return nextPath;
}

function withApiTiming(response: NextResponse, pathname: string, startedAt: number) {
  if (!pathname.startsWith("/api/")) return response;

  const durationMs = Date.now() - startedAt;
  response.headers.set("Server-Timing", `proxy;dur=${durationMs}`);
  response.headers.set("X-Proxy-Response-Time", `${durationMs}ms`);

  if (process.env.API_LATENCY_LOGGING_ENABLED === "true") {
    console.info("api_proxy_latency", {
      path: pathname,
      status: response.status,
      durationMs,
    });
  }

  return response;
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });

  return target;
}

export async function proxy(request: NextRequest) {
  const startedAt = Date.now();
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").toLowerCase();
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (
    host === "www.equidamai.com" ||
    (host === "equidamai.com" && forwardedProto === "http")
  ) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.protocol = "https";
    canonicalUrl.host = "equidamai.com";
    return withApiTiming(NextResponse.redirect(canonicalUrl, 301), pathname, startedAt);
  }

  if (pathname === "/$") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = "/";
    return withApiTiming(NextResponse.redirect(canonicalUrl, 301), pathname, startedAt);
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
    "/team/accept-invite",
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
    const nextPath = getSafeInternalPath(request.nextUrl.searchParams.get("next"));
    return withApiTiming(
      copyCookies(supabaseResponse, NextResponse.redirect(new URL(nextPath || "/dashboard", request.url))),
      pathname,
      startedAt
    );
  }

  // If protected route and no user → redirect to login
  if (isProtectedRoute && !isPublicPrefix && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return withApiTiming(
      copyCookies(supabaseResponse, NextResponse.redirect(loginUrl)),
      pathname,
      startedAt
    );
  }

  // If accessing dashboard without subscription → redirect to pricing
  return withApiTiming(supabaseResponse, pathname, startedAt);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap-images.xml|sitemap.xsl|llms.txt|opengraph-image|.*\\.png|.*\\.jpg).*)",
  ],
};
