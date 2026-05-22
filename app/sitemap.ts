import type { MetadataRoute } from "next";
import { blogArticles } from "@/lib/blog/articles";

const siteUrl = "https://equidamai.com";

const staticRoutes = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/free-valuation", changeFrequency: "weekly", priority: 0.95 },
  { path: "/india-startup-ai", changeFrequency: "weekly", priority: 0.95 },
  { path: "/github-valuation", changeFrequency: "weekly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/why-evaldam", changeFrequency: "monthly", priority: 0.85 },
  { path: "/valuation-report", changeFrequency: "monthly", priority: 0.85 },
  { path: "/videos/evaldam-intro", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/case-studies", changeFrequency: "monthly", priority: 0.75 },
  { path: "/api-docs", changeFrequency: "monthly", priority: 0.75 },
  { path: "/methodology", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/comparable-companies", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.5 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.5 },
] satisfies Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...blogArticles.map((article) => ({
      url: `${siteUrl}/blog/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
