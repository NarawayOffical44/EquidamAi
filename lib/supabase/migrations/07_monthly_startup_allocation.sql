-- Monthly startup allocation system
-- Users get 15 startups per month, counter resets on subscription renewal
-- Can delete anytime, but once limit hit in a month, can't add until next month

-- Add columns to user_profiles for tracking monthly allocation
ALTER TABLE IF EXISTS public.user_profiles
ADD COLUMN IF NOT EXISTS startups_created_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_cycle_start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_subscription_renewal_date TIMESTAMPTZ DEFAULT NOW();

-- Create function to reset monthly allocation on subscription renewal
CREATE OR REPLACE FUNCTION reset_monthly_startup_allocation()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription was renewed, reset the counter
  IF NEW.plan != OLD.plan OR NEW.updated_at > OLD.updated_at THEN
    UPDATE public.user_profiles
    SET
      startups_created_this_month = 0,
      monthly_cycle_start_date = CURRENT_DATE,
      last_subscription_renewal_date = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user subscription updates
DROP TRIGGER IF EXISTS reset_allocation_on_subscription ON public.users;
CREATE TRIGGER reset_allocation_on_subscription
AFTER UPDATE ON public.users
FOR EACH ROW
WHEN (OLD.plan IS DISTINCT FROM NEW.plan OR OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
EXECUTE FUNCTION reset_monthly_startup_allocation();

-- Function to check monthly allocation before adding startup
CREATE OR REPLACE FUNCTION check_monthly_startup_allocation(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, created_this_month INTEGER, limit_remaining INTEGER) AS $$
DECLARE
  v_created INTEGER;
  v_monthly_limit INTEGER := 15;
BEGIN
  -- Get current monthly count
  SELECT COALESCE(startups_created_this_month, 0) INTO v_created
  FROM public.user_profiles
  WHERE id = p_user_id;

  RETURN QUERY SELECT
    (v_created < v_monthly_limit)::BOOLEAN,
    v_created,
    (v_monthly_limit - v_created)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to increment monthly counter when startup created
CREATE OR REPLACE FUNCTION increment_monthly_startup_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET startups_created_this_month = COALESCE(startups_created_this_month, 0) + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment counter when startup created
CREATE OR REPLACE FUNCTION auto_increment_monthly_count()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_monthly_startup_count(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_increment_on_startup_create ON public.startups;
CREATE TRIGGER auto_increment_on_startup_create
AFTER INSERT ON public.startups
FOR EACH ROW
EXECUTE FUNCTION auto_increment_monthly_count();

-- Add comment for clarity
COMMENT ON COLUMN public.user_profiles.startups_created_this_month IS
'Tracks how many startups user has CREATED this month. Never decreases with deletions.
Once limit (15) is reached, user cannot add more until next month renewal.
Resets to 0 on subscription renewal.';

COMMENT ON COLUMN public.user_profiles.monthly_cycle_start_date IS
'Date when current monthly allocation started. Used to determine reset timing.';
