-- Migration: Add Bulk Valuation Processing Module Tables

-- Batch jobs for bulk valuation
CREATE TABLE IF NOT EXISTS public.valuation_batch_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Job metadata
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  job_name TEXT NOT NULL,
  description TEXT,

  -- Processing details
  total_startups INT NOT NULL,
  processed_count INT DEFAULT 0,
  successful_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,

  -- File upload
  csv_file_url TEXT, -- URL to uploaded CSV file
  file_size INT, -- File size in bytes
  file_hash TEXT, -- MD5/SHA hash for integrity

  -- Progress tracking
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_completion_time TIMESTAMP,

  -- Error tracking
  error_log TEXT[], -- Array of error messages for failed rows
  error_summary TEXT, -- Summary of failures

  -- Results
  results_file_url TEXT, -- URL to results CSV with all valuations
  results_summary JSONB, -- Summary statistics of batch results

  -- Settings
  valuation_methods TEXT[], -- Array of methods to run: 'scorecard', 'berkus', etc
  include_report_pdf BOOLEAN DEFAULT FALSE,
  send_email_on_completion BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_valuation_batch_user_id (user_id),
  INDEX idx_valuation_batch_status (status),
  INDEX idx_valuation_batch_created_at (created_at DESC)
);

-- Individual startup records in batch
CREATE TABLE IF NOT EXISTS public.valuation_batch_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_job_id UUID NOT NULL REFERENCES public.valuation_batch_jobs(id) ON DELETE CASCADE,

  -- Row info
  row_number INT NOT NULL,
  company_name TEXT NOT NULL,
  website_url TEXT,

  -- Basic data from CSV
  industry TEXT,
  stage TEXT,
  arr DECIMAL(15, 2),
  growth_rate DECIMAL(5, 2),
  team_size INT,
  founded_year INT,
  market_size DECIMAL(15, 2),

  -- Processing
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  processing_duration_ms INT,

  -- Results
  valuation_id UUID REFERENCES public.valuations(id) ON DELETE SET NULL,
  valuation_low DECIMAL(15, 2),
  valuation_mid DECIMAL(15, 2),
  valuation_high DECIMAL(15, 2),

  -- Error handling
  error_message TEXT,
  retry_count INT DEFAULT 0,
  last_retry_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_valuation_batch_items_batch_id (batch_job_id),
  INDEX idx_valuation_batch_items_status (status)
);

-- Template CSV format specification
CREATE TABLE IF NOT EXISTS public.batch_valuation_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  stage TEXT,

  -- CSV columns mapping
  column_mappings JSONB NOT NULL, -- Maps CSV columns to startup profile fields
  sample_csv_url TEXT,

  -- Validation rules
  required_fields TEXT[],
  optional_fields TEXT[],
  validation_rules JSONB,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_batch_templates_industry_stage (industry, stage)
);

-- Processing queue for background workers
CREATE TABLE IF NOT EXISTS public.processing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Job reference
  batch_job_id UUID REFERENCES public.valuation_batch_jobs(id) ON DELETE CASCADE,
  batch_item_id UUID REFERENCES public.valuation_batch_items(id) ON DELETE CASCADE,

  -- Queue status
  status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'retrying')) DEFAULT 'queued',
  priority INT DEFAULT 0, -- Higher number = higher priority

  -- Processing info
  assigned_worker_id TEXT,
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  duration_ms INT,

  -- Retry logic
  attempt_number INT DEFAULT 1,
  max_retries INT DEFAULT 3,
  next_retry_at TIMESTAMP,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_processing_queue_status (status),
  INDEX idx_processing_queue_batch_job (batch_job_id),
  INDEX idx_processing_queue_priority (priority DESC),
  INDEX idx_processing_queue_retry (next_retry_at)
);

-- RLS Policies
ALTER TABLE public.valuation_batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_valuation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_queue ENABLE ROW LEVEL SECURITY;

-- Users can only see their own batch jobs
CREATE POLICY "Users can view own batch jobs" ON public.valuation_batch_jobs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own batch jobs" ON public.valuation_batch_jobs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only see items in their own batch jobs
CREATE POLICY "Users can view own batch items" ON public.valuation_batch_items
  FOR SELECT USING (
    batch_job_id IN (SELECT id FROM valuation_batch_jobs WHERE user_id = auth.uid())
  );

-- Public templates can be viewed by all
CREATE POLICY "Users can view public templates" ON public.batch_valuation_templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

-- Only queue items for user's batches visible
CREATE POLICY "Users can view own queue items" ON public.processing_queue
  FOR SELECT USING (
    batch_job_id IN (SELECT id FROM valuation_batch_jobs WHERE user_id = auth.uid())
  );
