/**
 * Public Valuation Fetcher
 * DYNAMIC - Fetches REAL live data from APIs
 * NO hardcoding - All data fetched from real sources
 */

import { logger } from "@/lib/utils/logger";

export interface PublicValuationData {
  knownValuation?: number;
  source: "crunchbase" | "web-search" | "none";
  date?: string;
  roundOrType?: string; // e.g., "Series C", "Acquisition", "IPO"
  confidence: "high" | "medium" | "low";
  note?: string;
}

/**
 * Fetch public valuation data - LIVE from APIs
 * Priority: 1) Crunchbase API 2) Web search for latest news
 */
export async function fetchPublicValuationData(
  companyName: string
): Promise<PublicValuationData> {
  try {
    logger.info("Fetching public valuation data from real sources", {
      company: companyName,
    });

    // Try Crunchbase API first (if configured)
    const crunchbaseApiKey = process.env.CRUNCHBASE_API_KEY;
    if (crunchbaseApiKey) {
      try {
        const crunchbaseResult = await queryCrunchbaseAPI(
          companyName,
          crunchbaseApiKey
        );
        if (crunchbaseResult.knownValuation) {
          logger.info("Found valuation from Crunchbase API", {
            company: companyName,
            valuation: crunchbaseResult.knownValuation,
          });
          return crunchbaseResult;
        }
      } catch (error) {
        logger.debug("Crunchbase API call failed", {
          error: String(error),
          company: companyName,
        });
      }
    }

    // Fallback: Search web for latest valuation news
    try {
      const webSearchResult = await searchWebForValuation(companyName);
      if (webSearchResult.knownValuation) {
        logger.info("Found valuation from web search", {
          company: companyName,
          valuation: webSearchResult.knownValuation,
        });
        return webSearchResult;
      }
    } catch (error) {
      logger.debug("Web search for valuation failed", {
        error: String(error),
        company: companyName,
      });
    }

    // No data found
    logger.debug("No public valuation data found for company", {
      company: companyName,
    });
    return {
      source: "none",
      confidence: "low",
    };
  } catch (error) {
    logger.warn("Public valuation fetch error", {
      error: String(error),
      company: companyName,
    });

    return {
      source: "none",
      confidence: "low",
    };
  }
}

/**
 * Query REAL Crunchbase API for company valuation
 * Requires CRUNCHBASE_API_KEY environment variable
 */
async function queryCrunchbaseAPI(
  companyName: string,
  apiKey: string
): Promise<PublicValuationData> {
  try {
    // Step 1: Search for company by name
    const searchUrl = new URL(
      "https://api.crunchbase.com/api/v4/entities/companies/search"
    );

    const searchResponse = await fetch(searchUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cb-Api-Key": apiKey,
      },
      body: JSON.stringify({
        field_ids: [
          "uuid",
          "name",
          "funding_total",
          "last_funding_date",
          "last_funding_type",
          "post_money_valuation",
        ],
        limit: 1,
        filter_values: [companyName],
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!searchResponse.ok) {
      logger.debug("Crunchbase search returned non-200", {
        status: searchResponse.status,
      });
      return { source: "none", confidence: "low" };
    }

    const searchData = (await searchResponse.json()) as any;
    const entities = searchData.entities || [];

    if (entities.length === 0) {
      logger.debug("No company found in Crunchbase", { companyName });
      return { source: "none", confidence: "low" };
    }

    const company = entities[0];

    // Return the valuation from Crunchbase
    if (company.post_money_valuation) {
      return {
        knownValuation: company.post_money_valuation,
        source: "crunchbase",
        date: company.last_funding_date,
        roundOrType: company.last_funding_type,
        confidence: "high",
        note: `Latest from Crunchbase: ${company.last_funding_type}`,
      };
    }

    if (company.funding_total) {
      // If no post-money valuation, use funding total as estimate
      return {
        knownValuation: company.funding_total,
        source: "crunchbase",
        date: company.last_funding_date,
        roundOrType: "Total Funding",
        confidence: "medium",
        note: "Based on total funding raised",
      };
    }

    return { source: "none", confidence: "low" };
  } catch (error) {
    logger.debug("Crunchbase API error", {
      error: String(error),
      company: companyName,
    });
    return { source: "none", confidence: "low" };
  }
}

/**
 * Search web for latest valuation news
 * Uses web search to find recent funding announcements
 */
async function searchWebForValuation(
  companyName: string
): Promise<PublicValuationData> {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      logger.debug("Valuation news search skipped; NEWS_API_KEY is not configured", {
        companyName,
      });
      return { source: "none", confidence: "low" };
    }

    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set(
      "q",
      `"${companyName}" valuation OR "valued at" OR "post-money" OR acquisition OR IPO`
    );
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "10");

    const response = await fetch(url.toString(), {
      headers: { "X-Api-Key": apiKey },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      logger.debug("NewsAPI valuation search returned non-200", {
        status: response.status,
        companyName,
      });
      return { source: "none", confidence: "low" };
    }

    const data = (await response.json()) as {
      articles?: Array<{
        title?: string;
        description?: string;
        content?: string;
        publishedAt?: string;
      }>;
    };

    for (const article of data.articles || []) {
      const text = [article.title, article.description, article.content]
        .filter(Boolean)
        .join(" ");

      if (!isValuationSignal(text)) continue;

      const knownValuation = parseValuationAmount(text);
      if (!knownValuation) continue;

      return {
        knownValuation,
        source: "web-search",
        date: article.publishedAt,
        roundOrType: extractRoundOrType(text),
        confidence: "medium",
        note: article.title
          ? `Derived from valuation news: ${article.title}`
          : "Derived from valuation news",
      };
    }

    return { source: "none", confidence: "low" };
  } catch (error) {
    logger.debug("Web search error", {
      error: String(error),
      company: companyName,
    });
    return { source: "none", confidence: "low" };
  }
}

function isValuationSignal(text: string): boolean {
  return /valuation|valued at|post[-\s]?money|market cap|acquisition|acquired|ipo/i.test(
    text
  );
}

function parseValuationAmount(text: string): number | undefined {
  const match = text.match(
    /(?:valuation|valued at|post[-\s]?money|market cap|acquisition|acquired|ipo)[^$₹\d]*(?:\$|₹|Rs\.?|INR)?\s*([\d,.]+)\s*(M|B|million|billion|crore|cr|lakh|lac)/i
  );
  if (!match) return undefined;

  const amount = parseFloat(match[1].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return undefined;

  const unit = match[2];
  if (/B|billion/i.test(unit)) return amount * 1000000000;
  if (/crore|cr/i.test(unit)) return amount * 10000000;
  if (/lakh|lac/i.test(unit)) return amount * 100000;
  return amount * 1000000;
}

function extractRoundOrType(text: string): string {
  const series = text.match(/Series\s+([A-Z])/i);
  if (series) return `Series ${series[1].toUpperCase()}`;
  if (/pre[-\s]?seed/i.test(text)) return "Pre-seed";
  if (/seed/i.test(text)) return "Seed";
  if (/acquisition|acquired/i.test(text)) return "Acquisition";
  if (/ipo|market cap/i.test(text)) return "Public market";
  return "Valuation news";
}

/**
 * Compare our valuation against public data
 * Returns analysis of how our valuation compares to known market data
 */
export function compareToPublicValuation(
  ourValuation: number,
  publicData: PublicValuationData
): {
  match: "aligned" | "conservative" | "aggressive";
  variance: number;
  recommendation: string;
} {
  if (!publicData.knownValuation) {
    return {
      match: "aligned",
      variance: 0,
      recommendation: "No public valuation data found for comparison",
    };
  }

  const variance =
    ((ourValuation - publicData.knownValuation) /
      publicData.knownValuation) *
    100;

  if (Math.abs(variance) < 20) {
    return {
      match: "aligned",
      variance,
      recommendation: `Our valuation is within 20% of known market data (${publicData.roundOrType} at $${(publicData.knownValuation / 1000000000).toFixed(1)}B)`,
    };
  } else if (variance < 0) {
    return {
      match: "conservative",
      variance,
      recommendation: `Our valuation is ${Math.abs(variance).toFixed(0)}% below the known valuation of $${(publicData.knownValuation / 1000000000).toFixed(1)}B (${publicData.roundOrType}). Consider if fundamentals have changed since ${publicData.date}.`,
    };
  } else {
    return {
      match: "aggressive",
      variance,
      recommendation: `Our valuation is ${variance.toFixed(0)}% above the known valuation of $${(publicData.knownValuation / 1000000000).toFixed(1)}B (${publicData.roundOrType}). This could indicate improved metrics or changed market conditions since ${publicData.date}.`,
    };
  }
}
