-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (links to Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  plan TEXT DEFAULT 'pro' CHECK (plan IN ('pro', 'plus', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Startups table
CREATE TABLE IF NOT EXISTS public.startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('pre-revenue', 'seed', 'series-a', 'series-b+')),
  website_url TEXT,
  arr DECIMAL(15, 2),
  monthly_growth_rate DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Valuations table
CREATE TABLE IF NOT EXISTS public.valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blended_low_range DECIMAL(15, 2),
  blended_high_range DECIMAL(15, 2),
  blended_weighted_average DECIMAL(15, 2),
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  data_completeness INTEGER,
  methods_results JSONB,
  key_reasons TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row-level security policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own record
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can only see their own startups
CREATE POLICY "Users can view own startups" ON public.startups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create startups" ON public.startups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own startups" ON public.startups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own startups" ON public.startups
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own valuations
CREATE POLICY "Users can view own valuations" ON public.valuations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create valuations" ON public.valuations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_startups_user_id ON public.startups(user_id);
CREATE INDEX idx_valuations_user_id ON public.valuations(user_id);
CREATE INDEX idx_valuations_startup_id ON public.valuations(startup_id);
