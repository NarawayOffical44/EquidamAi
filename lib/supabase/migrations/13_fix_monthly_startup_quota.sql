-- Fix monthly startup quota reset trigger to use columns that exist on public.users.
DROP TRIGGER IF EXISTS reset_allocation_on_subscription ON public.users;

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
      tier = NEW.plan,
      max_startups = CASE
        WHEN NEW.plan = 'pro' THEN 3
        WHEN NEW.plan = 'plus' THEN 15
        WHEN NEW.plan = 'enterprise' THEN COALESCE(NEW.enterprise_startup_limit, 999999)
        ELSE 0
      END,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_allocation_on_subscription
AFTER UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.reset_monthly_startup_allocation();
