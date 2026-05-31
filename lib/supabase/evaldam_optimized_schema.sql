-- Evaldam optimized consolidated schema.
-- Run this once in Supabase SQL Editor after creating the project.
-- It is idempotent: safe to rerun after partial schema/migration attempts.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------------------
-- Account, subscription, onboarding
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_active BOOLEAN NOT NULL DEFAULT false,
  subscription_id TEXT,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  billing_cycle TEXT DEFAULT 'annual',
  enterprise_startup_limit INTEGER DEFAULT 999999,
  enterprise_team_seats INTEGER DEFAULT 50,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  phone TEXT,
  country TEXT,
  timezone TEXT,
  language TEXT DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  verification_token TEXT,
  role TEXT DEFAULT 'user',
  reviewer_specialty TEXT,
  reviewer_status TEXT DEFAULT 'inactive',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_role TEXT,
  onboarding_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  sales_qualification JSONB NOT NULL DEFAULT '{}'::jsonb,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS plan_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'annual',
  ADD COLUMN IF NOT EXISTS enterprise_startup_limit INTEGER DEFAULT 999999,
  ADD COLUMN IF NOT EXISTS enterprise_team_seats INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_digest BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS verification_token TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS reviewer_specialty TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_role TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sales_qualification JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_plan_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_plan_check
  CHECK (plan IN ('free', 'pro', 'plus', 'startup', 'agency', 'business', 'advisor', 'enterprise'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_billing_cycle_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_billing_cycle_check
  CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly', 'annual'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_onboarding_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_onboarding_role_check
  CHECK (onboarding_role IS NULL OR onboarding_role IN ('founder', 'investor_agency'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_subscription_id_unique
  ON public.users(subscription_id)
  WHERE subscription_id IS NOT NULL AND btrim(subscription_id) <> '';
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan_active ON public.users(plan, plan_active);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON public.users(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  startup_count INTEGER NOT NULL DEFAULT 0,
  max_startups INTEGER NOT NULL DEFAULT 1,
  startups_created_this_month INTEGER NOT NULL DEFAULT 0,
  monthly_cycle_start_date DATE DEFAULT CURRENT_DATE,
  last_subscription_renewal_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS startup_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_startups INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS startups_created_this_month INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_cycle_start_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS last_subscription_renewal_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON public.user_profiles(tier);

-- ---------------------------------------------------------------------------
-- Startup workspace and valuation core
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  stage TEXT NOT NULL DEFAULT 'seed',
  founded_year INTEGER,
  founding_year INTEGER,
  headquarters_country TEXT,
  headquarters_city TEXT,
  arr NUMERIC(15, 2) DEFAULT 0,
  mrr NUMERIC(15, 2),
  total_revenue NUMERIC(15, 2),
  burn_rate NUMERIC(15, 2),
  runway_months INTEGER,
  monthly_growth_rate NUMERIC(8, 2) DEFAULT 0,
  yoy_growth_rate NUMERIC(8, 2),
  customer_count INTEGER,
  avg_contract_value NUMERIC(15, 2),
  product_type TEXT,
  industry TEXT,
  sub_industry TEXT,
  target_market TEXT,
  total_addressable_market NUMERIC(15, 2) DEFAULT 0,
  total_addressable_market_usd NUMERIC(15, 2),
  serviceable_addressable_market_usd NUMERIC(15, 2),
  team_size INTEGER DEFAULT 1,
  founder_count INTEGER,
  ceo_name TEXT,
  cto_name TEXT,
  total_funding_raised NUMERIC(15, 2),
  latest_funding_round TEXT,
  latest_funding_amount NUMERIC(15, 2),
  investors TEXT[],
  problem_statement TEXT,
  solution_description TEXT,
  competitive_advantage TEXT,
  key_partnerships TEXT[],
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS founded_year INTEGER,
  ADD COLUMN IF NOT EXISTS founding_year INTEGER,
  ADD COLUMN IF NOT EXISTS headquarters_country TEXT,
  ADD COLUMN IF NOT EXISTS headquarters_city TEXT,
  ADD COLUMN IF NOT EXISTS arr NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mrr NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS burn_rate NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS runway_months INTEGER,
  ADD COLUMN IF NOT EXISTS monthly_growth_rate NUMERIC(8, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yoy_growth_rate NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS customer_count INTEGER,
  ADD COLUMN IF NOT EXISTS avg_contract_value NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS product_type TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS sub_industry TEXT,
  ADD COLUMN IF NOT EXISTS target_market TEXT,
  ADD COLUMN IF NOT EXISTS total_addressable_market NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_addressable_market_usd NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS serviceable_addressable_market_usd NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS founder_count INTEGER,
  ADD COLUMN IF NOT EXISTS ceo_name TEXT,
  ADD COLUMN IF NOT EXISTS cto_name TEXT,
  ADD COLUMN IF NOT EXISTS total_funding_raised NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS latest_funding_round TEXT,
  ADD COLUMN IF NOT EXISTS latest_funding_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS investors TEXT[],
  ADD COLUMN IF NOT EXISTS problem_statement TEXT,
  ADD COLUMN IF NOT EXISTS solution_description TEXT,
  ADD COLUMN IF NOT EXISTS competitive_advantage TEXT,
  ADD COLUMN IF NOT EXISTS key_partnerships TEXT[],
  ADD COLUMN IF NOT EXISTS profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.startups DROP CONSTRAINT IF EXISTS startups_stage_check;
ALTER TABLE public.startups
  ADD CONSTRAINT startups_stage_check
  CHECK (stage IN ('pre-revenue', 'seed', 'series-a', 'series-b', 'series-b+', 'series-c+', 'growth', 'mature'));
ALTER TABLE public.startups DROP CONSTRAINT IF EXISTS startups_status_check;
ALTER TABLE public.startups
  ADD CONSTRAINT startups_status_check
  CHECK (status IN ('active', 'archived', 'inactive'));

CREATE INDEX IF NOT EXISTS idx_startups_user_created ON public.startups(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_startups_status ON public.startups(status);
CREATE INDEX IF NOT EXISTS idx_startups_stage ON public.startups(stage);
CREATE INDEX IF NOT EXISTS idx_startups_industry ON public.startups(industry);
CREATE INDEX IF NOT EXISTS idx_startups_share_token ON public.startups(share_token) WHERE share_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blended_low_range NUMERIC(15, 2),
  blended_high_range NUMERIC(15, 2),
  blended_weighted_average NUMERIC(15, 2),
  blended_median NUMERIC(15, 2),
  confidence_level TEXT,
  data_completeness INTEGER,
  methodology_version TEXT DEFAULT '1.0',
  market_conditions_snapshot JSONB,
  comparable_companies JSONB,
  processing_time_seconds INTEGER,
  ai_model_used TEXT,
  llm_provider TEXT,
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  is_latest BOOLEAN DEFAULT true,
  regenerated_from_valuation_id UUID REFERENCES public.valuations(id),
  methods_results JSONB,
  key_reasons TEXT[],
  data_validation_result JSONB,
  suspicious_flags JSONB,
  inputs_snapshot JSONB,
  professional_review JSONB,
  assigned_reviewer_id UUID REFERENCES public.users(id),
  review_claimed_at TIMESTAMPTZ,
  generated_on_tier TEXT DEFAULT 'free',
  should_watermark BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.valuations
  ADD COLUMN IF NOT EXISTS blended_median NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS methodology_version TEXT DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS market_conditions_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS comparable_companies JSONB,
  ADD COLUMN IF NOT EXISTS processing_time_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS ai_model_used TEXT,
  ADD COLUMN IF NOT EXISTS llm_provider TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS regenerated_from_valuation_id UUID REFERENCES public.valuations(id),
  ADD COLUMN IF NOT EXISTS methods_results JSONB,
  ADD COLUMN IF NOT EXISTS key_reasons TEXT[],
  ADD COLUMN IF NOT EXISTS data_validation_result JSONB,
  ADD COLUMN IF NOT EXISTS suspicious_flags JSONB,
  ADD COLUMN IF NOT EXISTS inputs_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS professional_review JSONB,
  ADD COLUMN IF NOT EXISTS assigned_reviewer_id UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS review_claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS generated_on_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS should_watermark BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

ALTER TABLE public.valuations DROP CONSTRAINT IF EXISTS valuations_status_check;
ALTER TABLE public.valuations
  ADD CONSTRAINT valuations_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE public.valuations DROP CONSTRAINT IF EXISTS valuations_confidence_level_check;
ALTER TABLE public.valuations
  ADD CONSTRAINT valuations_confidence_level_check
  CHECK (confidence_level IS NULL OR confidence_level IN ('low', 'medium', 'high'));

CREATE INDEX IF NOT EXISTS idx_valuations_user_created ON public.valuations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_valuations_startup_latest ON public.valuations(startup_id, is_latest, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_valuations_status ON public.valuations(status);
CREATE INDEX IF NOT EXISTS idx_valuations_share_token ON public.valuations(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_valuations_review_status ON public.valuations((professional_review->>'status'), created_at)
  WHERE professional_review->>'status' = 'pending_review';
CREATE INDEX IF NOT EXISTS idx_valuations_assigned_reviewer ON public.valuations(assigned_reviewer_id)
  WHERE assigned_reviewer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.valuation_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  method_name TEXT NOT NULL,
  method_display_name TEXT,
  low_estimate NUMERIC(15, 2),
  mid_estimate NUMERIC(15, 2),
  high_estimate NUMERIC(15, 2),
  confidence TEXT,
  method_inputs JSONB,
  calculation_steps JSONB,
  assumptions JSONB,
  benchmarks_used JSONB,
  methodology_explanation TEXT,
  key_factors_explanation TEXT,
  reasoning TEXT,
  limitations TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.valuation_methods
  ADD COLUMN IF NOT EXISTS startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS method_display_name TEXT,
  ADD COLUMN IF NOT EXISTS low_estimate NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS mid_estimate NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS high_estimate NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS confidence TEXT,
  ADD COLUMN IF NOT EXISTS method_inputs JSONB,
  ADD COLUMN IF NOT EXISTS calculation_steps JSONB,
  ADD COLUMN IF NOT EXISTS assumptions JSONB,
  ADD COLUMN IF NOT EXISTS benchmarks_used JSONB,
  ADD COLUMN IF NOT EXISTS methodology_explanation TEXT,
  ADD COLUMN IF NOT EXISTS key_factors_explanation TEXT,
  ADD COLUMN IF NOT EXISTS reasoning TEXT,
  ADD COLUMN IF NOT EXISTS limitations TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.valuation_methods DROP CONSTRAINT IF EXISTS valuation_methods_method_name_check;
ALTER TABLE public.valuation_methods DROP CONSTRAINT IF EXISTS valuation_methods_confidence_check;
ALTER TABLE public.valuation_methods
  ADD CONSTRAINT valuation_methods_confidence_check
  CHECK (confidence IS NULL OR confidence IN ('low', 'medium', 'high'));

CREATE INDEX IF NOT EXISTS idx_methods_valuation_id ON public.valuation_methods(valuation_id);
CREATE INDEX IF NOT EXISTS idx_methods_method_name ON public.valuation_methods(method_name);

CREATE TABLE IF NOT EXISTS public.valuation_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  evidence_key TEXT NOT NULL,
  evidence_value JSONB NOT NULL,
  source TEXT NOT NULL,
  source_date TIMESTAMPTZ,
  source_confidence INTEGER,
  input_data JSONB,
  calculated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_valuation_evidence_valuation_id ON public.valuation_evidence(valuation_id);
CREATE INDEX IF NOT EXISTS idx_valuation_evidence_type ON public.valuation_evidence(evidence_type);

CREATE TABLE IF NOT EXISTS public.valuation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  inputs_snapshot JSONB NOT NULL,
  outputs_snapshot JSONB NOT NULL,
  changed_inputs JSONB,
  change_reason TEXT DEFAULT 'user_updated',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_valuation_versions_valuation_id ON public.valuation_versions(valuation_id);
CREATE INDEX IF NOT EXISTS idx_valuation_versions_number ON public.valuation_versions(valuation_id, version_number);

CREATE TABLE IF NOT EXISTS public.valuation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  sequence_number INTEGER,
  previous_valuation_id UUID REFERENCES public.valuations(id),
  valuation_change_amount NUMERIC(15, 2),
  valuation_change_percentage NUMERIC(8, 2),
  key_changes TEXT[],
  reason_for_generation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_history_startup_created ON public.valuation_history(startup_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Reports, review, benchmarking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'full_report',
  title TEXT,
  markdown_content TEXT,
  html_content TEXT,
  pdf_url TEXT,
  sections_included TEXT[],
  word_count INTEGER,
  page_count INTEGER,
  generated_by_model TEXT,
  generation_time_seconds INTEGER,
  template_version TEXT DEFAULT '1.0',
  is_downloadable BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  shared_with_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_created ON public.reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_valuation_id ON public.reports(valuation_id);
CREATE INDEX IF NOT EXISTS idx_reports_share_token ON public.reports(share_token) WHERE share_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.report_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  version_number INTEGER DEFAULT 1,
  executive_summary JSONB,
  valuation_methods JSONB,
  comparable_analysis JSONB,
  data_sources JSONB,
  sensitivity_analysis JSONB,
  assumptions_summary JSONB,
  professional_review JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  generated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_data_valuation_version ON public.report_data(valuation_id, version_number);

CREATE TABLE IF NOT EXISTS public.report_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.report_data(id) ON DELETE CASCADE,
  valuation_id UUID REFERENCES public.valuations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_audit_log_valuation_id ON public.report_audit_log(valuation_id);

CREATE TABLE IF NOT EXISTS public.review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  assigned_to_user_id UUID NOT NULL REFERENCES public.users(id),
  assigned_by_user_id UUID NOT NULL REFERENCES public.users(id),
  claimed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer ON public.review_assignments(assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_review_assignments_status ON public.review_assignments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_assignments_valuation ON public.review_assignments(valuation_id);

CREATE TABLE IF NOT EXISTS public.industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL,
  stage TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  count INTEGER,
  min_value NUMERIC(15, 2),
  p25_value NUMERIC(15, 2),
  median_value NUMERIC(15, 2),
  p75_value NUMERIC(15, 2),
  max_value NUMERIC(15, 2),
  mean_value NUMERIC(15, 2),
  std_dev NUMERIC(15, 2),
  last_updated TIMESTAMPTZ DEFAULT now(),
  data_points_used INTEGER,
  confidence_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(industry, stage, metric_name)
);

CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_lookup ON public.industry_benchmarks(industry, stage, metric_name);

CREATE TABLE IF NOT EXISTS public.comparable_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  industry TEXT,
  stage TEXT,
  arr NUMERIC(15, 2),
  growth_rate NUMERIC(8, 2),
  team_size INTEGER,
  founded_year INTEGER,
  latest_valuation NUMERIC(15, 2),
  valuation_date DATE,
  funding_round TEXT,
  exit_value NUMERIC(15, 2),
  exit_date DATE,
  exit_type TEXT,
  country TEXT,
  source TEXT,
  verified BOOLEAN DEFAULT false,
  valuation_multiples JSONB,
  peer_metrics JSONB,
  data_quality INTEGER DEFAULT 50,
  data_freshness_date TIMESTAMPTZ,
  excluded_reasons TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.comparable_companies
  ADD COLUMN IF NOT EXISTS valuation_multiples JSONB,
  ADD COLUMN IF NOT EXISTS peer_metrics JSONB,
  ADD COLUMN IF NOT EXISTS data_quality INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS data_freshness_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS excluded_reasons TEXT[],
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_comparable_companies_lookup ON public.comparable_companies(industry, stage, verified);
CREATE INDEX IF NOT EXISTS idx_comparable_companies_valuation ON public.comparable_companies(latest_valuation, valuation_date);

CREATE TABLE IF NOT EXISTS public.benchmark_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  valuation_percentile INTEGER,
  arr_percentile INTEGER,
  growth_percentile INTEGER,
  comparable_companies_ids UUID[],
  analysis_summary TEXT,
  market_position TEXT,
  peer_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_analysis_valuation ON public.benchmark_analysis(valuation_id);

CREATE TABLE IF NOT EXISTS public.comparable_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  comparable_id UUID,
  relevance_score NUMERIC(4, 3),
  selection_reason TEXT,
  exclusion_reason TEXT,
  confidence_contribution INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comparable_selections_valuation_id ON public.comparable_selections(valuation_id);

-- ---------------------------------------------------------------------------
-- Leads, lifecycle, rate limits, pricing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  website_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  isp TEXT,
  valuation_low NUMERIC(15, 2),
  valuation_mid NUMERIC(15, 2),
  valuation_high NUMERIC(15, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_metadata_source ON public.leads((metadata->>'source'));

CREATE TABLE IF NOT EXISTS public.email_sequence_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  valuation_mid NUMERIC(15, 2),
  day_1_sent_at TIMESTAMPTZ,
  day_3_scheduled_for TIMESTAMPTZ,
  day_3_sent_at TIMESTAMPTZ,
  day_7_scheduled_for TIMESTAMPTZ,
  day_7_sent_at TIMESTAMPTZ,
  converted_to_paid_user BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  failed_at TIMESTAMPTZ,
  last_error TEXT,
  converted_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  segment TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_sequence_leads
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'general';

CREATE INDEX IF NOT EXISTS idx_email_sequence_leads_email ON public.email_sequence_leads(email);
CREATE INDEX IF NOT EXISTS idx_email_sequence_leads_day3 ON public.email_sequence_leads(day_3_scheduled_for) WHERE day_3_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_sequence_leads_day7 ON public.email_sequence_leads(day_7_scheduled_for) WHERE day_7_sent_at IS NULL;

CREATE TABLE IF NOT EXISTS public.email_sequence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_sequence_lead_id UUID NOT NULL REFERENCES public.email_sequence_leads(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_sequence_events_lead_id ON public.email_sequence_events(email_sequence_lead_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_events_created_at ON public.email_sequence_events(created_at DESC);

CREATE TABLE IF NOT EXISTS public.enterprise_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.free_check_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL,
  check_count INTEGER NOT NULL DEFAULT 1,
  reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  isp TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_token, reset_date)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_session_date ON public.free_check_rate_limits(session_token, reset_date);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_date ON public.free_check_rate_limits(reset_date);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  currency TEXT PRIMARY KEY,
  rate NUMERIC(12, 6) NOT NULL,
  best_rate NUMERIC(12, 6) NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pricing_cache (
  id TEXT PRIMARY KEY,
  pricing JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.exchange_rates (currency, rate, best_rate, last_updated)
VALUES ('USD', 1, 1, now()), ('INR', 83.5, 83.5, now()), ('EUR', 0.92, 0.92, now())
ON CONFLICT (currency) DO UPDATE SET updated_at = now();

-- ---------------------------------------------------------------------------
-- Teams
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  invitation_token TEXT UNIQUE,
  invitation_expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_members_workspace ON public.team_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'sent',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, invited_email)
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_workspace ON public.team_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_code ON public.team_invitations(invitation_code);

-- ---------------------------------------------------------------------------
-- Usage limits, API credits, Stripe idempotency, telemetry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_key TEXT NOT NULL,
  feature TEXT NOT NULL,
  plan_key TEXT NOT NULL,
  period_key TEXT NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (usage_key, feature, period_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_counters_user_feature ON public.ai_usage_counters(user_id, feature, period_key);
CREATE INDEX IF NOT EXISTS idx_ai_usage_counters_reset_at ON public.ai_usage_counters(reset_at);

CREATE TABLE IF NOT EXISTS public.api_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_micro_usd BIGINT NOT NULL DEFAULT 0,
  low_balance_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_status ON public.api_keys(user_id, status);

CREATE TABLE IF NOT EXISTS public.api_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_micro_usd BIGINT NOT NULL,
  type TEXT NOT NULL,
  remaining_micro_usd BIGINT NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  description TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_credit_transactions_user_created ON public.api_credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_credit_transactions_expiry ON public.api_credit_transactions(user_id, expires_at)
  WHERE remaining_micro_usd > 0;
CREATE INDEX IF NOT EXISTS idx_api_credit_transactions_stripe_session ON public.api_credit_transactions(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.api_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  request_id TEXT NOT NULL,
  model TEXT NOT NULL,
  cost_micro_usd BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_created ON public.api_usage_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_key_created ON public.api_usage_events(api_key_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.api_rate_limit_counters (
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  window_key TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (api_key_id, window_key)
);

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  attempts INTEGER NOT NULL DEFAULT 1,
  received_at TIMESTAMPTZ DEFAULT now(),
  locked_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status_received
  ON public.stripe_webhook_events(status, received_at DESC);

CREATE TABLE IF NOT EXISTS public.error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  name TEXT,
  stack TEXT,
  digest TEXT,
  component_stack TEXT,
  path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_events_created_at ON public.error_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_events_source_created_at ON public.error_events(source, created_at DESC);

-- ---------------------------------------------------------------------------
-- Bulk valuation tables used by API routes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.valuation_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  job_name TEXT NOT NULL,
  description TEXT,
  total_startups INTEGER NOT NULL,
  processed_count INTEGER DEFAULT 0,
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  csv_file_url TEXT,
  file_size INTEGER,
  file_hash TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion_time TIMESTAMPTZ,
  error_log TEXT[],
  error_summary TEXT,
  results_file_url TEXT,
  results_summary JSONB,
  valuation_methods TEXT[],
  include_report_pdf BOOLEAN DEFAULT false,
  send_email_on_completion BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_valuation_batch_jobs_user_created ON public.valuation_batch_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_valuation_batch_jobs_status ON public.valuation_batch_jobs(status);

CREATE TABLE IF NOT EXISTS public.valuation_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_job_id UUID NOT NULL REFERENCES public.valuation_batch_jobs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  website_url TEXT,
  industry TEXT,
  stage TEXT,
  arr NUMERIC(15, 2),
  growth_rate NUMERIC(8, 2),
  team_size INTEGER,
  founded_year INTEGER,
  market_size NUMERIC(15, 2),
  status TEXT DEFAULT 'pending',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_duration_ms INTEGER,
  valuation_id UUID REFERENCES public.valuations(id) ON DELETE SET NULL,
  valuation_low NUMERIC(15, 2),
  valuation_mid NUMERIC(15, 2),
  valuation_high NUMERIC(15, 2),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_valuation_batch_items_batch_status ON public.valuation_batch_items(batch_job_id, status);

CREATE TABLE IF NOT EXISTS public.batch_valuation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  stage TEXT,
  column_mappings JSONB NOT NULL,
  sample_csv_url TEXT,
  required_fields TEXT[],
  optional_fields TEXT[],
  validation_rules JSONB,
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_job_id UUID REFERENCES public.valuation_batch_jobs(id) ON DELETE CASCADE,
  batch_item_id UUID REFERENCES public.valuation_batch_items(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'queued',
  priority INTEGER DEFAULT 0,
  assigned_worker_id TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  attempt_number INTEGER DEFAULT 1,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processing_queue_status_priority ON public.processing_queue(status, priority DESC, created_at);

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparable_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparable_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_check_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limit_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_valuation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS user_profiles_select_own ON public.user_profiles;
CREATE POLICY user_profiles_select_own ON public.user_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
CREATE POLICY user_profiles_insert_own ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
CREATE POLICY user_profiles_update_own ON public.user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS startups_select_own_or_public ON public.startups;
CREATE POLICY startups_select_own_or_public ON public.startups FOR SELECT USING (auth.uid() = user_id OR is_public = true);
DROP POLICY IF EXISTS startups_insert_own ON public.startups;
CREATE POLICY startups_insert_own ON public.startups FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS startups_update_own ON public.startups;
CREATE POLICY startups_update_own ON public.startups FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS startups_delete_own ON public.startups;
CREATE POLICY startups_delete_own ON public.startups FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS valuations_select_own_or_public ON public.valuations;
CREATE POLICY valuations_select_own_or_public ON public.valuations FOR SELECT USING (auth.uid() = user_id OR is_public = true);
DROP POLICY IF EXISTS valuations_insert_own ON public.valuations;
CREATE POLICY valuations_insert_own ON public.valuations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS valuations_update_own ON public.valuations;
CREATE POLICY valuations_update_own ON public.valuations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS valuation_methods_select_own ON public.valuation_methods;
CREATE POLICY valuation_methods_select_own ON public.valuation_methods FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.valuations v WHERE v.id = valuation_methods.valuation_id AND (v.user_id = auth.uid() OR v.is_public = true))
);

DROP POLICY IF EXISTS valuation_evidence_select_own ON public.valuation_evidence;
CREATE POLICY valuation_evidence_select_own ON public.valuation_evidence FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.valuations v WHERE v.id = valuation_evidence.valuation_id AND v.user_id = auth.uid())
);

DROP POLICY IF EXISTS report_data_select_own ON public.report_data;
CREATE POLICY report_data_select_own ON public.report_data FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.valuations v WHERE v.id = report_data.valuation_id AND v.user_id = auth.uid())
);

DROP POLICY IF EXISTS public_benchmark_select ON public.industry_benchmarks;
CREATE POLICY public_benchmark_select ON public.industry_benchmarks FOR SELECT USING (true);
DROP POLICY IF EXISTS public_comparable_select ON public.comparable_companies;
CREATE POLICY public_comparable_select ON public.comparable_companies FOR SELECT USING (true);

DROP POLICY IF EXISTS leads_public_insert ON public.leads;
CREATE POLICY leads_public_insert ON public.leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS enterprise_inquiries_public_insert ON public.enterprise_inquiries;
CREATE POLICY enterprise_inquiries_public_insert ON public.enterprise_inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS team_members_select ON public.team_members;
CREATE POLICY team_members_select ON public.team_members FOR SELECT USING (workspace_id = auth.uid() OR user_id = auth.uid());
DROP POLICY IF EXISTS team_members_insert_owner ON public.team_members;
CREATE POLICY team_members_insert_owner ON public.team_members FOR INSERT WITH CHECK (invited_by = auth.uid());
DROP POLICY IF EXISTS team_members_update_related ON public.team_members;
CREATE POLICY team_members_update_related ON public.team_members FOR UPDATE USING (workspace_id = auth.uid() OR user_id = auth.uid());

DROP POLICY IF EXISTS api_wallet_select_own ON public.api_wallets;
CREATE POLICY api_wallet_select_own ON public.api_wallets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS api_keys_select_own ON public.api_keys;
CREATE POLICY api_keys_select_own ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS api_credit_transactions_select_own ON public.api_credit_transactions;
CREATE POLICY api_credit_transactions_select_own ON public.api_credit_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS api_usage_events_select_own ON public.api_usage_events;
CREATE POLICY api_usage_events_select_own ON public.api_usage_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS valuation_batch_jobs_select_own ON public.valuation_batch_jobs;
CREATE POLICY valuation_batch_jobs_select_own ON public.valuation_batch_jobs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS valuation_batch_jobs_insert_own ON public.valuation_batch_jobs;
CREATE POLICY valuation_batch_jobs_insert_own ON public.valuation_batch_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, plan, plan_active, billing_cycle, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'free',
    false,
    'annual',
    false
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (id, tier, startup_count, max_startups)
  VALUES (NEW.id, 'free', 0, 1)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.increment_monthly_startup_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.user_profiles (id, tier, startup_count, max_startups, startups_created_this_month)
  VALUES (p_user_id, 'free', 0, 1, 1)
  ON CONFLICT (id)
  DO UPDATE SET
    startups_created_this_month = public.user_profiles.startups_created_this_month + 1,
    startup_count = public.user_profiles.startup_count + 1,
    updated_at = now()
  RETURNING startups_created_this_month INTO v_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_monthly_startup_allocation(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, created_this_month INTEGER, limit_remaining INTEGER) AS $$
DECLARE
  v_created INTEGER := 0;
  v_limit INTEGER := 1;
  v_plan TEXT := 'free';
  v_plan_active BOOLEAN := false;
  v_enterprise_limit INTEGER := 999999;
BEGIN
  SELECT
    COALESCE(up.startups_created_this_month, 0),
    LOWER(COALESCE(u.plan, 'free')),
    COALESCE(u.plan_active, false),
    COALESCE(u.enterprise_startup_limit, 999999)
  INTO v_created, v_plan, v_plan_active, v_enterprise_limit
  FROM public.users u
  LEFT JOIN public.user_profiles up ON up.id = u.id
  WHERE u.id = p_user_id;

  IF COALESCE(v_plan_active, false) AND v_plan IN ('plus', 'agency', 'business', 'advisor') THEN
    v_limit := 10;
  ELSIF COALESCE(v_plan_active, false) AND v_plan = 'enterprise' THEN
    v_limit := v_enterprise_limit;
  ELSE
    v_limit := 1;
  END IF;

  RETURN QUERY SELECT (v_created < v_limit), v_created, GREATEST(v_limit - v_created, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_team_seats_limit(p_workspace_id UUID)
RETURNS TABLE(current_seats INTEGER, max_seats INTEGER, can_invite BOOLEAN) AS $$
DECLARE
  v_plan TEXT := 'free';
  v_plan_active BOOLEAN := false;
  v_max INTEGER := 0;
  v_current INTEGER := 0;
BEGIN
  SELECT LOWER(COALESCE(plan, 'free')), COALESCE(plan_active, false)
  INTO v_plan, v_plan_active
  FROM public.users
  WHERE id = p_workspace_id;

  IF v_plan_active AND v_plan IN ('plus', 'agency', 'business', 'advisor') THEN
    v_max := 5;
  ELSIF v_plan_active AND v_plan = 'enterprise' THEN
    SELECT COALESCE(enterprise_team_seats, 50) INTO v_max FROM public.users WHERE id = p_workspace_id;
  END IF;

  SELECT COUNT(*) INTO v_current
  FROM public.team_members
  WHERE workspace_id = p_workspace_id AND status = 'accepted' AND role <> 'owner';

  RETURN QUERY SELECT v_current, v_max, (v_current < v_max);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_code TEXT, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT id INTO v_member_id
  FROM public.team_members
  WHERE invitation_token = p_code
    AND status = 'pending'
    AND invitation_expires_at > now();

  IF v_member_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid or expired invitation code';
    RETURN;
  END IF;

  UPDATE public.team_members
  SET user_id = p_user_id, status = 'accepted', accepted_at = now(), updated_at = now()
  WHERE id = v_member_id;

  UPDATE public.team_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE team_member_id = v_member_id;

  RETURN QUERY SELECT true, 'Invitation accepted successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_ai_usage_counter(
  p_user_id UUID,
  p_usage_key TEXT,
  p_feature TEXT,
  p_plan_key TEXT,
  p_period_key TEXT,
  p_reset_at TIMESTAMPTZ
)
RETURNS INTEGER AS $$
DECLARE
  v_used_count INTEGER;
BEGIN
  INSERT INTO public.ai_usage_counters (user_id, usage_key, feature, plan_key, period_key, used_count, reset_at, updated_at)
  VALUES (p_user_id, p_usage_key, p_feature, p_plan_key, p_period_key, 1, p_reset_at, now())
  ON CONFLICT (usage_key, feature, period_key)
  DO UPDATE SET used_count = public.ai_usage_counters.used_count + 1, plan_key = excluded.plan_key, reset_at = excluded.reset_at, updated_at = now()
  RETURNING used_count INTO v_used_count;

  RETURN v_used_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_ai_usage_counter_if_available(
  p_user_id UUID,
  p_usage_key TEXT,
  p_feature TEXT,
  p_plan_key TEXT,
  p_period_key TEXT,
  p_reset_at TIMESTAMPTZ,
  p_limit INTEGER
)
RETURNS TABLE(allowed BOOLEAN, used_count INTEGER) AS $$
DECLARE
  v_used_count INTEGER;
BEGIN
  IF p_limit <= 0 THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  INSERT INTO public.ai_usage_counters (user_id, usage_key, feature, plan_key, period_key, used_count, reset_at, updated_at)
  VALUES (p_user_id, p_usage_key, p_feature, p_plan_key, p_period_key, 1, p_reset_at, now())
  ON CONFLICT (usage_key, feature, period_key)
  DO UPDATE SET used_count = public.ai_usage_counters.used_count + 1, plan_key = excluded.plan_key, reset_at = excluded.reset_at, updated_at = now()
  WHERE public.ai_usage_counters.used_count < p_limit
  RETURNING public.ai_usage_counters.used_count INTO v_used_count;

  IF v_used_count IS NULL THEN
    SELECT c.used_count INTO v_used_count
    FROM public.ai_usage_counters c
    WHERE c.usage_key = p_usage_key AND c.feature = p_feature AND c.period_key = p_period_key;
    RETURN QUERY SELECT false, COALESCE(v_used_count, 0);
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_used_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.expire_api_credits(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_expired BIGINT := 0;
  v_balance BIGINT := 0;
BEGIN
  SELECT COALESCE(SUM(remaining_micro_usd), 0) INTO v_expired
  FROM public.api_credit_transactions
  WHERE user_id = p_user_id AND remaining_micro_usd > 0 AND expires_at IS NOT NULL AND expires_at <= now();

  IF v_expired > 0 THEN
    UPDATE public.api_credit_transactions SET remaining_micro_usd = 0
    WHERE user_id = p_user_id AND remaining_micro_usd > 0 AND expires_at IS NOT NULL AND expires_at <= now();
    UPDATE public.api_wallets SET balance_micro_usd = GREATEST(balance_micro_usd - v_expired, 0), updated_at = now()
    WHERE user_id = p_user_id RETURNING balance_micro_usd INTO v_balance;
  ELSE
    SELECT COALESCE(balance_micro_usd, 0) INTO v_balance FROM public.api_wallets WHERE user_id = p_user_id;
  END IF;

  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_api_credits(
  p_user_id UUID,
  p_amount_micro_usd BIGINT,
  p_stripe_session_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS BIGINT AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  IF p_amount_micro_usd <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  IF p_stripe_session_id IS NOT NULL AND btrim(p_stripe_session_id) <> '' THEN
    PERFORM pg_advisory_xact_lock(2034002026, hashtext(p_stripe_session_id));

    SELECT balance_micro_usd INTO v_balance
    FROM public.api_wallets
    WHERE user_id = p_user_id;

    IF EXISTS (
      SELECT 1
      FROM public.api_credit_transactions
      WHERE user_id = p_user_id
        AND stripe_session_id = p_stripe_session_id
        AND type = 'top_up'
    ) THEN
      RETURN COALESCE(v_balance, 0);
    END IF;
  END IF;

  INSERT INTO public.api_wallets (user_id, balance_micro_usd, updated_at)
  VALUES (p_user_id, p_amount_micro_usd, now())
  ON CONFLICT (user_id)
  DO UPDATE SET balance_micro_usd = public.api_wallets.balance_micro_usd + p_amount_micro_usd, updated_at = now()
  RETURNING balance_micro_usd INTO v_balance;

  INSERT INTO public.api_credit_transactions (user_id, amount_micro_usd, type, remaining_micro_usd, stripe_session_id, description, expires_at, metadata)
  VALUES (p_user_id, p_amount_micro_usd, 'top_up', p_amount_micro_usd, p_stripe_session_id, COALESCE(p_description, 'API credit top-up'), now() + interval '6 months', COALESCE(p_metadata, '{}'::jsonb));

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.deduct_api_credits(p_user_id UUID, p_amount_micro_usd BIGINT)
RETURNS BIGINT AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  PERFORM public.expire_api_credits(p_user_id);
  SELECT balance_micro_usd INTO v_balance FROM public.api_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF COALESCE(v_balance, 0) < p_amount_micro_usd THEN
    RAISE EXCEPTION 'Insufficient API credits';
  END IF;
  UPDATE public.api_wallets SET balance_micro_usd = balance_micro_usd - p_amount_micro_usd, updated_at = now()
  WHERE user_id = p_user_id RETURNING balance_micro_usd INTO v_balance;
  INSERT INTO public.api_credit_transactions (user_id, amount_micro_usd, type, description)
  VALUES (p_user_id, -p_amount_micro_usd, 'usage', 'Evaldam API usage');
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.adjust_api_credits(
  p_user_id UUID,
  p_amount_micro_usd BIGINT,
  p_type TEXT DEFAULT 'adjustment',
  p_description TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  INSERT INTO public.api_wallets (user_id, balance_micro_usd, updated_at)
  VALUES (p_user_id, GREATEST(p_amount_micro_usd, 0), now())
  ON CONFLICT (user_id)
  DO UPDATE SET balance_micro_usd = GREATEST(public.api_wallets.balance_micro_usd + p_amount_micro_usd, 0), updated_at = now()
  RETURNING balance_micro_usd INTO v_balance;

  INSERT INTO public.api_credit_transactions (user_id, amount_micro_usd, type, remaining_micro_usd, description, expires_at)
  VALUES (p_user_id, p_amount_micro_usd, p_type, CASE WHEN p_amount_micro_usd > 0 THEN p_amount_micro_usd ELSE 0 END, COALESCE(p_description, 'API wallet adjustment'), CASE WHEN p_amount_micro_usd > 0 THEN now() + interval '6 months' ELSE NULL END);

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_api_rate_limit_counter(
  p_api_key_id UUID,
  p_window_key TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.api_rate_limit_counters (api_key_id, window_key, request_count, expires_at, updated_at)
  VALUES (p_api_key_id, p_window_key, 1, p_expires_at, now())
  ON CONFLICT (api_key_id, window_key)
  DO UPDATE SET request_count = public.api_rate_limit_counters.request_count + 1, updated_at = now()
  RETURNING request_count INTO v_count;
  DELETE FROM public.api_rate_limit_counters WHERE expires_at < now();
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_api_monthly_usage(p_user_id UUID)
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(cost_micro_usd), 0)::BIGINT
  FROM public.api_usage_events
  WHERE user_id = p_user_id
    AND status = 'success'
    AND created_at >= date_trunc('month', now());
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(p_event_id TEXT, p_event_type TEXT)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
  v_locked_at TIMESTAMPTZ;
BEGIN
  INSERT INTO public.stripe_webhook_events (event_id, event_type, status, attempts, received_at, locked_at)
  VALUES (p_event_id, p_event_type, 'processing', 1, now(), now())
  ON CONFLICT (event_id) DO NOTHING;

  IF FOUND THEN RETURN 'claimed'; END IF;

  SELECT status, locked_at INTO v_status, v_locked_at
  FROM public.stripe_webhook_events
  WHERE event_id = p_event_id
  FOR UPDATE;

  IF v_status = 'processed' THEN RETURN 'processed'; END IF;
  IF v_status = 'processing' AND v_locked_at > now() - interval '10 minutes' THEN RETURN 'processing'; END IF;

  UPDATE public.stripe_webhook_events
  SET event_type = p_event_type, status = 'processing', attempts = attempts + 1, locked_at = now(), last_error = NULL
  WHERE event_id = p_event_id;

  RETURN 'claimed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_stripe_webhook_event_processed(p_event_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.stripe_webhook_events
  SET status = 'processed', processed_at = now(), last_error = NULL
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_stripe_webhook_event_failed(p_event_id TEXT, p_last_error TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.stripe_webhook_events
  SET status = 'failed', last_error = left(coalesce(p_last_error, 'unknown error'), 1000)
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing Auth users into app tables.
INSERT INTO public.users (id, email, full_name, plan, plan_active, billing_cycle, onboarding_completed, onboarding_data, sales_qualification)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'free',
  false,
  'annual',
  false,
  '{}'::jsonb,
  '{}'::jsonb
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id);

INSERT INTO public.user_profiles (id, tier, startup_count, max_startups)
SELECT au.id, 'free', 0, 1
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = au.id);

COMMIT;

-- Force Supabase PostgREST to notice new/altered columns immediately.
NOTIFY pgrst, 'reload schema';
