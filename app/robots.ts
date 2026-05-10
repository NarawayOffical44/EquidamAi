import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/reviewer-dashboard", "/api", "/dashboard", "/startup"],
    },
    sitemap: "https://equidamai.com/sitemap.xml",
  };
}
