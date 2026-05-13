-- Startup setup fields are treated as immutable after creation.
-- Users can still update traction, financials, proof markers, assumptions, and reports.
CREATE OR REPLACE FUNCTION public.prevent_startup_setup_field_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.company_name IS DISTINCT FROM NEW.company_name
    OR OLD.stage IS DISTINCT FROM NEW.stage
    OR OLD.industry IS DISTINCT FROM NEW.industry
    OR OLD.website_url IS DISTINCT FROM NEW.website_url
    OR OLD.description IS DISTINCT FROM NEW.description
  THEN
    RAISE EXCEPTION 'Startup setup fields cannot be changed after creation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_startup_setup_field_updates ON public.startups;
CREATE TRIGGER prevent_startup_setup_field_updates
BEFORE UPDATE ON public.startups
FOR EACH ROW
EXECUTE FUNCTION public.prevent_startup_setup_field_updates();
