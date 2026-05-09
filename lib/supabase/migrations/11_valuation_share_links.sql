-- Public investor links for valuation reports.
-- Existing report pages are valuation-based, so sharing lives on valuations.

ALTER TABLE IF EXISTS public.valuations
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_valuations_share_token
  ON public.valuations(share_token)
  WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_valuations_public_share
  ON public.valuations(is_public, share_token)
  WHERE is_public = true;
