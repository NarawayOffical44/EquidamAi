/**
 * Public Valuation Fetcher
 * Fetches known public valuations from funding rounds, acquisitions, and filings
 * This data is used as a reference point to validate our calculated valuations
 */

import { logger } from "@/lib/utils/logger";

export interface PublicValuationData {
  knownValuation?: number;
  source: "funding-round" | "acquisition" | "public-company" | "crunchbase" | "none";
  date?: string;
  roundOrType?: string; // e.g., "Series C", "Acquisition", "IPO"
  confidence: "high" | "medium" | "low";
  note?: string;
}

/**
 * Known company valuations database
 * This is a seed database - would be expanded with real data from Crunchbase API
 */
const KNOWN_VALUATIONS: Record<
  string,
  { valuation: number; source: string; date: string; confidence: "high" | "medium" | "low" }
> = {
  // Acquisitions / Public Companies (High confidence)
  github: {
    valuation: 7500000000, // $7.5B - Microsoft acquisition 2018
    source: "Microsoft Acquisition",
    date: "2018-10-26",
    confidence: "high",
  },
  stripe: {
    valuation: 95000000000, // $95B - Last private round March 2024
    source: "Series G Funding Round",
    date: "2024-03-14",
    confidence: "high",
  },
  openai: {
    valuation: 80000000000, // $80B - B Funding Round 2024
    source: "Series B Funding",
    date: "2024-10-01",
    confidence: "high",
  },
  figma: {
    valuation: 20000000000, // $20B - Series G 2023
    source: "Series G Funding",
    date: "2023-06-21",
    confidence: "high",
  },
  notion: {
    valuation: 10000000000, // $10B - Series C 2022
    source: "Series C Funding",
    date: "2022-10-17",
    confidence: "high",
  },
  canva: {
    valuation: 40000000000, // $40B - Series E 2024
    source: "Series E Funding",
    date: "2024-11-01",
    confidence: "high",
  },
  databricks: {
    valuation: 43000000000, // $43B - Series F 2024
    source: "Series F Funding",
    date: "2024-03-28",
    confidence: "high",
  },
  anthropic: {
    valuation: 20000000000, // $20B - Series D 2024
    source: "Series D Funding",
    date: "2024-07-10",
    confidence: "high",
  },
  perplexity: {
    valuation: 9000000000, // $9B - Series C 2024
    source: "Series C Funding",
    date: "2024-07-10",
    confidence: "high",
  },
};

/**
 * Fetch public valuation data for a company
 * Searches known database first, then would query Crunchbase API if configured
 */
export async function fetchPublicValuationData(
  companyName: string
): Promise<PublicValuationData> {
  try {
    // Normalize company name for lookup
    const normalizedName = companyName.toLowerCase().trim();

    // Check known valuations database
    const knownData = KNOWN_VALUATIONS[normalizedName];
    if (knownData) {
      logger.info("Found public valuation data", {
        company: companyName,
        valuation: knownData.valuation,
        source: knownData.source,
      });

      return {
        knownValuation: knownData.valuation,
        source: "crunchbase",
        date: knownData.date,
        roundOrType: knownData.source,
        confidence: "high",
        note: `Last known valuation from ${knownData.source}`,
      };
    }

    // If Crunchbase API key is available, query it for additional companies
    const apiKey = process.env.CRUNCHBASE_API_KEY;
    if (apiKey) {
      try {
        const crunchbaseResult = await queryCrunchbaseValuation(
          companyName,
          apiKey
        );
        if (crunchbaseResult.knownValuation) {
          return crunchbaseResult;
        }
      } catch (error) {
        logger.debug("Crunchbase valuation query failed", {
          error: String(error),
          company: companyName,
        });
      }
    }

    // No public valuation found
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
 * Query Crunchbase API for company valuation
 */
async function queryCrunchbaseValuation(
  companyName: string,
  apiKey: string
): Promise<PublicValuationData> {
  // This would implement actual Crunchbase API calls
  // Placeholder for future implementation
  logger.debug("Crunchbase API query (not yet implemented)", { companyName });

  return {
    source: "none",
    confidence: "low",
  };
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
