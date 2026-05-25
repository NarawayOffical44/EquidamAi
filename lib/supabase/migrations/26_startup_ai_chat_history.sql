-- Durable Startup AI chat history for paid dashboard users.
-- Free/public chat remains browser-local and is not stored here.
CREATE TABLE IF NOT EXISTS public.startup_ai_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New chat',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.startup_ai_chat_threads
  ADD COLUMN IF NOT EXISTS messages JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.startup_ai_chat_threads
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.startup_ai_chat_threads
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

DO $$
BEGIN
  IF to_regclass('public.startup_ai_chat_messages') IS NOT NULL THEN
    UPDATE public.startup_ai_chat_threads t
    SET messages = migrated.messages
    FROM (
      SELECT
        thread_id,
        jsonb_agg(
          jsonb_build_object('role', role, 'content', content)
          ORDER BY created_at ASC
        ) AS messages
      FROM public.startup_ai_chat_messages
      WHERE role IN ('user', 'assistant')
        AND char_length(trim(content)) > 0
      GROUP BY thread_id
    ) migrated
    WHERE t.id = migrated.thread_id
      AND jsonb_array_length(t.messages) = 0;
  END IF;
END $$;

DROP TABLE IF EXISTS public.startup_ai_chat_messages;

ALTER TABLE public.startup_ai_chat_threads
  DROP CONSTRAINT IF EXISTS startup_ai_chat_threads_title_not_empty;

ALTER TABLE public.startup_ai_chat_threads
  ADD CONSTRAINT startup_ai_chat_threads_title_not_empty
  CHECK (char_length(trim(title)) > 0);

ALTER TABLE public.startup_ai_chat_threads
  DROP CONSTRAINT IF EXISTS startup_ai_chat_threads_messages_array;

ALTER TABLE public.startup_ai_chat_threads
  ADD CONSTRAINT startup_ai_chat_threads_messages_array
  CHECK (jsonb_typeof(messages) = 'array');

CREATE INDEX IF NOT EXISTS idx_startup_ai_chat_threads_user_updated
  ON public.startup_ai_chat_threads(user_id, updated_at DESC)
  WHERE archived_at IS NULL;

CREATE OR REPLACE FUNCTION public.touch_startup_ai_chat_thread()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_startup_ai_chat_thread_on_update ON public.startup_ai_chat_threads;
CREATE TRIGGER touch_startup_ai_chat_thread_on_update
BEFORE UPDATE ON public.startup_ai_chat_threads
FOR EACH ROW
EXECUTE FUNCTION public.touch_startup_ai_chat_thread();

CREATE OR REPLACE FUNCTION public.append_startup_ai_chat_exchange(
  p_thread_id UUID,
  p_user_id UUID,
  p_user_message TEXT,
  p_assistant_message TEXT,
  p_title TEXT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  messages JSONB,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_thread_id UUID := COALESCE(p_thread_id, gen_random_uuid());
  v_title TEXT := COALESCE(NULLIF(trim(p_title), ''), 'New chat');
  v_exchange JSONB;
BEGIN
  IF auth.role() <> 'service_role' AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized to append Startup AI chat history' USING ERRCODE = '42501';
  END IF;

  IF char_length(trim(p_user_message)) = 0 OR char_length(trim(p_assistant_message)) = 0 THEN
    RAISE EXCEPTION 'Chat messages cannot be empty' USING ERRCODE = '22023';
  END IF;

  v_exchange := jsonb_build_array(
    jsonb_build_object('role', 'user', 'content', left(p_user_message, 12000)),
    jsonb_build_object('role', 'assistant', 'content', left(p_assistant_message, 12000))
  );

  RETURN QUERY
  INSERT INTO public.startup_ai_chat_threads (
    id,
    user_id,
    title,
    messages,
    updated_at
  )
  VALUES (
    v_thread_id,
    p_user_id,
    v_title,
    v_exchange,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    title = CASE
      WHEN char_length(trim(startup_ai_chat_threads.title)) = 0
        OR startup_ai_chat_threads.title = 'New chat'
      THEN EXCLUDED.title
      ELSE startup_ai_chat_threads.title
    END,
    messages = COALESCE(
      (
        SELECT jsonb_agg(kept.value ORDER BY kept.ordinal)
        FROM (
          SELECT item.value, item.ordinal
          FROM jsonb_array_elements(startup_ai_chat_threads.messages || EXCLUDED.messages)
            WITH ORDINALITY AS item(value, ordinal)
          ORDER BY item.ordinal DESC
          LIMIT 40
        ) kept
      ),
      '[]'::jsonb
    ),
    updated_at = NOW()
  WHERE startup_ai_chat_threads.user_id = p_user_id
  RETURNING
    startup_ai_chat_threads.id,
    startup_ai_chat_threads.title,
    startup_ai_chat_threads.messages,
    startup_ai_chat_threads.updated_at;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Startup AI chat thread not found' USING ERRCODE = '42501';
  END IF;
END;
$$;

ALTER TABLE public.startup_ai_chat_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS startup_ai_chat_threads_service_role_all ON public.startup_ai_chat_threads;
CREATE POLICY startup_ai_chat_threads_service_role_all
  ON public.startup_ai_chat_threads
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS startup_ai_chat_threads_owner_all ON public.startup_ai_chat_threads;
CREATE POLICY startup_ai_chat_threads_owner_all
  ON public.startup_ai_chat_threads
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.startup_ai_chat_threads IS
  'Paid dashboard Startup AI chat threads. Each row stores one chat thread with its messages in JSONB. Free/public chat is intentionally local-only.';
