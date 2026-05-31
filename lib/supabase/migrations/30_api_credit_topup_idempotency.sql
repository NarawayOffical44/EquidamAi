-- Make Stripe API credit top-ups idempotent when the success page and webhook run close together.

CREATE INDEX IF NOT EXISTS idx_api_credit_transactions_stripe_session
  ON public.api_credit_transactions(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

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

  IF p_stripe_session_id IS NOT NULL AND btrim(p_stripe_session_id) <> '' THEN
    PERFORM pg_advisory_xact_lock(2034002026, hashtext(p_stripe_session_id));

    SELECT balance_micro_usd INTO v_balance
    FROM public.api_wallets
    WHERE user_id = p_user_id;

    IF EXISTS (
      SELECT 1
      FROM public.api_credit_transactions
      WHERE user_id = p_user_id
        AND stripe_session_id = p_stripe_session_id
        AND type = 'top_up'
    ) THEN
      RETURN COALESCE(v_balance, 0);
    END IF;
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
