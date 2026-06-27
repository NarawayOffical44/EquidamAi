import { blogArticles } from "@/lib/blog/articles";
import { getPublishedMarketingBlogPosts } from "@/lib/marketing/blog-posts";

export const dynamic = "force-dynamic";

const BASE_URL = "https://equidamai.com";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, images: { loc: string; title: string; caption?: string }[]) {
  const imageXml = images
    .map((img) => {
      const caption = img.caption ? `\n      <image:caption>${escapeXml(img.caption)}</image:caption>` : "";
      return `  <image:image>\n      <image:loc>${escapeXml(img.loc)}</image:loc>\n      <image:title>${escapeXml(img.title)}</image:title>${caption}\n    </image:image>`;
    })
    .join("\n    ");
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    ${imageXml}\n  </url>`;
}

export async function GET() {
  const marketingPosts = await getPublishedMarketingBlogPosts(100);

  const staticEntries = [
    urlEntry(`${BASE_URL}/`, [
      { loc: `${BASE_URL}/logo.png`, title: "Evaldam AI Logo" },
      { loc: `${BASE_URL}/og-image.svg`, title: "Evaldam AI - Professional Startup Valuations", caption: "AI startup valuation platform for founders, advisors, and investors" },
    ]),
    urlEntry(`${BASE_URL}/pricing`, [
      { loc: `${BASE_URL}/opengraph-image`, title: "Evaldam AI Pricing Plans" },
    ]),
    urlEntry(`${BASE_URL}/free-valuation`, [
      { loc: `${BASE_URL}/free-valuation/opengraph-image`, title: "Free Startup Valuation Calculator" },
    ]),
    urlEntry(`${BASE_URL}/github-valuation`, [
      { loc: `${BASE_URL}/github-valuation/opengraph-image`, title: "GitHub Repo Startup Valuation Tool" },
    ]),
    urlEntry(`${BASE_URL}/comparable-companies`, [
      { loc: `${BASE_URL}/comparable-companies/opengraph-image`, title: "Startup Comparables & Peer Benchmarks" },
    ]),
    urlEntry(`${BASE_URL}/blog`, [
      { loc: `${BASE_URL}/blog/opengraph-image`, title: "Evaldam AI Startup Valuation Blog" },
    ]),
  ];

  const staticBlogEntries = blogArticles.map((article) =>
    urlEntry(`${BASE_URL}/blog/${article.slug}`, [
      { loc: `${BASE_URL}/opengraph-image`, title: escapeXml(article.title) },
    ])
  );

  const marketingBlogEntries = marketingPosts
    .filter((post) => post.imageUrl)
    .map((post) =>
      urlEntry(`${BASE_URL}/blog/${post.slug}`, [
        { loc: post.imageUrl!, title: post.imageAlt || post.title },
      ])
    );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...staticEntries, ...staticBlogEntries, ...marketingBlogEntries].join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
