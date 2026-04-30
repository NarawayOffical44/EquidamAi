-- Migration: Create free_check_rate_limits table for free valuation checker
-- Run this in Supabase SQL editor to enable rate limiting for free checks

-- Create table to track free valuation check limits
CREATE TABLE IF NOT EXISTS free_check_rate_limits (
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

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_session_date ON free_check_rate_limits(session_token, reset_date);
CREATE INDEX IF NOT EXISTS idx_rate_limits_country ON free_check_rate_limits(country);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_date ON free_check_rate_limits(reset_date);

-- Enable RLS (rate limiting is admin-only to prevent tampering)
ALTER TABLE free_check_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can see all (used in API)
-- No SELECT policy for normal users (service role bypasses RLS anyway)
