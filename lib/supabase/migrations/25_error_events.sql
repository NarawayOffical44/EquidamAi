-- Internal production error event store for client, route boundary, and server errors.

CREATE TABLE IF NOT EXISTS public.error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('client', 'server', 'route_boundary', 'global_boundary')),
  level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('info', 'warning', 'error', 'fatal')),
  message TEXT NOT NULL,
  name TEXT,
  stack TEXT,
  digest TEXT,
  component_stack TEXT,
  path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_events_created_at
  ON public.error_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_events_source_created_at
  ON public.error_events(source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_events_path_created_at
  ON public.error_events(path, created_at DESC)
  WHERE path IS NOT NULL;

ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS error_events_no_user_access ON public.error_events;
CREATE POLICY error_events_no_user_access
  ON public.error_events
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.error_events IS
  'Application error telemetry captured by the service role. Not readable by end users.';
