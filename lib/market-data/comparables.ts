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
const LIVE_COMPARABLES_CACHE_TTL_MS = 30 * 60 * 1000;
const liveComparablesCache = new Map<string, { data: ComparableCompany[]; expiresAt: number }>();
const liveComparablesRequests = new Map<string, Promise<ComparableCompany[]>>();

// Fallback comparables (used when APIs unavailable)
const FALLBACK_COMPARABLES: Record<string, ComparableCompany[]> = {
  ai: [
    {
      name: "AI benchmark peer set",
      industry: "ai",
      stage: "growth",
      valuation: 0,
      fundedDate: "benchmark",
      source: "Fallback generic benchmark - no live comparable API configured",
    },
    {
      name: "AI infrastructure benchmark peer set",
      industry: "ai",
      stage: "series-a",
      valuation: 0,
      fundedDate: "benchmark",
      source: "Fallback generic benchmark - no live comparable API configured",
    },
    {
      name: "AI services benchmark peer set",
      industry: "ai",
      stage: "seed",
      valuation: 0,
      fundedDate: "benchmark",
      source: "Fallback generic benchmark - no live comparable API configured",
    },
  ],
  saas: [
    {
      name: "SaaS benchmark peer set",
      industry: "saas",
      stage: "growth",
      valuation: 0,
      fundedDate: "benchmark",
      source: "Fallback generic benchmark - no live comparable API configured",
    },
    {
      name: "Vertical SaaS benchmark peer set",
      industry: "saas",
      stage: "series-a",
      valuation: 0,
      fundedDate: "benchmark",
      source: "Fallback generic benchmark - no live comparable API configured",
    },
    {
      name: "Fintech SaaS benchmark peer set",
      industry: "saas",
      stage: "seed",
      valuation: 0,
      fundedDate: "benchmark",
      source: "Fallback generic benchmark - no live comparable API configured",
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
      source: "Crunchbase API funding total - verify valuation separately",
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
      source: "AngelList API funding total - verify valuation separately",
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
  const normalizedIndustry = normalizeCachePart(industry || "tech");
  const normalizedStage = normalizeCachePart(stage || "unknown");
  const cacheKey = `${normalizedIndustry}:${normalizedStage}`;
  const now = Date.now();
  const cached = liveComparablesCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const pending = liveComparablesRequests.get(cacheKey);
  if (pending) {
    return pending;
  }

  const request = fetchLiveComparables(industry, stage)
    .then((data) => {
      liveComparablesCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + LIVE_COMPARABLES_CACHE_TTL_MS,
      });
      return data;
    })
    .finally(() => {
      liveComparablesRequests.delete(cacheKey);
    });

  liveComparablesRequests.set(cacheKey, request);
  return request;
}

async function fetchLiveComparables(
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

function normalizeCachePart(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
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
