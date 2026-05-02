/**
 * Live Comparable Company Data
 * Fetches real-time startup valuations and multiples
 */

export interface ComparableCompany {
  name: string;
  industry: string;
  stage: string;
  valuation: number;
  arr?: number;
  multiple?: number;
  fundedDate: string;
  source: string;
}

const CRUNCHBASE_API_KEY = process.env.CRUNCHBASE_API_KEY || "";
const ANGELLIST_API_KEY = process.env.ANGELLIST_API_KEY || "";

// Fallback comparables (used when APIs unavailable)
const FALLBACK_COMPARABLES: Record<string, ComparableCompany[]> = {
  ai: [
    {
      name: "OpenAI",
      industry: "ai",
      stage: "series-c",
      valuation: 80e9,
      fundedDate: "2023",
      source: "Crunchbase",
    },
    {
      name: "Anthropic",
      industry: "ai",
      stage: "series-b",
      valuation: 5e9,
      fundedDate: "2023",
      source: "Crunchbase",
    },
    {
      name: "Scale AI",
      industry: "ai",
      stage: "series-d",
      valuation: 7.3e9,
      fundedDate: "2024",
      source: "Crunchbase",
    },
  ],
  saas: [
    {
      name: "Figma",
      industry: "saas",
      stage: "series-c",
      valuation: 10e9,
      fundedDate: "2021",
      source: "Crunchbase",
    },
    {
      name: "Notion",
      industry: "saas",
      stage: "series-b",
      valuation: 10e9,
      fundedDate: "2021",
      source: "Crunchbase",
    },
    {
      name: "Stripe",
      industry: "saas",
      stage: "private",
      valuation: 95e9,
      fundedDate: "2023",
      source: "Crunchbase",
    },
  ],
};

async function fetchCrunchbaseComparables(
  industry: string,
  stage: string,
  limit: number = 10
): Promise<ComparableCompany[]> {
  if (!CRUNCHBASE_API_KEY) return [];

  try {
    // Crunchbase API endpoint for company search
    const response = await fetch("https://api.crunchbase.com/api/v4/searches/companies", {
      method: "POST",
      headers: {
        "X-Cb-User-Key": CRUNCHBASE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        field_ids: ["short_description", "categories", "funding", "founded_on"],
        order: [{ field_id: "funding_total", sort: "desc" }],
        limit,
        // Filter by industry and stage
        filter_groups: [
          {
            filters: [
              { field_id: "categories", type: "includes", values: [industry] },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return [];

    // Parse and transform response
    const data = await response.json();
    return data.entities?.map((company: any) => ({
      name: company.name,
      industry,
      stage,
      valuation: company.funding_total || 0,
      fundedDate: company.founded_on?.substring(0, 4) || "Unknown",
      source: "Crunchbase API",
    })) || [];
  } catch (error) {
    console.error("Crunchbase API error:", error);
    return [];
  }
}

async function fetchAngelListComparables(
  industry: string,
  stage: string,
  limit: number = 10
): Promise<ComparableCompany[]> {
  if (!ANGELLIST_API_KEY) return [];

  try {
    const response = await fetch(
      `https://api.angel.co/v1/startups/search?data[job_titles]=&data[locations]=${industry}&data[markets]=${stage}&sort=funding&direction=desc&per_page=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${ANGELLIST_API_KEY}`,
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.startups?.map((company: any) => ({
      name: company.name,
      industry,
      stage,
      valuation: company.funding_total || 0,
      arr: company.monthly_recurring_revenue ? company.monthly_recurring_revenue * 12 : undefined,
      fundedDate: company.created_at?.substring(0, 4) || "Unknown",
      source: "AngelList API",
    })) || [];
  } catch (error) {
    console.error("AngelList API error:", error);
    return [];
  }
}

export async function getLiveComparables(
  industry: string,
  stage: string
): Promise<ComparableCompany[]> {
  // Try live APIs first
  let comparables: ComparableCompany[] = [];

  if (CRUNCHBASE_API_KEY) {
    comparables = await fetchCrunchbaseComparables(industry, stage);
  }

  if (comparables.length < 3 && ANGELLIST_API_KEY) {
    const angelListComps = await fetchAngelListComparables(industry, stage);
    comparables = [...comparables, ...angelListComps];
  }

  // Fallback to hardcoded if APIs unavailable
  if (comparables.length === 0) {
    comparables = FALLBACK_COMPARABLES[industry] || FALLBACK_COMPARABLES.saas;
  }

  // Remove duplicates and return top results
  const unique = Array.from(
    new Map(comparables.map((c) => [c.name, c])).values()
  );

  return unique.slice(0, 5);
}

export function calculateIndustryMultiple(
  comparables: ComparableCompany[],
  industry: string
): { avgMultiple: number; medianMultiple: number } {
  const multiples = comparables
    .filter((c) => c.valuation && c.arr && c.arr > 0)
    .map((c) => (c.valuation / c.arr!) as number);

  if (multiples.length === 0) {
    // Fallback multiples by industry
    const defaultMultiples: Record<string, number> = {
      ai: 15,
      saas: 5.7,
      fintech: 4,
      other: 3,
    };
    return {
      avgMultiple: defaultMultiples[industry] || 5,
      medianMultiple: defaultMultiples[industry] || 5,
    };
  }

  const sorted = multiples.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const avg = multiples.reduce((a, b) => a + b, 0) / multiples.length;

  return { avgMultiple: avg, medianMultiple: median };
}
