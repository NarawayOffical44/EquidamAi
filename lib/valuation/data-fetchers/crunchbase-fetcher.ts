/**
 * Crunchbase Data Fetcher
 * Extracts funding, employee count, investors, and valuation data
 * Uses public Crunchbase API endpoints where available
 */

import { logger } from "@/lib/utils/logger";

export interface CrunchbaseData {
  fundingRounds: number;
  totalRaised: number;
  lastFundingDate?: string;
  investors: string[];
  employeeCount?: number;
  publicValuation?: number;
  status: "founder" | "acquired" | "public" | "operating" | "unknown";
}

/**
 * Fetch Crunchbase data for a company
 * Note: Requires CRUNCHBASE_API_KEY in environment
 */
export async function fetchCrunchbaseData(
  companyName: string,
  websiteUrl: string
): Promise<Partial<CrunchbaseData>> {
  try {
    const apiKey = process.env.CRUNCHBASE_API_KEY;
    if (!apiKey) {
      logger.debug("Crunchbase API key not configured, skipping fetch");
      return {};
    }

    // Search for company by name
    const searchResponse = await fetch(
      "https://api.crunchbase.com/api/v4/entities/companies/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Cb-Api-Key": apiKey,
        },
        body: JSON.stringify({
          field_ids: [
            "uuid",
            "name",
            "website",
            "funding_total",
            "last_funding_date",
            "employee_count",
            "company_status",
          ],
          limit: 1,
          filter_values: [companyName],
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!searchResponse.ok) {
      logger.warn("Crunchbase search failed", {
        status: searchResponse.status,
      });
      return {};
    }

    const searchData = (await searchResponse.json()) as any;
    const entities = searchData.entities || [];

    if (entities.length === 0) {
      logger.debug("No Crunchbase company found", { companyName });
      return {};
    }

    const company = entities[0];
    const uuid = company.uuid;

    // Fetch detailed company info
    const detailResponse = await fetch(
      `https://api.crunchbase.com/api/v4/entities/companies/${uuid}`,
      {
        headers: {
          "X-Cb-Api-Key": apiKey,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!detailResponse.ok) {
      return {
        totalRaised: company.funding_total || 0,
        employeeCount: company.employee_count,
        status: (company.company_status || "unknown") as any,
      };
    }

    const detail = (await detailResponse.json()) as any;

    // Extract funding rounds
    const fundingRounds =
      detail.funding_rounds?.length || company.funding_rounds?.length || 0;

    // Extract investors
    const investors = (detail.investors || [])
      .slice(0, 10)
      .map((inv: any) => inv.name || inv.value)
      .filter(Boolean);

    return {
      fundingRounds,
      totalRaised: company.funding_total || detail.funding_total || 0,
      lastFundingDate: company.last_funding_date || detail.last_funding_date,
      investors,
      employeeCount:
        company.employee_count || detail.employee_count,
      status: (company.company_status || detail.status || "unknown") as any,
    };
  } catch (error) {
    logger.warn("Crunchbase fetch error", {
      error: String(error),
      company: companyName,
    });
    return {};
  }
}
