import type { MetadataRoute } from "next";
import { blogArticles } from "@/lib/blog/articles";

const siteUrl = "https://equidamai.com";

const staticRoutes = [
  "",
  "/free-valuation",
  "/github-valuation",
  "/methodology",
  "/comparable-companies",
  "/case-studies",
  "/why-evaldam",
  "/pricing",
  "/faq",
  "/contact",
  "/blog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : route === "/blog" ? 0.8 : 0.7,
    })),
    ...blogArticles.map((article) => ({
      url: `${siteUrl}/blog/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
