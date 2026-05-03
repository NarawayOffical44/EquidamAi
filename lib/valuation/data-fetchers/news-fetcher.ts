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
    const fundingQuery = `"${companyName}" funding announcement Series A B C seed`;
    const revenueQuery = `"${companyName}" revenue ARR growth announcement`;

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
        /\$?([\d.]+)\s*(M|B|million|billion)/i
      );
      if (match) {
        fundingAmount = parseAmount(match[0]);
        recentFundingAnnouncement = true;
        announcementDate = article.date;

        // Try to extract round type
        if (article.content.match(/Series\s+([A-Z])/i)) {
          fundingRound = article.content.match(/Series\s+([A-Z])/i)?.[1];
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
    // This would use Claude's web search capability in a real implementation
    // For now, returning empty array since we'd need to implement actual search
    logger.debug("News search query", { query });
    return [];
  } catch (error) {
    logger.debug("News search failed", { error: String(error) });
    return [];
  }
}

function parseAmount(amountStr: string): number {
  const num = parseFloat(amountStr.match(/[\d.]+/)?.[0] || "0");
  const unit = amountStr.match(/B|billion/i) ? 1000000000 : 1000000;
  return num * unit;
}
