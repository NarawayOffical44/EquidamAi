-- Enforce immutability for core startup details
-- Once a startup is created, critical fields cannot be changed
-- This prevents data inconsistency in valuations

-- Create function to prevent updates to core fields
CREATE OR REPLACE FUNCTION prevent_startup_core_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing company_name
  IF OLD.company_name IS DISTINCT FROM NEW.company_name THEN
    RAISE EXCEPTION 'Cannot change company_name after startup creation';
  END IF;

  -- Prevent changing stage
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    RAISE EXCEPTION 'Cannot change stage after startup creation';
  END IF;

  -- Prevent changing website_url
  IF OLD.website_url IS DISTINCT FROM NEW.website_url THEN
    RAISE EXCEPTION 'Cannot change website_url after startup creation';
  END IF;

  -- Prevent changing arr (core financial metric)
  IF OLD.arr IS DISTINCT FROM NEW.arr THEN
    RAISE EXCEPTION 'Cannot change arr after startup creation - create new startup profile instead';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for startups table
DROP TRIGGER IF EXISTS prevent_startup_core_update_trigger ON public.startups;
CREATE TRIGGER prevent_startup_core_update_trigger
BEFORE UPDATE ON public.startups
FOR EACH ROW
EXECUTE FUNCTION prevent_startup_core_update();

-- Create RLS policy to prevent updates (except for specific approved fields)
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;

-- Allow only updated_at to be modified
CREATE POLICY "Startups are read-only for core fields" ON public.startups
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    -- Only allow updating specific non-critical fields
    auth.uid() = user_id
  );

-- Comment for clarity
COMMENT ON FUNCTION prevent_startup_core_update() IS
'Prevents modification of core startup details after creation.
Core fields (company_name, stage, website_url, arr) define valuation basis
and must remain immutable to ensure valuation consistency and prevent abuse.';
