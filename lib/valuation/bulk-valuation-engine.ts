import { createClient } from "@/lib/supabase/server";
import { parse } from "papaparse";
import { StartupProfile, BulkValuationRequest } from "@/types";

/**
 * Parse CSV file and validate against template
 */
export async function parseValuationCSV(csvContent: string): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
      complete: (results) => {
        resolve(results.data as Record<string, any>[]);
      },
    });
  });
}

/**
 * Validate a single row of startup data
 */
export function validateStartupRow(row: Record<string, any>, rowNumber: number): {
  valid: boolean;
  data?: Partial<StartupProfile>;
  errors?: string[];
} {
  const errors: string[] = [];
  const data: Partial<StartupProfile> = {
    team: [],
  };

  // Required fields
  if (!row.company_name || typeof row.company_name !== "string") {
    errors.push("company_name is required");
  } else {
    data.companyName = row.company_name.trim();
  }

  if (!row.website_url && !row.pitch_deck_url) {
    errors.push("At least website_url or pitch_deck_url is required");
  } else {
    if (row.website_url) {
      try {
        new URL(row.website_url);
        data.websiteUrl = row.website_url;
      } catch {
        errors.push("Invalid website_url format");
      }
    }
    if (row.pitch_deck_url) {
      data.pitchDeckUrl = row.pitch_deck_url;
    }
  }

  // Optional fields with validation
  if (row.stage) {
    const validStages = ["pre-revenue", "seed", "series-a", "series-b+"];
    if (validStages.includes(row.stage)) {
      data.stage = row.stage as any;
    } else {
      errors.push(`Invalid stage: ${row.stage}`);
    }
  }

  if (row.industry) {
    const validIndustries = ["saas", "ai", "fintech", "deeptech", "other"];
    if (validIndustries.includes(row.industry)) {
      data.industry = row.industry as any;
    } else {
      errors.push(`Invalid industry: ${row.industry}`);
    }
  }

  // Numeric fields
  if (row.arr) {
    const arr = parseFloat(row.arr);
    if (isNaN(arr) || arr < 0) {
      errors.push("Invalid ARR: must be a positive number");
    } else {
      data.annualRecurringRevenue = arr;
    }
  }

  if (row.growth_rate) {
    const growth = parseFloat(row.growth_rate);
    if (isNaN(growth)) {
      errors.push("Invalid growth_rate: must be a number");
    } else {
      data.monthlyGrowthRate = growth;
    }
  }

  if (row.team_size) {
    const size = parseInt(row.team_size);
    if (isNaN(size) || size < 1) {
      errors.push("Invalid team_size: must be a positive integer");
    } else {
      data.team = Array(size).fill(null); // Placeholder
    }
  }

  if (row.founded_year) {
    const year = parseInt(row.founded_year);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear) {
      errors.push(`Invalid founded_year: must be between 1900 and ${currentYear}`);
    } else {
      data.founded = year.toString();
    }
  }

  if (row.tam) {
    const tam = parseFloat(row.tam);
    if (isNaN(tam) || tam < 0) {
      errors.push("Invalid TAM: must be a positive number");
    } else {
      data.totalAddressableMarket = tam;
    }
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Create a batch job and queue items for processing
 */
export async function createBulkValuationBatch(
  userId: string,
  jobName: string,
  csvContent: string,
  valuationMethods: string[],
  includeReportPdf: boolean = false
): Promise<{ batchJobId: string; totalItems: number; validItems: number; errors: string[] }> {
  const supabase = await createClient();

  // Parse CSV
  let csvData: Record<string, any>[] = [];
  try {
    csvData = await parseValuationCSV(csvContent);
  } catch (error: any) {
    throw new Error(`CSV parsing failed: ${error.message}`);
  }

  if (csvData.length === 0) {
    throw new Error("CSV file is empty or has no data rows");
  }

  // Validate all rows
  const validationResults = csvData.map((row, idx) => validateStartupRow(row, idx + 1));
  const validItems = validationResults.filter((r) => r.valid);
  const validationErrors = validationResults
    .map((r, idx) => (r.errors ? `Row ${idx + 1}: ${r.errors.join(", ")}` : null))
    .filter((e) => e !== null) as string[];

  // Create batch job
  const { data: batchJob, error: jobError } = await supabase
    .from("valuation_batch_jobs")
    .insert([
      {
        user_id: userId,
        job_name: jobName,
        status: "pending",
        total_startups: validItems.length,
        valuation_methods: valuationMethods,
        include_report_pdf: includeReportPdf,
        send_email_on_completion: true,
      },
    ])
    .select()
    .single();

  if (jobError) {
    throw new Error(`Failed to create batch job: ${jobError.message}`);
  }

  // Create batch items for valid rows
  const batchItems = validItems.map((validResult, idx) => {
    const row = csvData[idx];
    return {
      batch_job_id: batchJob.id,
      row_number: idx + 1,
      company_name: row.company_name,
      website_url: row.website_url,
      industry: row.industry,
      stage: row.stage,
      arr: row.arr ? parseFloat(row.arr) : null,
      growth_rate: row.growth_rate ? parseFloat(row.growth_rate) : null,
      team_size: row.team_size ? parseInt(row.team_size) : null,
      founded_year: row.founded_year ? parseInt(row.founded_year) : null,
      market_size: row.tam ? parseFloat(row.tam) : null,
      status: "pending",
    };
  });

  const { error: itemsError } = await supabase.from("valuation_batch_items").insert(batchItems);

  if (itemsError) {
    throw new Error(`Failed to create batch items: ${itemsError.message}`);
  }

  // Queue items for processing
  const queueItems = batchItems.map((item, idx) => ({
    batch_job_id: batchJob.id,
    batch_item_id: null, // Will be filled by trigger or separate step
    status: "queued" as const,
    priority: 0,
    attempt_number: 1,
    max_retries: 3,
  }));

  return {
    batchJobId: batchJob.id,
    totalItems: csvData.length,
    validItems: validItems.length,
    errors: validationErrors,
  };
}

/**
 * Get batch job details with items
 */
export async function getBatchJobDetails(batchJobId: string, userId: string) {
  const supabase = await createClient();

  // Verify user owns this batch
  const { data: job, error: jobError } = await supabase
    .from("valuation_batch_jobs")
    .select("*")
    .eq("id", batchJobId)
    .eq("user_id", userId)
    .single();

  if (jobError || !job) {
    throw new Error("Batch job not found");
  }

  // Fetch items
  const { data: items, error: itemsError } = await supabase
    .from("valuation_batch_items")
    .select("*")
    .eq("batch_job_id", batchJobId)
    .order("row_number");

  if (itemsError) {
    throw new Error(`Failed to fetch batch items: ${itemsError.message}`);
  }

  return {
    job,
    items: items || [],
    itemsCount: items?.length || 0,
  };
}

/**
 * Cancel a batch job
 */
export async function cancelBatchJob(batchJobId: string, userId: string) {
  const supabase = await createClient();

  // Verify ownership
  const { data: job, error: checkError } = await supabase
    .from("valuation_batch_jobs")
    .select("user_id")
    .eq("id", batchJobId)
    .single();

  if (checkError || job.user_id !== userId) {
    throw new Error("Unauthorized");
  }

  // Update status
  const { error: updateError } = await supabase
    .from("valuation_batch_jobs")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", batchJobId);

  if (updateError) {
    throw new Error(`Failed to cancel batch: ${updateError.message}`);
  }

  return { success: true };
}
