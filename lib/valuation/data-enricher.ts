/**
 * Data Enricher
 * Orchestrates all data fetchers and merges results
 * Populates ConfidenceInputs based on what data is available
 */

import { logger } from "@/lib/utils/logger";
import { fetchCrunchbaseData } from "./data-fetchers/crunchbase-fetcher";
import { fetchLinkedInData } from "./data-fetchers/linkedin-fetcher";
import { fetchNewsSignals } from "./data-fetchers/news-fetcher";
import { fetchMCAData } from "./data-fetchers/mca-fetcher";
import { ConfidenceInputs } from "./confidence-calculator";
import { StartupProfile } from "@/types";

export interface EnrichedData {
  confidence: ConfidenceInputs;
  externalData: {
    crunchbase?: Record<string, any>;
    linkedin?: Record<string, any>;
    news?: Record<string, any>;
    mca?: Record<string, any>;
  };
  extractedRevenue?: number;
  extractedTeamSize?: number;
  enrichmentSources: string[];
}

/**
 * Enrich startup profile with external data from public sources
 * Runs all fetchers in parallel and merges results
 */
export async function enrichStartupData(
  profile: StartupProfile,
  websiteUrl?: string
): Promise<EnrichedData> {
  logger.info("Starting data enrichment", {
    company: profile.companyName,
    sources: ["Crunchbase", "LinkedIn", "News", "MCA"],
  });

  // Run all fetchers in parallel with error handling
  const [crunchbaseResult, linkedinResult, newsResult, mcaResult] =
    await Promise.allSettled([
      fetchCrunchbaseData(profile.companyName, websiteUrl || ""),
      fetchLinkedInData(profile.companyName, websiteUrl),
      fetchNewsSignals(profile.companyName, profile.industry),
      fetchMCAData(profile.companyName),
    ]);

  const crunchbase =
    crunchbaseResult.status === "fulfilled" ? crunchbaseResult.value : {};
  const linkedin =
    linkedinResult.status === "fulfilled" ? linkedinResult.value : {};
  const news =
    newsResult.status === "fulfilled" ? newsResult.value : {};
  const mca = mcaResult.status === "fulfilled" ? mcaResult.value : {};

  logger.info("Data enrichment completed", {
    company: profile.companyName,
    sourceCount: [crunchbase, linkedin, news, mca].filter(
      (d) => Object.keys(d).length > 0
    ).length,
  });

  // Track which sources contributed data
  const enrichmentSources: string[] = [];
  if (Object.keys(crunchbase).length > 0) enrichmentSources.push("Crunchbase");
  if (Object.keys(linkedin).length > 0) enrichmentSources.push("LinkedIn");
  if (Object.keys(news).length > 0) enrichmentSources.push("News");
  if (Object.keys(mca).length > 0) enrichmentSources.push("MCA");

  // Build confidence inputs from enriched data and original profile
  const confidenceInputs: ConfidenceInputs = {
    // Basic info (usually from extraction)
    companyName: !!profile.companyName,
    industry: !!profile.industry,
    description: !!profile.marketDescription,
    foundedYear: !!profile.founded,

    // Financial inputs
    annualRevenue:
      (profile.annualRecurringRevenue ?? 0) > 0 ||
      (mca.annualRevenue ?? 0) > 0,
    growthRate: (profile.monthlyGrowthRate ?? 0) > 0,
    burnRate: false, // Would need explicit data
    runway: false, // Would need explicit data

    // Team inputs
    teamSize:
      (profile.team?.length ?? 0) > 0 || (linkedin.employeeCount ?? 0) > 0,
    founderExits: false, // Would need explicit data
    teamExperience: (profile.team?.length ?? 0) > 0,

    // Market inputs
    tam: (profile.totalAddressableMarket ?? 0) > 0,
    competition: !!profile.competitiveAdvantage,

    // Funding inputs
    fundingRounds:
      (profile.fundingHistory?.length ?? 0) > 0 ||
      (crunchbase.fundingRounds ?? 0) > 0,
    totalRaised:
      (profile.totalFunded ?? 0) > 0 || (crunchbase.totalRaised ?? 0) > 0,
    investors:
      (profile.fundingHistory?.length ?? 0) > 0 ||
      (crunchbase.investors?.length ?? 0) > 0,
    valuation: false, // Only set if we have actual valuation data

    // External data
    employeeCount:
      (linkedin.employeeCount ?? 0) > 0 || (crunchbase.employeeCount ?? 0) > 0,
    mcaFiling: !!mca.cin,
    newsSignals: (news.newsCount ?? 0) > 0,
  };

  // Extract revenue from external sources if not in profile
  let extractedRevenue = profile.annualRecurringRevenue || 0;
  if (extractedRevenue === 0 && mca.annualRevenue) {
    extractedRevenue = mca.annualRevenue;
  }

  // Extract team size from external sources if not in profile
  let extractedTeamSize = profile.team?.length || 0;
  if (extractedTeamSize === 0 && linkedin.employeeCount) {
    extractedTeamSize = linkedin.employeeCount;
  }

  return {
    confidence: confidenceInputs,
    externalData: {
      crunchbase: Object.keys(crunchbase).length > 0 ? crunchbase : undefined,
      linkedin: Object.keys(linkedin).length > 0 ? linkedin : undefined,
      news: Object.keys(news).length > 0 ? news : undefined,
      mca: Object.keys(mca).length > 0 ? mca : undefined,
    },
    extractedRevenue,
    extractedTeamSize,
    enrichmentSources,
  };
}

/**
 * Merge enriched data back into profile for valuation
 * Updates profile with best available data from all sources
 */
export function mergeEnrichedData(
  profile: StartupProfile,
  enrichedData: EnrichedData
): StartupProfile {
  return {
    ...profile,
    // Use extracted values if better than profile values
    annualRecurringRevenue:
      (enrichedData.extractedRevenue ?? 0) > 0
        ? enrichedData.extractedRevenue
        : profile.annualRecurringRevenue,
    team:
      (enrichedData.extractedTeamSize ?? 0) > (profile.team?.length ?? 0)
        ? Array.from(
            { length: enrichedData.extractedTeamSize || 0 },
            (_, i) => ({
              name: `Team Member ${i + 1}`,
              role: "Employee",
              experience: 0,
            })
          )
        : profile.team,

    // Add funding data from Crunchbase if available
    fundingHistory: profile.fundingHistory || (enrichedData.externalData.crunchbase?.totalRaised ? [
      {
        round: "Unknown",
        date: new Date().toISOString(),
        amount: enrichedData.externalData.crunchbase.totalRaised,
      },
    ] : undefined),
    totalFunded:
      enrichedData.externalData.crunchbase?.totalRaised ||
      profile.totalFunded ||
      0,
  };
}
