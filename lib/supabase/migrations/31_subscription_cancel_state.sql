-- Track subscriptions that should stay active until the paid period ends.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.subscription_cancel_at_period_end IS
  'True when auto-renewal has been cancelled but paid access remains active until subscription_end_date.';

COMMENT ON COLUMN public.users.subscription_cancelled_at IS
  'When the user requested subscription cancellation.';
