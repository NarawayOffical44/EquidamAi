import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/pricing",
        "/login",
        "/signup",
        "/free-valuation",
        "/contact",
        "/terms",
        "/privacy",
        "/methodology",
        "/comparable-companies",
        "/valuation-report",
        "/github-valuation",
        "/why-evaldam",
        "/case-studies",
        "/faq",
        "/videos/evaldam-intro",
        "/llms.txt",
      ],
      disallow: [
        "/dashboard",
        "/startup",
        "/admin",
        "/reviewer-dashboard",
        "/share/",
        "/api/",
        "/checkout",
        "/success",
      ],
      crawlDelay: 1,
    },
    sitemap: [
      "https://equidamai.com/sitemap.xml",
      "https://equidamai.com/sitemap-images.xml",
    ],
  };
}
