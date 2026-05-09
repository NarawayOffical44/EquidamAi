/**
 * News Signals Fetcher
 * Searches for funding announcements, revenue mentions, and company news
 * Uses Claude web search to find credible signals
 */

import { logger } from "@/lib/utils/logger";

export interface NewsSignals {
  recentFundingAnnouncement?: boolean;
  fundingAmount?: number;
  fundingRound?: string;
  announcementDate?: string;
  newsCount: number;
  hasRevenueSignals: boolean;
  lastNewsDate?: string;
}

/**
 * Fetch news signals for a company
 * Searches for recent funding announcements and revenue mentions
 */
export async function fetchNewsSignals(
  companyName: string,
  industry?: string
): Promise<Partial<NewsSignals>> {
  try {
    // Search for funding announcements
    const industryTerm = industry ? ` ${industry}` : "";
    const fundingQuery = `"${companyName}"${industryTerm} funding announcement Series A B C seed`;
    const revenueQuery = `"${companyName}"${industryTerm} revenue ARR growth announcement`;

    const [fundingResults, revenueResults] = await Promise.allSettled([
      searchNews(fundingQuery),
      searchNews(revenueQuery),
    ]);

    const fundingNews =
      fundingResults.status === "fulfilled" ? fundingResults.value : [];
    const revenueNews =
      revenueResults.status === "fulfilled" ? revenueResults.value : [];

    // Analyze funding news
    let recentFundingAnnouncement = false;
    let fundingAmount: number | undefined;
    let fundingRound: string | undefined;
    let announcementDate: string | undefined;

    for (const article of fundingNews) {
      const match = article.content.match(
        /(?:\$|₹|Rs\.?|INR)?\s*([\d,.]+)\s*(M|B|million|billion|crore|cr|lakh|lac)/i
      );
      if (match) {
        fundingAmount = parseAmount(match[0]);
        recentFundingAnnouncement = true;
        announcementDate = article.date;

        // Try to extract round type
        if (article.content.match(/Series\s+([A-Z])/i)) {
          fundingRound = `Series ${article.content.match(/Series\s+([A-Z])/i)?.[1]?.toUpperCase()}`;
        } else if (article.content.match(/pre[-\s]?seed/i)) {
          fundingRound = "Pre-seed";
        } else if (article.content.match(/seed|angel/i)) {
          fundingRound = "Seed";
        }
        break; // Use first funding mention
      }
    }

    // Count all relevant news
    const allNews = [...fundingNews, ...revenueNews];
    const uniqueNews = Array.from(
      new Map(allNews.map((n) => [n.url, n])).values()
    );

    logger.info("News signals fetched", {
      company: companyName,
      newsCount: uniqueNews.length,
      hasFunding: recentFundingAnnouncement,
    });

    return {
      recentFundingAnnouncement,
      fundingAmount,
      fundingRound,
      announcementDate,
      newsCount: uniqueNews.length,
      hasRevenueSignals: revenueNews.length > 0,
      lastNewsDate:
        uniqueNews.length > 0 ? uniqueNews[0].date : undefined,
    };
  } catch (error) {
    logger.warn("News fetch error", {
      error: String(error),
      company: companyName,
    });
    return {
      newsCount: 0,
      hasRevenueSignals: false,
    };
  }
}

async function searchNews(query: string): Promise<
  Array<{
    title: string;
    content: string;
    url: string;
    date: string;
  }>
> {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      logger.debug("News search skipped; NEWS_API_KEY is not configured", {
        query,
      });
      return [];
    }

    logger.debug("News search query", { query });

    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "5");

    const response = await fetch(url.toString(), {
      headers: { "X-Api-Key": apiKey },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      logger.debug("NewsAPI returned non-200", {
        status: response.status,
        query,
      });
      return [];
    }

    const data = (await response.json()) as {
      articles?: Array<{
        title?: string;
        description?: string;
        content?: string;
        url?: string;
        publishedAt?: string;
      }>;
    };

    return (data.articles || [])
      .filter((article) => article.title && article.url)
      .map((article) => ({
        title: article.title || "",
        content: [article.title, article.description, article.content]
          .filter(Boolean)
          .join(" "),
        url: article.url || "",
        date: article.publishedAt || new Date().toISOString(),
      }));
  } catch (error) {
    logger.debug("News search failed", { error: String(error) });
    return [];
  }
}

function parseAmount(amountStr: string): number {
  const num = parseFloat(
    amountStr.match(/[\d,.]+/)?.[0].replace(/,/g, "") || "0"
  );
  const unit = amountStr.match(/B|billion/i)
    ? 1000000000
    : amountStr.match(/crore|cr/i)
      ? 10000000
      : amountStr.match(/lakh|lac/i)
        ? 100000
        : 1000000;
  return num * unit;
}
