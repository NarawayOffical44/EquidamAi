import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        // private / noindex areas (prevent crawl waste + accidental indexing)
        "/admin",
        "/dashboard",
        "/login",
        "/signup",
        "/checkout",
        "/onboarding",
        "/subscription",
        "/success",
        "/valuation-history",
        "/reviewer-dashboard",
        "/training",
        "/share/",
        "/team/accept-invite",
        "/startup/",
      ],
    },
    sitemap: [
      "https://equidamai.com/sitemap.xml",
      "https://equidamai.com/sitemap-images.xml",
      "https://equidamai.com/video-sitemap.xml",
    ],
  };
}
