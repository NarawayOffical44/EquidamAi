-- Free accounts can keep one draft startup profile.
-- Paid plans still control full reports, PDF export, Evaldam AI Score, and team seats.
CREATE OR REPLACE FUNCTION public.reset_monthly_startup_allocation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.plan IS DISTINCT FROM NEW.plan
    OR OLD.plan_active IS DISTINCT FROM NEW.plan_active
    OR OLD.subscription_start_date IS DISTINCT FROM NEW.subscription_start_date
    OR OLD.subscription_end_date IS DISTINCT FROM NEW.subscription_end_date
  THEN
    UPDATE public.user_profiles
    SET
      startups_created_this_month = 0,
      monthly_cycle_start_date = CURRENT_DATE,
      last_subscription_renewal_date = NOW(),
      tier = CASE WHEN COALESCE(NEW.plan_active, FALSE) THEN NEW.plan ELSE 'free' END,
      max_startups = CASE
        WHEN NOT COALESCE(NEW.plan_active, FALSE) THEN 1
        WHEN NEW.plan IN ('free') THEN 1
        WHEN NEW.plan IN ('pro', 'startup') THEN 1
        WHEN NEW.plan IN ('plus', 'agency', 'business', 'advisor') THEN 10
        WHEN NEW.plan = 'enterprise' THEN COALESCE(NEW.enterprise_startup_limit, 999999)
        ELSE 1
      END,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_monthly_startup_allocation(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, created_this_month INTEGER, limit_remaining INTEGER) AS $$
DECLARE
  v_created INTEGER;
  v_plan TEXT;
  v_plan_active BOOLEAN;
  v_enterprise_startup_limit INTEGER;
  v_monthly_limit INTEGER := 1;
BEGIN
  SELECT COALESCE(up.startups_created_this_month, 0), LOWER(COALESCE(u.plan, 'free')), COALESCE(u.plan_active, FALSE), u.enterprise_startup_limit
  INTO v_created, v_plan, v_plan_active, v_enterprise_startup_limit
  FROM public.users u
  LEFT JOIN public.user_profiles up ON up.id = u.id
  WHERE u.id = p_user_id;

  IF NOT COALESCE(v_plan_active, FALSE) OR v_plan = 'free' THEN
    v_monthly_limit := 1;
  ELSIF v_plan IN ('pro', 'startup') THEN
    v_monthly_limit := 1;
  ELSIF v_plan IN ('plus', 'agency', 'business', 'advisor') THEN
    v_monthly_limit := 10;
  ELSIF v_plan = 'enterprise' THEN
    v_monthly_limit := COALESCE(v_enterprise_startup_limit, 999999);
  END IF;

  RETURN QUERY SELECT
    (COALESCE(v_created, 0) < v_monthly_limit)::BOOLEAN,
    COALESCE(v_created, 0),
    GREATEST(v_monthly_limit - COALESCE(v_created, 0), 0)::INTEGER;
END;
$$ LANGUAGE plpgsql;

UPDATE public.user_profiles
SET max_startups = 1, tier = 'free', updated_at = NOW()
WHERE tier = 'free' AND max_startups < 1;

COMMENT ON FUNCTION check_monthly_startup_allocation(UUID) IS
  'Checks monthly startup creation allowance. Free = 1 draft, Startup/pro = 1, Agency/plus = 10, Enterprise = configured or unlimited.';
