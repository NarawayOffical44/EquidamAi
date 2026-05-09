/**
 * Structured Report Data Generator
 * Stores auditable report data separately from generated prose.
 */

export interface StructuredReportInput {
  valuation: any;
  methods: any[];
  comparables?: any[];
  dataValidation?: any;
  inputs: any;
}

export async function generateStructuredReport(
  supabase: any,
  input: StructuredReportInput
) {
  const { valuation, methods, comparables = [], dataValidation, inputs } = input;
  const versionNumber = await nextReportVersion(supabase, valuation.id);

  const reportData = {
    valuation_id: valuation.id,
    version_number: versionNumber,
    executive_summary: {
      valuation_range: {
        low: valuation.blended_low_range,
        mid: valuation.blended_weighted_average,
        high: valuation.blended_high_range,
      },
      confidence_level: valuation.confidence_level,
      key_highlights: buildHighlights(inputs),
      key_risks: [
        ...(dataValidation?.warnings || []).map((warning: any) => warning.message),
        ...(dataValidation?.errors || []).map((error: any) => error.message),
      ],
    },
    valuation_methods: Object.fromEntries(
      methods.map((method) => [
        method.method_name,
        {
          estimate: method.mid_estimate,
          low_estimate: method.low_estimate,
          high_estimate: method.high_estimate,
          assumptions: method.assumptions || {},
          rationale: method.key_factors_explanation || method.methodology_explanation || "",
          confidence: method.confidence || "medium",
        },
      ])
    ),
    comparable_analysis: {
      peer_count: comparables.length,
      median_multiple: {
        ev_arr: median(comparables.map((c) => c.valuation_multiples?.ev_arr)),
        valuation_revenue: median(comparables.map((c) => c.valuation_multiples?.valuation_revenue)),
      },
      valuation_by_multiple: {
        ev_arr: (inputs.arr || 0) * median(comparables.map((c) => c.valuation_multiples?.ev_arr)),
        valuation_revenue: (inputs.arr || 0) * median(comparables.map((c) => c.valuation_multiples?.valuation_revenue)),
        valuation_team_size: (inputs.team_size || 0) * median(comparables.map((c) => c.valuation_multiples?.valuation_team_size)),
      },
      data_quality: average(comparables.map((c) => c.data_quality || 0)),
      peer_set_confidence: comparables.length >= 8 ? 80 : comparables.length >= 4 ? 60 : 35,
      selection_notes: comparables.length > 0
        ? "Comparable set selected by stage, industry, revenue scale, growth, data quality, and recency."
        : "No comparable set was available for this valuation.",
    },
    data_sources: {
      arr: { value: inputs.arr || 0, source: "user_input", confidence: inputs.arr ? 90 : 30 },
      growth_rate: { value: inputs.growth_rate || 0, source: "user_input", confidence: inputs.growth_rate ? 90 : 30 },
      team_size: { value: inputs.team_size || 0, source: "user_input", confidence: inputs.team_size ? 90 : 30 },
      total_addressable_market: {
        value: inputs.total_addressable_market || 0,
        source: "user_input",
        confidence: inputs.total_addressable_market ? 70 : 25,
      },
    },
    sensitivity_analysis: {
      base_case: valuation.blended_weighted_average,
      bull_case: {
        assumptions: { growth_multiplier: 1.25, multiple_multiplier: 1.2 },
        valuation: Math.round((valuation.blended_weighted_average || 0) * 1.3),
      },
      bear_case: {
        assumptions: { growth_multiplier: 0.75, multiple_multiplier: 0.8 },
        valuation: Math.round((valuation.blended_weighted_average || 0) * 0.7),
      },
      key_drivers: [
        { metric: "Monthly Growth Rate", impact_percentage: 25 },
        { metric: "Market Multiple", impact_percentage: 20 },
        { metric: "Revenue Quality", impact_percentage: 20 },
      ],
    },
    assumptions_summary: Object.fromEntries(
      methods.flatMap((method) =>
        Object.entries(method.assumptions || {}).map(([key, value]) => [
          `${method.method_name}.${key}`,
          { value, rationale: "Captured from valuation method assumptions.", confidence: 75 },
        ])
      )
    ),
    created_at: new Date().toISOString(),
    generated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("report_data")
    .insert(reportData)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("report_audit_log").insert({
    report_id: data?.id,
    valuation_id: valuation.id,
    action: versionNumber > 1 ? "regenerated" : "generated",
    actor_type: "system",
    details: { version_number: versionNumber },
  });

  return data || reportData;
}

async function nextReportVersion(supabase: any, valuationId: string): Promise<number> {
  const { data } = await supabase
    .from("report_data")
    .select("version_number")
    .eq("valuation_id", valuationId)
    .order("version_number", { ascending: false })
    .limit(1);

  return (data?.[0]?.version_number || 0) + 1;
}

function buildHighlights(inputs: any): string[] {
  return [
    inputs.stage ? `${inputs.stage} stage company` : "Stage captured",
    inputs.arr ? `$${(inputs.arr / 1000000).toFixed(1)}M ARR` : "ARR not available",
    inputs.growth_rate ? `${inputs.growth_rate}% monthly growth` : "Growth not available",
    inputs.team_size ? `${inputs.team_size} team members` : "Team size not available",
  ];
}

function median(values: any[]): number {
  const numeric = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (numeric.length === 0) return 0;
  return numeric[Math.floor(numeric.length / 2)];
}

function average(values: number[]): number {
  const numeric = values.filter((value) => Number.isFinite(value));
  if (numeric.length === 0) return 0;
  return Math.round(numeric.reduce((sum, value) => sum + value, 0) / numeric.length);
}
