-- Migration: Add user tier tracking and startup limits
-- Run this in Supabase SQL editor to enable free user tier restrictions

-- Create or update user_profiles table to track tier and startup count
-- Limits from pricing page:
-- Free: 1 startup, 3 reports/month
-- Pro: 3 startups, unlimited reports
-- Plus: 15 startups, unlimited reports
-- Enterprise: unlimited startups
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'plus', 'enterprise'
  startup_count INTEGER NOT NULL DEFAULT 0,
  max_startups INTEGER NOT NULL DEFAULT 1, -- Free=1, Pro=3, Plus=15, Enterprise=∞
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Only auth system can insert
CREATE POLICY "Auth creates profile on signup" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_startup_count ON user_profiles(startup_count);

-- Add trigger to auto-create user_profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, tier, startup_count, max_startups)
  VALUES (new.id, 'free', 0, 1);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add tier and watermark flag to reports/valuations table (if not exists)
-- This tracks whether a report was generated on free or paid tier
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS generated_on_tier TEXT DEFAULT 'free';
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS should_watermark BOOLEAN DEFAULT true;

-- Update existing valuations to be marked as free (since we didn't track before)
UPDATE valuations SET generated_on_tier = 'free', should_watermark = true
WHERE generated_on_tier IS NULL;

-- Create RPC function to safely increment startup count
CREATE OR REPLACE FUNCTION increment_startup_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  -- Get current count and max
  SELECT startup_count, max_startups INTO current_count, max_count
  FROM user_profiles
  WHERE id = user_id;

  -- Check if user can create more startups
  IF current_count >= max_count AND max_count != -1 THEN
    RAISE EXCEPTION 'Startup limit reached for user %', user_id;
  END IF;

  -- Increment the count
  UPDATE user_profiles
  SET startup_count = startup_count + 1,
      updated_at = now()
  WHERE id = user_id;

  RETURN current_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
