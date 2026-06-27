export const dynamic = "force-static";

const BASE_URL = "https://equidamai.com";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>${BASE_URL}/</loc>
    <video:video>
      <video:thumbnail_loc>${BASE_URL}/og-image.svg</video:thumbnail_loc>
      <video:title>Evaldam AI - Startup Valuation Platform Introduction</video:title>
      <video:description>Learn how Evaldam AI helps founders, advisors, and investors create defensible startup valuations with six proven methods, investor-ready reports, and valuation tracking over time.</video:description>
      <video:content_loc>${BASE_URL}/videos/evaldam-intro.mp4</video:content_loc>
      <video:player_loc>${BASE_URL}/</video:player_loc>
      <video:duration>120</video:duration>
      <video:publication_date>2026-01-01T00:00:00+05:30</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:requires_subscription>no</video:requires_subscription>
      <video:live>no</video:live>
    </video:video>
  </url>
</urlset>`;

export async function GET() {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=604800",
    },
  });
}
