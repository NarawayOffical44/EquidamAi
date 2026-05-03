/**
 * LinkedIn Data Fetcher (via Proxycurl API)
 * Extracts employee count, growth signals, and company profile
 * Uses Proxycurl API as a proxy to LinkedIn public data
 */

import { logger } from "@/lib/utils/logger";

export interface LinkedInData {
  employeeCount?: number;
  yearFounded?: number;
  industry?: string;
  companySize?: "small" | "medium" | "large";
  description?: string;
  website?: string;
}

/**
 * Fetch LinkedIn company data via Proxycurl
 * Note: Requires PROXYCURL_API_KEY in environment
 */
export async function fetchLinkedInData(
  companyName: string,
  websiteUrl?: string
): Promise<Partial<LinkedInData>> {
  try {
    const apiKey = process.env.PROXYCURL_API_KEY;
    if (!apiKey) {
      logger.debug("Proxycurl API key not configured, skipping LinkedIn fetch");
      return {};
    }

    // Try to extract domain from website URL
    let domain = websiteUrl ? new URL(websiteUrl).hostname : companyName;

    const response = await fetch(
      "https://nubela.co/proxycurl/api/v2/linkedin_company_profile",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Accept-Encoding": "gzip, deflate",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    // Add URL params
    const url = new URL(
      "https://nubela.co/proxycurl/api/v2/linkedin_company_profile"
    );
    url.searchParams.append("domain", domain);
    url.searchParams.append("resolve_numeric_id", "true");

    const linkedinResponse = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Accept-Encoding": "gzip, deflate",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!linkedinResponse.ok) {
      logger.debug("LinkedIn profile not found", { domain });
      return {};
    }

    const data = (await linkedinResponse.json()) as any;

    // Parse employee count from description like "10,000+ employees"
    const employeeMatch = data.employee_count_range
      ? parseInt(data.employee_count_range.split("-")[0])
      : undefined;

    return {
      employeeCount: employeeMatch || data.employee_count,
      yearFounded: data.founded_year,
      industry: data.industry,
      companySize: getCompanySizeCategory(employeeMatch),
      description: data.description,
      website: data.website,
    };
  } catch (error) {
    logger.debug("LinkedIn fetch error", {
      error: String(error),
      company: companyName,
    });
    return {};
  }
}

function getCompanySizeCategory(
  count?: number
): "small" | "medium" | "large" | undefined {
  if (!count) return undefined;
  if (count < 50) return "small";
  if (count < 500) return "medium";
  return "large";
}
