-- Canonical reference schema for the Moodle Guide anonymous analytics system.
-- The live database is Neon/PostgreSQL. Verify the live schema before applying changes.
-- Do not add public SELECT access and do not grant analytics_ingest direct table access.
-- Constraint set below was verified against the live database on 2026-09-16.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  session_id uuid NOT NULL,
  visitor_id uuid NOT NULL,
  event_type text NOT NULL
    CONSTRAINT analytics_events_event_type_check
    CHECK (event_type IN ('session_start', 'heartbeat', 'slide_view', 'session_end')),
  slide_id text,
  active_ms integer NOT NULL DEFAULT 0
    CONSTRAINT analytics_events_active_ms_check
    CHECK (active_ms >= 0 AND active_ms <= 30000),
  client_ts timestamptz NOT NULL,
  path text NOT NULL
    CONSTRAINT analytics_events_path_check
    CHECK (char_length(path) <= 500),
  referrer text
    CONSTRAINT analytics_events_referrer_check
    CHECK (referrer IS NULL OR char_length(referrer) <= 1000),
  viewport_width integer
    CONSTRAINT analytics_events_viewport_width_check
    CHECK (viewport_width IS NULL OR (viewport_width >= 1 AND viewport_width <= 10000)),
  viewport_height integer
    CONSTRAINT analytics_events_viewport_height_check
    CHECK (viewport_height IS NULL OR (viewport_height >= 1 AND viewport_height <= 10000))
);

CREATE INDEX IF NOT EXISTS analytics_events_received_at_idx
  ON public.analytics_events (received_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_session_idx
  ON public.analytics_events (session_id, received_at);

CREATE INDEX IF NOT EXISTS analytics_events_visitor_idx
  ON public.analytics_events (visitor_id, received_at);

CREATE OR REPLACE FUNCTION public.track_analytics_events(events jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item jsonb;
BEGIN
  IF jsonb_typeof(events) <> 'array' OR jsonb_array_length(events) > 200 THEN
    RAISE EXCEPTION 'invalid analytics batch';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(events)
  LOOP
    INSERT INTO public.analytics_events (
      id,
      session_id,
      visitor_id,
      event_type,
      slide_id,
      active_ms,
      client_ts,
      path,
      referrer,
      viewport_width,
      viewport_height
    )
    VALUES (
      (item->>'id')::uuid,
      (item->>'session_id')::uuid,
      (item->>'visitor_id')::uuid,
      item->>'event_type',
      NULLIF(item->>'slide_id', ''),
      LEAST(30000, GREATEST(0, COALESCE((item->>'active_ms')::int, 0))),
      (item->>'client_ts')::timestamptz,
      left(COALESCE(item->>'path', '/'), 500),
      NULLIF(left(COALESCE(item->>'referrer', ''), 1000), ''),
      NULLIF(item->>'viewport_width', '')::int,
      NULLIF(item->>'viewport_height', '')::int
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$function$;

CREATE OR REPLACE VIEW public.analytics_sessions AS
SELECT
  session_id,
  visitor_id,
  min(received_at) AS started_at,
  max(received_at) AS last_seen_at,
  sum(active_ms) AS active_ms,
  count(*) FILTER (WHERE event_type = 'slide_view')::integer AS slide_views,
  count(DISTINCT slide_id) FILTER (WHERE slide_id IS NOT NULL)::integer AS distinct_slides,
  max(path) FILTER (WHERE event_type = 'session_start') AS entry_path,
  max(referrer) FILTER (WHERE event_type = 'session_start') AS referrer
FROM public.analytics_events
GROUP BY session_id, visitor_id;

CREATE OR REPLACE VIEW public.analytics_daily AS
SELECT
  date_trunc('day', received_at AT TIME ZONE 'Asia/Jerusalem')::date AS day,
  count(DISTINCT session_id)::integer AS sessions,
  count(DISTINCT visitor_id)::integer AS unique_browsers,
  sum(active_ms) AS active_ms,
  count(*) FILTER (WHERE event_type = 'slide_view')::integer AS slide_views
FROM public.analytics_events
GROUP BY date_trunc('day', received_at AT TIME ZONE 'Asia/Jerusalem')::date
ORDER BY day DESC;

-- Live privilege model verified 2026-09-16:
-- * public.analytics_events table privileges: neondb_owner only.
-- * analytics_ingest: EXECUTE on public.track_analytics_events(jsonb) only.
-- Keep the function as the only public ingestion path.
REVOKE ALL ON TABLE public.analytics_events FROM PUBLIC;
REVOKE ALL ON TABLE public.analytics_events FROM analytics_ingest;
REVOKE ALL ON FUNCTION public.track_analytics_events(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_analytics_events(jsonb) TO analytics_ingest;
