import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error - plain .mjs handler, deployed to Neon's Node runtime, not to the site bundle
import handler from '../functions/analytics-ingest/index.mjs';

/**
 * The ingestion endpoint is a public URL with no platform gate in front of it, so
 * the handler IS the gate. These tests hold that gate in place: the wrong origin,
 * the wrong method and a malformed body must never reach the database, and what
 * does reach it must go through public.track_analytics_events — the single public
 * ingestion path the schema has always defined (REQ-ANALYTICS-007).
 *
 * Every call is asserted against what the handler actually sent, not against a
 * mock that was told what to expect.
 */
const ORIGIN = 'https://yanivmizrachiy.github.io';

function post(body: unknown, origin = ORIGIN) {
  return new Request('https://ingest.invalid/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function stubNeon() {
  const calls: { query: string; params: unknown[] }[] = [];
  vi.stubGlobal('fetch', async (_url: string, options: { body: string }) => {
    calls.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ rows: [] }) };
  });
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.DATABASE_URL;
});

describe('the analytics ingestion endpoint', () => {
  it('accepts a batch from the live guide and writes it only through the RPC', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@host.invalid/neondb';
    const calls = stubNeon();

    const response = await handler.fetch(post({ events: [{ id: 'a', event_type: 'slide_view' }] }));

    expect(response.status).toBe(204);
    expect(calls).toHaveLength(1);
    expect(calls[0].query).toBe('SELECT public.track_analytics_events($1::jsonb)');
    // Bound as a parameter, never concatenated into the statement.
    expect(calls[0].params).toEqual([JSON.stringify([{ id: 'a', event_type: 'slide_view' }])]);
  });

  it('refuses any other origin without touching the database', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@host.invalid/neondb';
    const calls = stubNeon();

    const response = await handler.fetch(post({ events: [{ id: 'a' }] }, 'https://example.com'));

    expect(response.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it('answers the CORS preflight so the browser will send at all', async () => {
    const response = await handler.fetch(
      new Request('https://ingest.invalid/', { method: 'OPTIONS', headers: { Origin: ORIGIN } })
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  });

  it('rejects a malformed body and an oversized batch, and never forwards either', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@host.invalid/neondb';
    const calls = stubNeon();

    expect((await handler.fetch(post('not json'))).status).toBe(400);
    expect((await handler.fetch(post({ nope: true }))).status).toBe(400);

    const tooMany = { events: Array.from({ length: 201 }, (_, i) => ({ id: String(i) })) };
    expect((await handler.fetch(post(tooMany))).status).toBe(413);

    expect(calls).toHaveLength(0);
  });

  it('reports a database failure instead of throwing into the browser', async () => {
    // REQ-ANALYTICS-006: measurement is never worth breaking the guide over.
    process.env.DATABASE_URL = 'postgresql://user:pass@host.invalid/neondb';
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500 }));

    const response = await handler.fetch(post({ events: [{ id: 'a' }] }));
    expect(response.status).toBe(503);
  });
});
