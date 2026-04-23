-- ============================================================================
-- EVALDAM AI - COMPLETE DATABASE SCHEMA
-- Production-Ready with Full Scope Coverage
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. USERS TABLE - Account & Subscription Management
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,

  -- Plan & Subscription
  plan TEXT NOT NULL DEFAULT 'pro' CHECK (plan IN ('pro', 'plus', 'enterprise')),
  plan_active BOOLEAN DEFAULT true,
  subscription_id TEXT,  -- Stripe subscription ID
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual')),

  -- Enterprise Custom Limits
  enterprise_startup_limit INTEGER DEFAULT 3,  -- Custom limit for enterprise
  enterprise_team_seats INTEGER DEFAULT 1,

  -- Profile Data
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  phone TEXT,
  country TEXT,
  timezone TEXT,
  language TEXT DEFAULT 'en',

  -- Preferences
  notifications_enabled BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT true,

  -- Account Status
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  verification_token TEXT,

  -- Timestamps (no updated_at - immutable history)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 2. STARTUPS TABLE - Core Startup Profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Basic Information
  company_name TEXT NOT NULL,
  slug TEXT UNIQUE,  -- For URL: /startups/company-slug
  description TEXT,
  logo_url TEXT,
  website_url TEXT,

  -- Foundational Data
  stage TEXT NOT NULL CHECK (stage IN ('pre-revenue', 'seed', 'series-a', 'series-b', 'series-c+', 'growth', 'mature')),
  founded_year INTEGER,
  headquarters_country TEXT,
  headquarters_city TEXT,

  -- Financial Metrics
  arr DECIMAL(15, 2),  -- Annual Recurring Revenue
  mrr DECIMAL(15, 2),  -- Monthly Recurring Revenue
  total_revenue DECIMAL(15, 2),
  burn_rate DECIMAL(15, 2),  -- Monthly burn
  runway_months INTEGER,  -- Months of runway
  monthly_growth_rate DECIMAL(5, 2),  -- Percentage
  yoy_growth_rate DECIMAL(5, 2),
  customer_count INTEGER,
  avg_contract_value DECIMAL(15, 2),

  -- Product & Market
  product_type TEXT,  -- SaaS, Marketplace, AI, FinTech, etc.
  industry TEXT,
  sub_industry TEXT,
  target_market TEXT,
  total_addressable_market_usd DECIMAL(15, 2),  -- TAM
  serviceable_addressable_market_usd DECIMAL(15, 2),  -- SAM

  -- Team
  team_size INTEGER,
  founder_count INTEGER,
  ceo_name TEXT,
  cto_name TEXT,

  -- Funding
  total_funding_raised DECIMAL(15, 2),
  latest_funding_round TEXT,
  latest_funding_amount DECIMAL(15, 2),
  investors TEXT[],  -- Array of investor names

  -- Additional Data
  problem_statement TEXT,
  solution_description TEXT,
  competitive_advantage TEXT,
  key_partnerships TEXT[],

  -- Status & Tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'inactive')),
  is_public BOOLEAN DEFAULT false,  -- Can be shared with others
  share_token TEXT UNIQUE,  -- For sharing without login

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. AI_RESEARCH_DATA TABLE - Auto-Extracted & Researched Data
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_research_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,

  -- Source Information
  source_type TEXT CHECK (source_type IN ('pitch_deck', 'website', 'user_input', 'manual_research')),
  source_url TEXT,
  source_document_name TEXT,

  -- Extracted Data
  extraction_full_text TEXT,  -- Full text extracted from pitch deck
  key_claims TEXT[],  -- Array of key claims from pitch
  market_size_claims TEXT,
  growth_claims TEXT,
  team_highlights TEXT[],

  -- AI Research Enhancements
  market_research_summary TEXT,  -- AI researched market data
  competitor_analysis JSONB,  -- { "competitors": [...], "market_share": ... }
  industry_benchmarks JSONB,  -- Industry standards & comparisons
  risk_analysis TEXT[],
  opportunities TEXT[],

  -- Data Quality
  extraction_confidence DECIMAL(3, 2),  -- 0.0 to 1.0
  data_completeness INTEGER,  -- 0-100%

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. VALUATIONS TABLE - Individual Valuation Runs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Valuation Results
  blended_low_range DECIMAL(15, 2),
  blended_high_range DECIMAL(15, 2),
  blended_weighted_average DECIMAL(15, 2),
  blended_median DECIMAL(15, 2),

  -- Quality Metrics
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  data_completeness INTEGER,  -- 0-100%
  methodology_version TEXT DEFAULT '1.0',  -- Track methodology changes

  -- Market Context (at time of valuation)
  market_conditions_snapshot JSONB,  -- Market state when valuation generated
  comparable_companies JSONB,  -- Comparable companies used

  -- Processing Info
  processing_time_seconds INTEGER,
  ai_model_used TEXT DEFAULT 'llama-3.3-70b',
  llm_provider TEXT DEFAULT 'groq',

  -- Status & Timestamps
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,  -- If failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Regeneration Tracking
  is_latest BOOLEAN DEFAULT true,  -- Current valuation for startup
  regenerated_from_valuation_id UUID REFERENCES public.valuations(id)  -- If this is a regeneration
);

-- ============================================================================
-- 5. VALUATION_METHODS TABLE - Individual Method Results
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.valuation_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,

  -- Method Information
  method_name TEXT NOT NULL CHECK (method_name IN ('scorecard', 'berkus', 'vc_method', 'dcf_ltg', 'dcf_multiples')),
  method_display_name TEXT,  -- "Scorecard (Bill Payne)", "Berkus Checklist", etc.

  -- Results
  low_estimate DECIMAL(15, 2),
  mid_estimate DECIMAL(15, 2),
  high_estimate DECIMAL(15, 2),
  confidence TEXT CHECK (confidence IN ('low', 'medium', 'high')),

  -- Method-Specific Data (JSONB for flexibility)
  method_inputs JSONB,  -- Input values used for calculation
  calculation_steps JSONB,  -- Breakdown of calculation
  assumptions JSONB,  -- { "assumption_1": value, "assumption_2": value }
  benchmarks_used JSONB,  -- { "benchmark_source": value, ... }

  -- Explanation
  methodology_explanation TEXT,  -- How this method works
  key_factors_explanation TEXT,  -- What drove the valuation
  limitations TEXT,  -- Limitations of this method

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. REPORTS TABLE - Generated Reports (One-Pager, Full, Markdown)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Report Types
  report_type TEXT NOT NULL CHECK (report_type IN ('one_pager', 'full_report', 'markdown', 'executive_summary')),

  -- Content
  title TEXT,
  markdown_content TEXT,  -- Full markdown for all report types
  html_content TEXT,  -- Rendered HTML (optional, for preview)
  pdf_url TEXT,  -- URL to generated PDF (if available)

  -- Report-Specific Data
  sections_included TEXT[],  -- Which sections are in this report
  word_count INTEGER,
  page_count INTEGER,  -- For full reports

  -- Metadata
  generated_by_model TEXT DEFAULT 'llama-3.3-70b',
  generation_time_seconds INTEGER,
  template_version TEXT DEFAULT '1.0',

  -- Status
  is_downloadable BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,

  -- Sharing
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,  -- For sharing without login
  shared_with_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. VALUATION_HISTORY TABLE - Complete History of All Valuations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.valuation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,

  -- History Tracking
  sequence_number INTEGER,  -- 1st valuation, 2nd, 3rd, etc.
  previous_valuation_id UUID REFERENCES public.valuations(id),  -- Link to previous valuation

  -- Change Analysis
  valuation_change_amount DECIMAL(15, 2),  -- Difference from previous
  valuation_change_percentage DECIMAL(5, 2),
  key_changes TEXT[],  -- What changed (metrics, market, etc.)

  -- Timestamps & Context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reason_for_generation TEXT  -- "User requested", "Metrics updated", "Market research", etc.
);

-- ============================================================================
-- 8. STARTUP_TEAM TABLE - Team Member Details (Multi-founder, Team)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.startup_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,

  -- Team Member Info
  name TEXT NOT NULL,
  email TEXT,
  title TEXT,
  role TEXT CHECK (role IN ('founder', 'ceo', 'cto', 'cfo', 'vp_sales', 'vp_product', 'other')),

  -- Background
  bio TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  prev_companies TEXT[],  -- Previous company experience
  education TEXT,

  -- Status
  is_primary BOOLEAN DEFAULT false,  -- Primary founder/contact

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. USER_ACTIVITY_LOG TABLE - Track All User Actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Activity Tracking
  action_type TEXT NOT NULL CHECK (action_type IN (
    'login', 'logout', 'signup', 'valuation_generated', 'report_downloaded',
    'startup_created', 'startup_updated', 'report_viewed', 'report_shared',
    'settings_updated', 'plan_upgraded', 'plan_downgraded'
  )),

  -- Context
  startup_id UUID REFERENCES public.startups(id),
  valuation_id UUID REFERENCES public.valuations(id),
  report_id UUID REFERENCES public.reports(id),

  -- Details
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,  -- Any additional data

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. MARKET_DATA_CACHE TABLE - Benchmark Data & Market Info
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.market_data_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Industry & Segment
  industry TEXT NOT NULL,
  sub_industry TEXT,
  stage TEXT CHECK (stage IN ('pre-revenue', 'seed', 'series-a', 'series-b', 'series-c+', 'growth', 'mature')),

  -- Benchmarks (2026 data)
  avg_arr_multiple_exit DECIMAL(5, 2),  -- ARR multiplier at exit
  avg_revenue_multiple_exit DECIMAL(5, 2),
  avg_ebitda_multiple_exit DECIMAL(5, 2),
  avg_monthly_growth_rate DECIMAL(5, 2),
  median_series_a_valuation DECIMAL(15, 2),
  median_series_b_valuation DECIMAL(15, 2),

  -- TAM Data
  total_addressable_market DECIMAL(15, 2),
  market_growth_rate DECIMAL(5, 2),
  market_CAGR DECIMAL(5, 2),  -- Compound Annual Growth Rate

  -- Comparable Companies
  comparable_public_companies TEXT[],
  public_company_avg_multiples JSONB,

  -- Data Source & Quality
  data_source TEXT,
  confidence_score DECIMAL(3, 2),  -- 0.0 to 1.0

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP WITH TIME ZONE,
  data_as_of_date DATE
);

-- ============================================================================
-- 11. SUBSCRIPTION_PLANS TABLE - Plan Details & Limits
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Plan Information
  plan_name TEXT NOT NULL UNIQUE CHECK (plan_name IN ('pro', 'plus', 'enterprise')),
  display_name TEXT,
  description TEXT,

  -- Pricing (2026)
  monthly_price DECIMAL(10, 2),
  annual_price DECIMAL(10, 2),
  annual_discount_percentage DECIMAL(5, 2),

  -- Limits & Features
  max_startups INTEGER,  -- 3 for Pro, 15 for Plus, NULL for Enterprise (custom)
  max_valuations_per_month INTEGER,
  max_reports_per_valuation INTEGER,
  max_team_seats INTEGER,

  -- Features (as array)
  features TEXT[],  -- e.g., ["AI Extraction", "5-Method Valuation", "PDF Download", ...]

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 12. AUDIT_LOG TABLE - System & Security Audit Trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What happened
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,

  -- Who did it
  user_id UUID REFERENCES public.users(id),

  -- Changes
  old_values JSONB,
  new_values JSONB,

  -- Context
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES - Performance Optimization
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_plan ON public.users(plan);
CREATE INDEX idx_users_created ON public.users(created_at);

-- Startups indexes
CREATE INDEX idx_startups_user_id ON public.startups(user_id);
CREATE INDEX idx_startups_status ON public.startups(status);
CREATE INDEX idx_startups_stage ON public.startups(stage);
CREATE INDEX idx_startups_industry ON public.startups(industry);
CREATE INDEX idx_startups_created ON public.startups(created_at);
CREATE INDEX idx_startups_slug ON public.startups(slug);

-- AI Research Data indexes
CREATE INDEX idx_ai_research_startup_id ON public.ai_research_data(startup_id);
CREATE INDEX idx_ai_research_created ON public.ai_research_data(created_at);

-- Valuations indexes
CREATE INDEX idx_valuations_startup_id ON public.valuations(startup_id);
CREATE INDEX idx_valuations_user_id ON public.valuations(user_id);
CREATE INDEX idx_valuations_is_latest ON public.valuations(startup_id, is_latest);
CREATE INDEX idx_valuations_created ON public.valuations(created_at);
CREATE INDEX idx_valuations_status ON public.valuations(status);

-- Valuation Methods indexes
CREATE INDEX idx_methods_valuation_id ON public.valuation_methods(valuation_id);
CREATE INDEX idx_methods_method_name ON public.valuation_methods(method_name);

-- Reports indexes
CREATE INDEX idx_reports_valuation_id ON public.reports(valuation_id);
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_type ON public.reports(report_type);
CREATE INDEX idx_reports_created ON public.reports(created_at);
CREATE INDEX idx_reports_share_token ON public.reports(share_token);

-- Valuation History indexes
CREATE INDEX idx_history_startup_id ON public.valuation_history(startup_id);
CREATE INDEX idx_history_created ON public.valuation_history(created_at);

-- Activity Log indexes
CREATE INDEX idx_activity_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_activity_action_type ON public.user_activity_log(action_type);
CREATE INDEX idx_activity_created ON public.user_activity_log(created_at);

-- Market Data indexes
CREATE INDEX idx_market_data_industry ON public.market_data_cache(industry);
CREATE INDEX idx_market_data_stage ON public.market_data_cache(stage);

-- Audit Log indexes
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_timestamp ON public.audit_log(timestamp);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) - Data Access Control
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_research_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;

-- Users: Can only see their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Startups: Can only see their own
CREATE POLICY "Users can view own startups" ON public.startups
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create startups" ON public.startups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own startups" ON public.startups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own startups" ON public.startups
  FOR DELETE USING (auth.uid() = user_id);

-- AI Research Data: Accessible via startup ownership
CREATE POLICY "Users can view own research data" ON public.ai_research_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.startups
      WHERE startups.id = ai_research_data.startup_id
      AND startups.user_id = auth.uid()
    )
  );

-- Valuations: Can only see their own
CREATE POLICY "Users can view own valuations" ON public.valuations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create valuations" ON public.valuations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Valuation Methods: Accessible via valuation ownership
CREATE POLICY "Users can view own valuation methods" ON public.valuation_methods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.valuations
      WHERE valuations.id = valuation_methods.valuation_id
      AND valuations.user_id = auth.uid()
    )
  );

-- Reports: Can only see their own (or shared public)
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_public = true
    OR share_token IS NOT NULL
  );

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Valuation History: Accessible via startup ownership
CREATE POLICY "Users can view own history" ON public.valuation_history
  FOR SELECT USING (auth.uid() = user_id);

-- Startup Team: Accessible via startup ownership
CREATE POLICY "Users can view team" ON public.startup_team
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.startups
      WHERE startups.id = startup_team.startup_id
      AND startups.user_id = auth.uid()
    )
  );

-- Activity Log: Users can only see their own
CREATE POLICY "Users can view own activity" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Market Data: Public read-only
CREATE POLICY "Market data is public" ON public.market_data_cache
  FOR SELECT USING (true);

-- ============================================================================
-- INITIAL DATA - Subscription Plans
-- ============================================================================

INSERT INTO public.subscription_plans (plan_name, display_name, description, monthly_price, annual_price, annual_discount_percentage, max_startups, max_valuations_per_month, max_reports_per_valuation, max_team_seats, features)
VALUES
  (
    'pro',
    'Pro',
    'For individual founders',
    99.00,
    1069.00,  -- $99 * 12 * 0.9
    10,
    3,
    30,
    2,
    1,
    ARRAY['3 Startup Profiles', 'Unlimited Revisions', 'One-Page Summary PDF', 'Full Report PDF', 'Basic Analytics', 'Export Data', 'Email Support']
  ),
  (
    'plus',
    'Plus',
    'For growing teams',
    199.00,
    2159.00,  -- $199 * 12 * 0.9
    10,
    15,
    100,
    3,
    3,
    ARRAY['15 Startup Profiles', 'Unlimited Revisions', 'One-Page Summary PDF', 'Full Report PDF', 'Advanced Analytics', 'Startup Grid Management', 'Team Seats (up to 3)', 'API Access (Limited)', 'Priority Support', 'Bulk Operations']
  ),
  (
    'enterprise',
    'Enterprise',
    'For VCs & Scale',
    NULL,
    NULL,
    0,
    NULL,  -- Unlimited
    NULL,  -- Unlimited
    NULL,  -- Unlimited
    NULL,  -- Custom
    ARRAY['Unlimited Profiles', 'Unlimited Revisions', 'All Report Formats', 'Advanced Analytics', 'White-Label Option', 'Full API Access', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Support', 'Custom Market Data', 'Bulk Processing']
  );

-- ============================================================================
-- TRIGGER FUNCTIONS (Optional - for future automation)
-- ============================================================================

-- Function to update startup latest valuation flag
CREATE OR REPLACE FUNCTION update_latest_valuation()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all previous valuations as not latest
  UPDATE public.valuations
  SET is_latest = false
  WHERE startup_id = NEW.startup_id AND id != NEW.id;

  -- Mark new valuation as latest
  NEW.is_latest = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute function
CREATE TRIGGER trigger_update_latest_valuation
BEFORE INSERT ON public.valuations
FOR EACH ROW
EXECUTE FUNCTION update_latest_valuation();

-- ============================================================================
-- SCHEMA COMPLETE - Production Ready
-- ============================================================================

-- ============================================================================
-- Enterprise Inquiries (Contact Sales form)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.enterprise_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  team_size TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.enterprise_inquiries
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can submit inquiry" ON public.enterprise_inquiries
  FOR INSERT WITH CHECK (true);
