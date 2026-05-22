CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 1,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status_received
  ON public.stripe_webhook_events(status, received_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stripe_webhook_events_service_role_all ON public.stripe_webhook_events;
CREATE POLICY stripe_webhook_events_service_role_all
  ON public.stripe_webhook_events
  FOR ALL
  USING (false);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Durable Stripe webhook idempotency ledger. Managed only through the service role.';

CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  p_event_id TEXT,
  p_event_type TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
  v_locked_at TIMESTAMPTZ;
BEGIN
  INSERT INTO public.stripe_webhook_events (
    event_id,
    event_type,
    status,
    attempts,
    received_at,
    locked_at
  )
  VALUES (
    p_event_id,
    p_event_type,
    'processing',
    1,
    NOW(),
    NOW()
  )
  ON CONFLICT (event_id) DO NOTHING;

  IF FOUND THEN
    RETURN 'claimed';
  END IF;

  SELECT status, locked_at
    INTO v_status, v_locked_at
  FROM public.stripe_webhook_events
  WHERE event_id = p_event_id
  FOR UPDATE;

  IF v_status = 'processed' THEN
    RETURN 'processed';
  END IF;

  IF v_status = 'processing' AND v_locked_at > NOW() - INTERVAL '10 minutes' THEN
    RETURN 'processing';
  END IF;

  UPDATE public.stripe_webhook_events
  SET
    event_type = p_event_type,
    status = 'processing',
    attempts = attempts + 1,
    locked_at = NOW(),
    last_error = NULL
  WHERE event_id = p_event_id;

  RETURN 'claimed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_stripe_webhook_event_processed(p_event_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.stripe_webhook_events
  SET
    status = 'processed',
    processed_at = NOW(),
    last_error = NULL
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_stripe_webhook_event_failed(
  p_event_id TEXT,
  p_last_error TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.stripe_webhook_events
  SET
    status = 'failed',
    last_error = LEFT(COALESCE(p_last_error, 'unknown error'), 1000)
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
