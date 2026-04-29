-- Migration: Add Benchmarking Module Tables

-- Industry benchmarks aggregated data
CREATE TABLE IF NOT EXISTS public.industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('pre-revenue', 'seed', 'series-a', 'series-b+')),
  metric_name TEXT NOT NULL,

  -- Statistical data
  count INT,
  min_value DECIMAL(15, 2),
  p25_value DECIMAL(15, 2),
  median_value DECIMAL(15, 2),
  p75_value DECIMAL(15, 2),
  max_value DECIMAL(15, 2),
  mean_value DECIMAL(15, 2),
  std_dev DECIMAL(15, 2),

  -- Metadata
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_points_used INT,
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),

  UNIQUE(industry, stage, metric_name),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company comparable data (historical database)
CREATE TABLE IF NOT EXISTS public.comparable_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  industry TEXT,
  stage TEXT CHECK (stage IN ('pre-revenue', 'seed', 'series-a', 'series-b+')),

  -- Metrics
  arr DECIMAL(15, 2),
  growth_rate DECIMAL(5, 2),
  team_size INT,
  founded_year INT,

  -- Valuation data
  latest_valuation DECIMAL(15, 2),
  valuation_date DATE,
  funding_round TEXT,

  -- Exit data
  exit_value DECIMAL(15, 2),
  exit_date DATE,
  exit_type TEXT CHECK (exit_type IN ('acquisition', 'ipo', 'failed')),

  country TEXT,
  source TEXT, -- 'crunchbase', 'pitchbook', 'manual', 'news'
  verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Benchmarking results (cached per valuation)
CREATE TABLE IF NOT EXISTS public.benchmark_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,

  -- Percentile scores
  valuation_percentile INT CHECK (valuation_percentile >= 0 AND valuation_percentile <= 100),
  arr_percentile INT CHECK (arr_percentile >= 0 AND arr_percentile <= 100),
  growth_percentile INT CHECK (growth_percentile >= 0 AND growth_percentile <= 100),

  -- Comparable companies found
  comparable_companies_ids UUID[],

  -- Analysis
  analysis_summary TEXT, -- Markdown
  market_position TEXT, -- e.g., "Top 10%"
  peer_count INT, -- Number of comparable companies found

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_industry_stage
  ON industry_benchmarks(industry, stage);

CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_metric
  ON industry_benchmarks(metric_name);

CREATE INDEX IF NOT EXISTS idx_comparable_industry_stage
  ON comparable_companies(industry, stage);

CREATE INDEX IF NOT EXISTS idx_comparable_valuation
  ON comparable_companies(latest_valuation, valuation_date);

CREATE INDEX IF NOT EXISTS idx_benchmark_analysis_valuation
  ON benchmark_analysis(valuation_id);

-- RLS Policies
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparable_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_analysis ENABLE ROW LEVEL SECURITY;

-- Everyone can view public benchmark data (no user_id needed)
CREATE POLICY "Anyone can view industry benchmarks" ON public.industry_benchmarks
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view comparable companies" ON public.comparable_companies
  FOR SELECT USING (true);

-- Users can only see benchmark analysis for their own valuations
CREATE POLICY "Users can view own benchmark analysis" ON public.benchmark_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.valuations v
      WHERE v.id = benchmark_analysis.valuation_id
      AND v.user_id = auth.uid()
    )
  );
