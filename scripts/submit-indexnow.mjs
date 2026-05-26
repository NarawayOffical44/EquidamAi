const siteOrigin = process.env.INDEXNOW_SITE_ORIGIN || "https://equidamai.com";
const sitemapUrl = process.env.INDEXNOW_SITEMAP_URL || `${siteOrigin}/sitemap.xml`;
const indexNowEndpoint = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/IndexNow";
const indexNowKey = process.env.INDEXNOW_KEY || "ca154c5e970c455a88a2d66c1418bdc7";
const keyLocation = process.env.INDEXNOW_KEY_LOCATION || `${siteOrigin}/${indexNowKey}.txt`;

function decodeXml(value) {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function getUrlsFromSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => decodeXml(match[1].trim()))
    .filter((url) => url.startsWith(`${siteOrigin}/`))
    .filter((url, index, urls) => urls.indexOf(url) === index);
}

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function main() {
  const sitemapXml = await fetchText(sitemapUrl);
  const urlList = getUrlsFromSitemap(sitemapXml);

  if (urlList.length === 0) {
    throw new Error(`No ${siteOrigin} URLs found in ${sitemapUrl}`);
  }

  const payload = {
    host: new URL(siteOrigin).hostname,
    key: indexNowKey,
    keyLocation,
    urlList,
  };

  const response = await fetch(indexNowEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.text();

  if (!response.ok) {
    throw new Error(`IndexNow rejected ${urlList.length} URLs: ${response.status} ${responseBody}`);
  }

  console.log(`Submitted ${urlList.length} URLs to IndexNow.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
