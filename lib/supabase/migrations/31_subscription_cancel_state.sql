-- Latest account billing patch.
-- Safe to rerun. For a fresh or incomplete database, run
-- lib/supabase/evaldam_optimized_schema.sql first, then rerun this patch.

DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE NOTICE 'public.users does not exist. Run lib/supabase/evaldam_optimized_schema.sql first.';
    RETURN;
  END IF;

  ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS billing_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

  COMMENT ON COLUMN public.users.subscription_cancel_at_period_end IS
    'True when auto-renewal has been cancelled but paid access remains active until subscription_end_date.';

  COMMENT ON COLUMN public.users.subscription_cancelled_at IS
    'When the user requested subscription cancellation.';

  COMMENT ON COLUMN public.users.billing_metadata IS
    'Compact account-level billing metadata such as invoice email status. Do not create separate billing tables unless the data becomes relational.';
END $$;

NOTIFY pgrst, 'reload schema';
