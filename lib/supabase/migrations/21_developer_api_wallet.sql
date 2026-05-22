-- Self-serve Evaldam Developer API.
-- Separate from subscription plans: authenticated users create API keys and use prepaid credits.

CREATE TABLE IF NOT EXISTS public.api_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_micro_usd BIGINT NOT NULL DEFAULT 0 CHECK (balance_micro_usd >= 0),
  low_balance_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'suspended')),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_micro_usd BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('top_up', 'usage', 'adjustment', 'refund', 'expiration')),
  remaining_micro_usd BIGINT NOT NULL DEFAULT 0 CHECK (remaining_micro_usd >= 0),
  stripe_session_id TEXT,
  description TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  request_id TEXT NOT NULL,
  model TEXT NOT NULL,
  cost_micro_usd BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  input_tokens INTEGER,
  output_tokens INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_rate_limit_counters (
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  window_key TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (api_key_id, window_key)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_status ON public.api_keys(user_id, status);
CREATE INDEX IF NOT EXISTS idx_api_usage_key_created ON public.api_usage_events(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_created ON public.api_usage_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_credit_transactions_user_created ON public.api_credit_transactions(user_id, created_at DESC);

ALTER TABLE public.api_credit_transactions
  ADD COLUMN IF NOT EXISTS remaining_micro_usd BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_api_credit_transactions_expiry ON public.api_credit_transactions(user_id, expires_at)
  WHERE remaining_micro_usd > 0;

DO $$
BEGIN
  ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_status_check;
  ALTER TABLE public.api_keys
    ADD CONSTRAINT api_keys_status_check CHECK (status IN ('active', 'revoked', 'suspended'));

  ALTER TABLE public.api_credit_transactions DROP CONSTRAINT IF EXISTS api_credit_transactions_type_check;
  ALTER TABLE public.api_credit_transactions
    ADD CONSTRAINT api_credit_transactions_type_check CHECK (type IN ('top_up', 'usage', 'adjustment', 'refund', 'expiration'));

  ALTER TABLE public.api_credit_transactions DROP CONSTRAINT IF EXISTS api_credit_transactions_remaining_micro_usd_check;
  ALTER TABLE public.api_credit_transactions
    ADD CONSTRAINT api_credit_transactions_remaining_micro_usd_check CHECK (remaining_micro_usd >= 0);
END $$;

ALTER TABLE public.api_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limit_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own API wallet" ON public.api_wallets;
CREATE POLICY "Users view own API wallet" ON public.api_wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own API keys" ON public.api_keys;
CREATE POLICY "Users view own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own API credit transactions" ON public.api_credit_transactions;
CREATE POLICY "Users view own API credit transactions" ON public.api_credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own API usage" ON public.api_usage_events;
CREATE POLICY "Users view own API usage" ON public.api_usage_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service manages API rate limits" ON public.api_rate_limit_counters;
CREATE POLICY "Service manages API rate limits" ON public.api_rate_limit_counters
  FOR ALL USING (false);

CREATE OR REPLACE FUNCTION public.expire_api_credits(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_expired BIGINT := 0;
  v_balance BIGINT := 0;
BEGIN
  SELECT COALESCE(SUM(remaining_micro_usd), 0) INTO v_expired
  FROM public.api_credit_transactions
  WHERE user_id = p_user_id
    AND remaining_micro_usd > 0
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();

  IF v_expired > 0 THEN
    UPDATE public.api_credit_transactions
    SET remaining_micro_usd = 0
    WHERE user_id = p_user_id
      AND remaining_micro_usd > 0
      AND expires_at IS NOT NULL
      AND expires_at <= NOW();

    UPDATE public.api_wallets
    SET balance_micro_usd = GREATEST(balance_micro_usd - v_expired, 0),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance_micro_usd INTO v_balance;

    INSERT INTO public.api_credit_transactions (
      user_id,
      amount_micro_usd,
      type,
      description
    )
    VALUES (
      p_user_id,
      -v_expired,
      'expiration',
      'API credits expired'
    );
  ELSE
    SELECT COALESCE(balance_micro_usd, 0) INTO v_balance
    FROM public.api_wallets
    WHERE user_id = p_user_id;
  END IF;

  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_api_credits(
  p_user_id UUID,
  p_amount_micro_usd BIGINT,
  p_stripe_session_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS BIGINT AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  IF p_amount_micro_usd <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  INSERT INTO public.api_wallets (user_id, balance_micro_usd, updated_at)
  VALUES (p_user_id, p_amount_micro_usd, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance_micro_usd = public.api_wallets.balance_micro_usd + p_amount_micro_usd,
    updated_at = NOW()
  RETURNING balance_micro_usd INTO v_balance;

  INSERT INTO public.api_credit_transactions (
    user_id,
    amount_micro_usd,
    type,
    remaining_micro_usd,
    stripe_session_id,
    description,
    expires_at,
    metadata
  )
  VALUES (
    p_user_id,
    p_amount_micro_usd,
    'top_up',
    p_amount_micro_usd,
    p_stripe_session_id,
    COALESCE(p_description, 'API credit top-up'),
    NOW() + INTERVAL '6 months',
    COALESCE(p_metadata, '{}')
  );

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.deduct_api_credits(
  p_user_id UUID,
  p_amount_micro_usd BIGINT
)
RETURNS BIGINT AS $$
DECLARE
  v_balance BIGINT;
  v_remaining BIGINT;
  v_take BIGINT;
  v_lot RECORD;
BEGIN
  IF p_amount_micro_usd <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  PERFORM public.expire_api_credits(p_user_id);

  SELECT balance_micro_usd INTO v_balance
  FROM public.api_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    INSERT INTO public.api_wallets (user_id, balance_micro_usd, updated_at)
    VALUES (p_user_id, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;
    v_balance := 0;
  END IF;

  IF v_balance < p_amount_micro_usd THEN
    RAISE EXCEPTION 'Insufficient API credits';
  END IF;

  v_remaining := p_amount_micro_usd;

  FOR v_lot IN
    SELECT id, remaining_micro_usd
    FROM public.api_credit_transactions
    WHERE user_id = p_user_id
      AND remaining_micro_usd > 0
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY expires_at NULLS LAST, created_at
    FOR UPDATE
  LOOP
    v_take := LEAST(v_remaining, v_lot.remaining_micro_usd);

    UPDATE public.api_credit_transactions
    SET remaining_micro_usd = remaining_micro_usd - v_take
    WHERE id = v_lot.id;

    v_remaining := v_remaining - v_take;
    EXIT WHEN v_remaining <= 0;
  END LOOP;

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient API credits';
  END IF;

  UPDATE public.api_wallets
  SET balance_micro_usd = balance_micro_usd - p_amount_micro_usd,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance_micro_usd INTO v_balance;

  INSERT INTO public.api_credit_transactions (
    user_id,
    amount_micro_usd,
    type,
    description
  )
  VALUES (
    p_user_id,
    -p_amount_micro_usd,
    'usage',
    'Evaldam API usage'
  );

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.adjust_api_credits(
  p_user_id UUID,
  p_amount_micro_usd BIGINT,
  p_type TEXT DEFAULT 'adjustment',
  p_description TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  IF p_amount_micro_usd = 0 THEN
    SELECT COALESCE(balance_micro_usd, 0) INTO v_balance
    FROM public.api_wallets
    WHERE user_id = p_user_id;
    RETURN COALESCE(v_balance, 0);
  END IF;

  INSERT INTO public.api_wallets (user_id, balance_micro_usd, updated_at)
  VALUES (p_user_id, GREATEST(p_amount_micro_usd, 0), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance_micro_usd = GREATEST(public.api_wallets.balance_micro_usd + p_amount_micro_usd, 0),
    updated_at = NOW()
  RETURNING balance_micro_usd INTO v_balance;

  INSERT INTO public.api_credit_transactions (
    user_id,
    amount_micro_usd,
    type,
    remaining_micro_usd,
    description,
    expires_at
  )
  VALUES (
    p_user_id,
    p_amount_micro_usd,
    p_type,
    CASE WHEN p_amount_micro_usd > 0 THEN p_amount_micro_usd ELSE 0 END,
    COALESCE(p_description, 'API wallet adjustment'),
    CASE WHEN p_amount_micro_usd > 0 THEN NOW() + INTERVAL '6 months' ELSE NULL END
  );

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_api_rate_limit_counter(
  p_api_key_id UUID,
  p_window_key TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.api_rate_limit_counters (
    api_key_id,
    window_key,
    request_count,
    expires_at,
    updated_at
  )
  VALUES (
    p_api_key_id,
    p_window_key,
    1,
    p_expires_at,
    NOW()
  )
  ON CONFLICT (api_key_id, window_key)
  DO UPDATE SET
    request_count = public.api_rate_limit_counters.request_count + 1,
    updated_at = NOW()
  RETURNING request_count INTO v_count;

  DELETE FROM public.api_rate_limit_counters WHERE expires_at < NOW();

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_api_monthly_usage(p_user_id UUID)
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(cost_micro_usd), 0)::BIGINT
  FROM public.api_usage_events
  WHERE user_id = p_user_id
    AND status = 'success'
    AND created_at >= DATE_TRUNC('month', NOW());
$$ LANGUAGE sql SECURITY DEFINER;
