-- Extend durable usage counters to cover monthly report download limits.
ALTER TABLE public.ai_usage_counters
  DROP CONSTRAINT IF EXISTS ai_usage_counters_feature_check;

ALTER TABLE public.ai_usage_counters
  ADD CONSTRAINT ai_usage_counters_feature_check
  CHECK (feature IN ('startup_ai', 'workspace_chat', 'valuation_preview', 'report_download'));

CREATE OR REPLACE FUNCTION public.increment_ai_usage_counter_if_available(
  p_user_id UUID,
  p_usage_key TEXT,
  p_feature TEXT,
  p_plan_key TEXT,
  p_period_key TEXT,
  p_reset_at TIMESTAMPTZ,
  p_limit INTEGER
)
RETURNS TABLE(allowed BOOLEAN, used_count INTEGER) AS $$
DECLARE
  v_used_count INTEGER;
BEGIN
  IF p_limit <= 0 THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

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
  WHERE public.ai_usage_counters.used_count < p_limit
  RETURNING public.ai_usage_counters.used_count INTO v_used_count;

  IF v_used_count IS NULL THEN
    SELECT c.used_count INTO v_used_count
    FROM public.ai_usage_counters c
    WHERE c.usage_key = p_usage_key
      AND c.feature = p_feature
      AND c.period_key = p_period_key;

    RETURN QUERY SELECT FALSE, COALESCE(v_used_count, 0);
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_used_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_ai_usage_counter_if_available(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, INTEGER)
  IS 'Atomically increments an AI/report usage counter only when the plan limit has remaining capacity.';
