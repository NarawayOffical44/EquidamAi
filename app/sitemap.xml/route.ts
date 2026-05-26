import { blogArticles } from "@/lib/blog/articles";

const siteUrl = "https://equidamai.com";

type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface RouteConfig {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: ChangeFrequency;
  priority: number;
  order: number;
}

const staticRoutes = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/free-valuation", changeFrequency: "weekly", priority: 0.95 },
  { path: "/india-startup-ai", changeFrequency: "weekly", priority: 0.95 },
  { path: "/github-valuation", changeFrequency: "weekly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/why-evaldam", changeFrequency: "monthly", priority: 0.85 },
  { path: "/valuation-report", changeFrequency: "monthly", priority: 0.85 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/videos/evaldam-intro", changeFrequency: "monthly", priority: 0.8 },
  { path: "/case-studies", changeFrequency: "monthly", priority: 0.75 },
  { path: "/api-docs", changeFrequency: "monthly", priority: 0.75 },
  { path: "/methodology", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/signup", changeFrequency: "monthly", priority: 0.65 },
  { path: "/comparable-companies", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
] satisfies RouteConfig[];

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getSitemapEntries(): SitemapEntry[] {
  const generatedAt = new Date().toISOString();
  const routes = staticRoutes.map((route, index) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: generatedAt,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    order: index,
  }));

  const blogRoutes = blogArticles.map((article, index) => ({
    url: `${siteUrl}/blog/${article.slug}`,
    lastModified: new Date(article.updatedAt).toISOString(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
    order: staticRoutes.length + index,
  }));

  return [...routes, ...blogRoutes].sort((first, second) => {
    if (second.priority !== first.priority) return second.priority - first.priority;
    return first.order - second.order;
  });
}

function renderSitemap(entries: SitemapEntry[]) {
  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export async function GET() {
  return new Response(renderSitemap(getSitemapEntries()), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
