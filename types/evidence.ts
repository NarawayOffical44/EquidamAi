/**
 * Valuation Evidence & Professional Credibility Types
 * Enables full auditability of valuation calculations
 */

export type EvidenceType = 'method_output' | 'assumption' | 'data_source' | 'adjustment';
export type DataSource = 'user_input' | 'website_extracted' | 'crunchbase' | 'news' | 'mca' | 'fallback' | 'recalculated';

/**
 * Single piece of evidence for a valuation
 * Every number must be traceable to a source
 */
export interface ValuationEvidence {
  id: string;
  valuation_id: string;
  evidence_type: EvidenceType;
  evidence_key: string; // e.g., "scorecard_result", "dcf_wacc", "arr_input"
  evidence_value: any; // flexible structure depending on type
  source: DataSource;
  source_date?: string; // ISO timestamp
  source_confidence: number; // 0-100: how confident is this source
  input_data?: any; // original input that produced this evidence
  calculated_by?: string; // method name or "system"
  created_at: string;
}

/**
 * Data validation result
 * Flags suspicious or incomplete data before valuation
 */
export interface DataValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  needs_verification: string[]; // field names that need manual review
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationError {
  field: string;
  message: string; // fatal error that blocks valuation
}

/**
 * Suspicious data flag
 * E.g., customer concentration risk, stale data, unrealistic metrics
 */
export interface SuspiciousFlag {
  field: string;
  flag: string; // concentration_risk, stale_data, unrealistic_growth, etc.
  impact_on_valuation: number; // -0.20 means reduce by 20%
  recommendation: string;
}

/**
 * Professional review & approval
 * CAs/investors can formally approve a valuation
 */
export interface ProfessionalReview {
  reviewed_by: string; // user_id
  reviewed_at: string; // ISO timestamp
  status: 'approved' | 'pending_review' | 'rejected';
  reviewer_notes: string;
  adjustments?: {
    field: string;
    original_value: any;
    adjusted_value: any;
    reason: string;
  }[];
  final_valuation?: number; // locked if approved
}

/**
 * Complete evidence trail for a valuation
 * Shows every assumption, source, and confidence
 */
export interface ValuationEvidenceTrail {
  valuation_id: string;
  evidence: ValuationEvidence[];
  data_validation: DataValidationResult;
  suspicious_flags: SuspiciousFlag[];
  professional_review?: ProfessionalReview;
  versions: ValuationVersion[];
}

/**
 * Valuation version (for tracking changes over time)
 */
export interface ValuationVersion {
  version_number: number;
  inputs_snapshot: {
    [key: string]: any;
  };
  outputs_snapshot: {
    blended_low_range: number;
    blended_high_range: number;
    blended_weighted_average: number;
    confidence_level: string;
  };
  changed_inputs?: {
    [field: string]: {
      old_value: any;
      new_value: any;
    };
  };
  change_reason: string;
  created_at: string;
}

/**
 * Comparable company selection with rationale
 */
export interface ComparableSelection {
  id: string;
  valuation_id: string;
  comparable_id: string;
  relevance_score: number; // 0.00-1.00
  selection_reason: string; // why this comparable was selected
  exclusion_reason?: string; // if excluded, why
  confidence_contribution: number; // how much this peer contributes to confidence
  comparable?: {
    company_name: string;
    stage: string;
    arr: number;
    growth_rate: number;
    valuation_multiples?: {
      ev_arr: number;
      valuation_revenue: number;
    };
  };
}

/**
 * Benchmark summary (from comparable analysis)
 */
export interface BenchmarkSummary {
  peer_count: number;
  median_multiple: {
    ev_arr: number;
    valuation_revenue: number;
  };
  valuation_by_multiple: {
    ev_arr: number;
    valuation_revenue: number;
    valuation_team_size: number;
  };
  data_quality: number; // 0-100
  peer_set_confidence: number; // 0-100
  selection_rationale: string;
}

/**
 * Report with full structured data (separate from text)
 */
export interface ReportData {
  id: string;
  valuation_id: string;
  version_number: number;
  executive_summary: {
    valuation_range: {
      low: number;
      mid: number;
      high: number;
    };
    confidence_level: 'low' | 'medium' | 'high';
    key_highlights: string[];
    key_risks: string[];
  };
  valuation_methods: {
    [method: string]: {
      estimate: number;
      low_estimate: number;
      high_estimate: number;
      assumptions: any;
      rationale: string;
      confidence: 'low' | 'medium' | 'high';
    };
  };
  comparable_analysis: BenchmarkSummary;
  data_sources: {
    [field: string]: {
      value: any;
      source: DataSource;
      source_date: string;
      source_confidence: number;
    };
  };
  sensitivity_analysis: {
    base_case: number;
    bull_case: {
      assumptions: any;
      valuation: number;
    };
    bear_case: {
      assumptions: any;
      valuation: number;
    };
    key_drivers: {
      metric: string;
      impact_percentage: number;
    }[];
  };
  assumptions_summary: {
    [assumption: string]: {
      value: any;
      rationale: string;
      source?: string;
      confidence?: number;
    };
  };
  professional_review?: ProfessionalReview;
  created_at: string;
  generated_at: string;
}

/**
 * Email sequence event (open, click, sent, failed, etc.)
 */
export interface EmailSequenceEvent {
  id: string;
  email_sequence_lead_id: string;
  email_type: 'day_1' | 'day_3' | 'day_7';
  event_type: 'sent' | 'opened' | 'clicked' | 'failed' | 'bounced' | 'unsubscribed';
  metadata?: {
    ip?: string;
    user_agent?: string;
    link_clicked?: string;
    bounce_code?: string;
  };
  created_at: string;
}
