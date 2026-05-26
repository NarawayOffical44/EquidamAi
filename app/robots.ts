import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/blog/",
        "/pricing",
        "/signup",
        "/free-valuation",
        "/india-startup-ai",
        "/contact",
        "/terms",
        "/privacy",
        "/methodology",
        "/comparable-companies",
        "/valuation-report",
        "/github-valuation",
        "/why-evaldam",
        "/case-studies",
        "/api-docs",
        "/faq",
        "/videos/evaldam-intro",
        "/opengraph-image",
        "/logo.png",
        "/sitemap.xml",
        "/sitemap-images.xml",
        "/llms.txt",
      ],
      disallow: [
        "/api/",
      ],
      crawlDelay: 1,
    },
    sitemap: [
      "https://equidamai.com/sitemap.xml",
      "https://equidamai.com/sitemap-images.xml",
    ],
  };
}
