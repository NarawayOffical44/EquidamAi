-- Store attribution and source details without overloading website_url.
ALTER TABLE IF EXISTS public.leads
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_leads_metadata_source
ON public.leads ((metadata->>'source'));
