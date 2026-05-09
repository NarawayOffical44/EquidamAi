-- Valuation Evidence Trail & Professional Credibility System
-- Enables auditable valuation with full assumption tracing

-- 1. Valuation Evidence Table (every assumption traced to source)
CREATE TABLE IF NOT EXISTS public.valuation_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,

  -- Type of evidence
  evidence_type VARCHAR NOT NULL CHECK (evidence_type IN ('method_output', 'assumption', 'data_source', 'adjustment')),
  evidence_key VARCHAR NOT NULL, -- e.g., "scorecard_result", "dcf_wacc", "arr_input"

  -- The actual evidence (flexible JSON structure)
  evidence_value JSONB NOT NULL,

  -- Source tracking
  source VARCHAR NOT NULL CHECK (source IN ('user_input', 'website_extracted', 'crunchbase', 'news', 'mca', 'fallback', 'recalculated')),
  source_date TIMESTAMP,
  source_confidence INT CHECK (source_confidence >= 0 AND source_confidence <= 100),

  -- Original input that produced this evidence
  input_data JSONB,

  -- Who/what calculated this
  calculated_by VARCHAR, -- method name or "system"

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_valuation_evidence_valuation_id ON public.valuation_evidence(valuation_id);
CREATE INDEX idx_valuation_evidence_type ON public.valuation_evidence(evidence_type);
CREATE INDEX idx_valuation_evidence_source ON public.valuation_evidence(source);

-- 2. Data Validation Results Storage
ALTER TABLE IF EXISTS public.valuations ADD COLUMN IF NOT EXISTS data_validation_result JSONB DEFAULT NULL;
ALTER TABLE IF EXISTS public.valuations ADD COLUMN IF NOT EXISTS suspicious_flags JSONB DEFAULT NULL;
ALTER TABLE IF EXISTS public.valuations ADD COLUMN IF NOT EXISTS inputs_snapshot JSONB DEFAULT NULL; -- snapshot of all inputs at valuation time

-- 3. Professional Review & Approval
ALTER TABLE IF EXISTS public.valuations ADD COLUMN IF NOT EXISTS professional_review JSONB DEFAULT NULL;
-- Structure: {reviewed_by: uuid, reviewed_at: timestamp, status: 'approved'|'pending'|'rejected', reviewer_notes: string, adjustments: [{field, original, adjusted, reason}], final_valuation: number}

-- 4. Valuation Versions & History
CREATE TABLE IF NOT EXISTS public.valuation_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  version_number INT NOT NULL,

  -- Snapshot of inputs at this version
  inputs_snapshot JSONB NOT NULL,

  -- Snapshot of outputs at this version
  outputs_snapshot JSONB NOT NULL,

  -- What changed from previous version
  changed_inputs JSONB, -- {field: {old_value, new_value}}

  -- Why it changed
  change_reason VARCHAR DEFAULT 'user_updated',

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_valuation_versions_valuation_id ON public.valuation_versions(valuation_id);
CREATE INDEX idx_valuation_versions_number ON public.valuation_versions(valuation_id, version_number);

-- 5. Comparable Companies Selection Storage
CREATE TABLE IF NOT EXISTS public.comparable_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  comparable_id UUID,

  -- Ranking
  relevance_score NUMERIC(3, 2), -- 0.00-1.00
  selection_reason VARCHAR, -- "ARR match, stage match, growth aligned"
  exclusion_reason VARCHAR, -- "outlier", "stale data", "unverified"

  -- Impact
  confidence_contribution INT, -- how much this comparable adds to overall confidence

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comparable_selections_valuation_id ON public.comparable_selections(valuation_id);

-- 6. Enhanced Comparable Companies Table
ALTER TABLE IF EXISTS public.comparable_companies ADD COLUMN IF NOT EXISTS valuation_multiples JSONB DEFAULT NULL;
-- Structure: {ev_arr: 4.5, valuation_revenue: 8.2, valuation_team_size: 500000, arr_per_team_member: 75000}

ALTER TABLE IF EXISTS public.comparable_companies ADD COLUMN IF NOT EXISTS peer_metrics JSONB DEFAULT NULL;
-- Structure: {industry, stage, arr_range, growth_rate_range, team_size_range, funding_rounds, last_funding_date}

ALTER TABLE IF EXISTS public.comparable_companies ADD COLUMN IF NOT EXISTS data_quality INT DEFAULT 50 CHECK (data_quality >= 0 AND data_quality <= 100);
ALTER TABLE IF EXISTS public.comparable_companies ADD COLUMN IF NOT EXISTS data_freshness_date TIMESTAMP;
ALTER TABLE IF EXISTS public.comparable_companies ADD COLUMN IF NOT EXISTS excluded_reasons VARCHAR[] DEFAULT NULL;

-- 7. Report Structured Data (separate from generated text)
CREATE TABLE IF NOT EXISTS public.report_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  version_number INT DEFAULT 1,

  -- Executive Summary
  executive_summary JSONB,
  -- {valuation_range: {low, mid, high}, confidence_level, key_highlights, key_risks}

  -- Method Results
  valuation_methods JSONB,
  -- {scorecard: {estimate, assumptions, rationale}, berkus: {...}, ...}

  -- Comparable Analysis
  comparable_analysis JSONB,
  -- {selected_peers, median_multiple, valuation_by_multiple, confidence, selection_notes}

  -- Data Sources with Confidence
  data_sources JSONB,
  -- {arr: {value, source, date, confidence}, growth_rate: {...}, ...}

  -- Sensitivity Analysis
  sensitivity_analysis JSONB,
  -- {base_case, bull_case, bear_case, key_drivers}

  -- All Assumptions in One Place
  assumptions_summary JSONB,
  -- {discount_rate: {value, rationale}, terminal_growth, exit_multiple, ...}

  -- Professional Review
  professional_review JSONB DEFAULT NULL,
  -- {reviewed_by, reviewed_at, status, reviewer_comments, adjustments, final_valuation}

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_at TIMESTAMP
);

CREATE INDEX idx_report_data_valuation_id ON public.report_data(valuation_id);
CREATE INDEX idx_report_data_version ON public.report_data(valuation_id, version_number);

-- 8. Report Audit Log
CREATE TABLE IF NOT EXISTS public.report_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES public.report_data(id) ON DELETE CASCADE,
  valuation_id UUID REFERENCES public.valuations(id) ON DELETE CASCADE,

  action VARCHAR NOT NULL CHECK (action IN ('generated', 'reviewed', 'regenerated', 'approved', 'rejected')),
  actor_type VARCHAR NOT NULL CHECK (actor_type IN ('system', 'user', 'professional')),
  actor_id UUID,

  details JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_audit_log_report_id ON public.report_audit_log(report_id);
CREATE INDEX idx_report_audit_log_valuation_id ON public.report_audit_log(valuation_id);

-- 9. Email Nurture Sequence Enhancements
ALTER TABLE IF EXISTS public.email_sequence_leads ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
ALTER TABLE IF EXISTS public.email_sequence_leads ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP DEFAULT NULL;
ALTER TABLE IF EXISTS public.email_sequence_leads ADD COLUMN IF NOT EXISTS last_error VARCHAR DEFAULT NULL;
ALTER TABLE IF EXISTS public.email_sequence_leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE IF EXISTS public.email_sequence_leads ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP DEFAULT NULL;
ALTER TABLE IF EXISTS public.email_sequence_leads ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP DEFAULT NULL;
ALTER TABLE IF EXISTS public.email_sequence_leads ADD COLUMN IF NOT EXISTS segment VARCHAR DEFAULT 'general'; -- large_valuation, early_stage, high_confidence, at_risk

-- Email Events Tracking
CREATE TABLE IF NOT EXISTS public.email_sequence_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_sequence_lead_id UUID NOT NULL REFERENCES public.email_sequence_leads(id) ON DELETE CASCADE,

  email_type VARCHAR NOT NULL CHECK (email_type IN ('day_1', 'day_3', 'day_7')),
  event_type VARCHAR NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked', 'failed', 'bounced', 'unsubscribed')),

  metadata JSONB, -- {ip, user_agent, link_clicked, bounce_code, etc.}

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_sequence_events_lead_id ON public.email_sequence_events(email_sequence_lead_id);
CREATE INDEX idx_email_sequence_events_type ON public.email_sequence_events(event_type);
CREATE INDEX idx_email_sequence_events_created_at ON public.email_sequence_events(created_at);

-- RLS: Enable on all new tables
ALTER TABLE public.valuation_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparable_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own valuations' evidence/reports)
CREATE POLICY "Users see own valuation evidence"
  ON public.valuation_evidence FOR SELECT
  USING (
    valuation_id IN (
      SELECT id FROM public.valuations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users see own report data"
  ON public.report_data FOR SELECT
  USING (
    valuation_id IN (
      SELECT id FROM public.valuations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users see own email events"
  ON public.email_sequence_events FOR SELECT
  USING (
    email_sequence_lead_id IN (
      SELECT id FROM public.email_sequence_leads WHERE user_id = auth.uid()
    )
  );
