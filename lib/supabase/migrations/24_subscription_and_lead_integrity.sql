-- Keep Stripe subscriptions one-to-one with users and stop using website_url for lead metadata.

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    WITH ranked_subscriptions AS (
      SELECT
        id,
        subscription_id,
        ROW_NUMBER() OVER (
          PARTITION BY subscription_id
          ORDER BY
            COALESCE(plan_active, false) DESC,
            subscription_start_date DESC NULLS LAST,
            created_at DESC NULLS LAST,
            id
        ) AS row_number
      FROM public.users
      WHERE subscription_id IS NOT NULL
        AND btrim(subscription_id) <> ''
    )
    UPDATE public.users users
    SET
      subscription_id = NULL,
      plan_active = false,
      subscription_end_date = COALESCE(subscription_end_date, NOW())
    FROM ranked_subscriptions ranked
    WHERE users.id = ranked.id
      AND ranked.row_number > 1;

    EXECUTE '
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_subscription_id_unique
      ON public.users(subscription_id)
      WHERE subscription_id IS NOT NULL AND btrim(subscription_id) <> ''''
    ';
  END IF;
END $$;

DO $$
DECLARE
  lead_record RECORD;
  parsed_metadata JSONB;
BEGIN
  IF to_regclass('public.leads') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

  FOR lead_record IN
    SELECT id, website_url
    FROM public.leads
    WHERE website_url IS NOT NULL
      AND btrim(website_url) LIKE '{%'
  LOOP
    BEGIN
      parsed_metadata := lead_record.website_url::jsonb;

      UPDATE public.leads
      SET
        metadata = COALESCE(metadata, '{}'::jsonb) || parsed_metadata,
        website_url = NULL
      WHERE id = lead_record.id;
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END LOOP;

  EXECUTE '
    CREATE INDEX IF NOT EXISTS idx_leads_metadata_source
    ON public.leads ((metadata->>''source''))
  ';

  COMMENT ON COLUMN public.leads.metadata IS
    'Structured attribution and lead source metadata. website_url should contain only a real URL.';
END $$;
