// Anonymous ingestion endpoint for the guide's usage analytics.
//
// WHY THIS EXISTS
// The teachers' browsers used to POST events straight at Neon's Data API. That
// API demands a JWT on every request, the guide sends none on purpose — a
// visitor's browser must never hold a secret (REQ-ANALYTICS-007, CLAUDE.md rule
// 2) — so every event since the database was created was rejected with
// `400 missing authentication credentials`. Not one visit was ever recorded.
//
// This function is the owner's chosen fix: the browser posts here with no
// credential at all, and the credential stays on the server. Neon injects
// DATABASE_URL into the function's environment, so there is no secret to commit,
// to rotate, or to leak — nothing here is ever sent to a browser.
//
// It writes ONLY through public.track_analytics_events(jsonb), the same
// SECURITY DEFINER function the schema has always defined as the single public
// ingestion path. That function caps the batch at 200, clamps active_ms to
// 0..30000, truncates path and referrer, and ignores duplicate ids. This file
// adds no second way in.
//
// Deployed with:
//   neon functions deploy analytics-ingest --src functions/analytics-ingest/index.mjs --wait
//
// Written as .mjs, not .ts, so it stays out of the project's tsc pass: it runs on
// Neon's Node 24 runtime, not in the site bundle, and shares no types with it.

/** Only the live guide may write. A browser always sends Origin cross-origin. */
const ALLOWED_ORIGIN = 'https://yanivmizrachiy.github.io';

/** Same ceiling the database function enforces; rejected here to save a round trip. */
const MAX_EVENTS = 200;

function cors(extra = {}) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    ...extra,
  };
}

/**
 * Neon speaks SQL over HTTPS, so the runtime needs no database driver and this
 * function ships with no dependencies. The endpoint is DATABASE_URL's own host
 * plus /sql.
 */
async function callIngest(events) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  const host = new URL(connectionString).hostname;

  const response = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': connectionString,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'false',
    },
    // Parameterised: the payload is bound as jsonb and never concatenated into SQL.
    body: JSON.stringify({
      query: 'SELECT public.track_analytics_events($1::jsonb)',
      params: [JSON.stringify(events)],
    }),
  });

  if (!response.ok) {
    // Never echo the body: a connection string can appear inside a Postgres error.
    throw new Error(`ingest failed with ${response.status}`);
  }
}

export default {
  async fetch(request) {
    const origin = request.headers.get('origin') ?? '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }
    if (request.method !== 'POST') {
      return new Response(null, { status: 405, headers: cors({ Allow: 'POST, OPTIONS' }) });
    }
    if (origin !== ALLOWED_ORIGIN) {
      // A public URL with no platform gate in front of it, so the handler is the
      // gate. This stops casual abuse; it is not a claim of authentication.
      return new Response(null, { status: 403, headers: cors() });
    }

    let events;
    try {
      const body = await request.json();
      events = Array.isArray(body?.events) ? body.events : null;
    } catch {
      events = null;
    }
    if (!events) {
      return new Response(null, { status: 400, headers: cors() });
    }
    if (events.length === 0) {
      return new Response(null, { status: 204, headers: cors() });
    }
    if (events.length > MAX_EVENTS) {
      return new Response(null, { status: 413, headers: cors() });
    }

    try {
      await callIngest(events);
    } catch {
      // Measurement must never be worth an error in a teacher's browser
      // (REQ-ANALYTICS-006). The client retries from its own queue.
      return new Response(null, { status: 503, headers: cors() });
    }

    return new Response(null, { status: 204, headers: cors() });
  },
};
