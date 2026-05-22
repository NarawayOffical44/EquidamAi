-- Durable AI usage counters for plan-based limits.
-- Period keys make monthly/daily reset deterministic without scheduled jobs.
CREATE TABLE IF NOT EXISTS public.ai_usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_key TEXT NOT NULL,
  feature TEXT NOT NULL CHECK (feature IN ('startup_ai', 'workspace_chat', 'valuation_preview', 'report_download')),
  plan_key TEXT NOT NULL,
  period_key TEXT NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usage_key, feature, period_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_counters_user_feature
  ON public.ai_usage_counters(user_id, feature, period_key);

CREATE INDEX IF NOT EXISTS idx_ai_usage_counters_reset_at
  ON public.ai_usage_counters(reset_at);

ALTER TABLE public.ai_usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_usage_counters_service_role_all ON public.ai_usage_counters;
CREATE POLICY ai_usage_counters_service_role_all
  ON public.ai_usage_counters
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.ai_usage_counters IS
  'Durable usage counters for Evaldam AI features. Reset is handled by day/month period_key, so old rows remain as audit history.';

CREATE OR REPLACE FUNCTION public.increment_ai_usage_counter(
  p_user_id UUID,
  p_usage_key TEXT,
  p_feature TEXT,
  p_plan_key TEXT,
  p_period_key TEXT,
  p_reset_at TIMESTAMPTZ
)
RETURNS INTEGER AS $$
DECLARE
  v_used_count INTEGER;
BEGIN
  INSERT INTO public.ai_usage_counters (
    user_id,
    usage_key,
    feature,
    plan_key,
    period_key,
    used_count,
    reset_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_usage_key,
    p_feature,
    p_plan_key,
    p_period_key,
    1,
    p_reset_at,
    NOW()
  )
  ON CONFLICT (usage_key, feature, period_key)
  DO UPDATE SET
    used_count = public.ai_usage_counters.used_count + 1,
    plan_key = EXCLUDED.plan_key,
    reset_at = EXCLUDED.reset_at,
    updated_at = NOW()
  RETURNING used_count INTO v_used_count;

  RETURN v_used_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_ai_usage_counter(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) IS
  'Atomically increments an AI usage counter for a user/session, feature, and billing period.';
