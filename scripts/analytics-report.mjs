// Prints how many people used the live guide — today, and the last two weeks.
//
// Read-only: SELECTs only, never a write of any kind.
//
// It reads public.analytics_events directly and joins public.analytics_daily for
// the session count. The raw table is needed because analytics_daily cannot tell a
// reader from a crawler — that split (REQ-ANALYTICS-012) is computed per visitor
// here. analytics_sessions is not used by this report.
//
// The connection string is a password: it is never committed, never printed, and
// never passed on the command line (where it would land in shell history). It is
// read from the environment, or from .env.local — which .gitignore already covers.
//
// Usage:
//   npm run analytics            today + the last 14 days
//   npm run analytics -- --days 30
import fs from 'node:fs';
import path from 'node:path';

const ENV_KEYS = ['ANALYTICS_DATABASE_URL', 'DATABASE_URL', 'NEON_DATABASE_URL'];
const ENV_FILE = '.env.local';

function readConnectionString() {
  for (const key of ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return { value, from: `משתנה הסביבה ${key}` };
  }

  const envPath = path.join(process.cwd(), ENV_FILE);
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const match = /^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/.exec(line);
      if (!match || !ENV_KEYS.includes(match[1])) continue;
      const value = match[2].replace(/^["']|["']$/g, '').trim();
      if (value) return { value, from: `${ENV_FILE} (${match[1]})` };
    }
  }

  return null;
}

function explainMissingCredential() {
  console.error(`
לא נמצאה מחרוזת חיבור למסד הנתונים, ולכן אי אפשר לקרוא את המספרים.

מה לעשות — פעם אחת בלבד:

  1. היכנס ל-https://console.neon.tech ובחר את הפרויקט של המדריך
     (ep-ancient-rice-b163hnr3, אזור eu-central-1).
  2. לחץ על "Connect" והעתק את מחרוזת החיבור. היא נראית כך:
     postgresql://<user>:<password>@<host>/neondb?sslmode=require
  3. צור בתיקיית הפרויקט קובץ בשם ${ENV_FILE} ובתוכו שורה אחת:

     ANALYTICS_DATABASE_URL=postgresql://...

  4. הרץ שוב: npm run analytics

הקובץ ${ENV_FILE} כבר מוגדר ב-.gitignore ולא ייכנס לגיט לעולם.
חשוב: אל תשלח את המחרוזת הזאת בצ'אט או בהודעה — היא סיסמה.
`);
}

/**
 * Neon speaks SQL over plain HTTPS, so this needs no database driver and the repo
 * gains no dependency. The endpoint is the connection string's own host + /sql.
 */
async function runSql(connectionString, query) {
  let host;
  try {
    host = new URL(connectionString).hostname;
  } catch {
    throw new Error('מחרוזת החיבור אינה כתובת תקינה. ודא שהיא מתחילה ב-postgresql://');
  }

  const response = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': connectionString,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'false',
    },
    body: JSON.stringify({ query, params: [] }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    // Postgres returns a JSON error object; show its message only. Never echo the
    // whole body back — the connection string can appear inside one.
    let reason = '';
    try {
      reason = JSON.parse(body).message ?? '';
    } catch {
      reason = body.slice(0, 200);
    }
    const hint = /password authentication|role .* does not exist/i.test(reason)
      ? '\nהמחרוזת שגויה או פגה. העתק אותה מחדש מ-Neon תחת "Connect".'
      : '';
    throw new Error(`המסד החזיר שגיאה ${response.status}: ${reason}${hint}`);
  }

  const payload = await response.json();
  return payload.rows ?? [];
}

const HE_DATE = new Intl.DateTimeFormat('he-IL', {
  timeZone: 'Asia/Jerusalem',
  day: '2-digit',
  month: '2-digit',
});

function minutes(activeMs) {
  const value = Number(activeMs ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '0';
  return String(Math.round(value / 60000));
}

function int(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** A visitor counts as a real reader from this much active time on. */
const READER_MS = 10000;

/** A browser seen within this window counts as "right now". */
const LIVE_MINUTES = 5;

function numericFlag(name, fallback, min, max) {
  const at = process.argv.indexOf(name);
  if (at < 0) return fallback;
  const value = Number(process.argv[at + 1]);
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

const days = numericFlag('--days', 14, 1, 365);
/** `--hours N` answers "how many in the last N hours", for any moment. */
const hours = numericFlag('--hours', 0, 1, 24 * 365);

const credential = readConnectionString();
if (!credential) {
  explainMissingCredential();
  process.exit(1);
}

console.log(`קורא נתונים… (מקור החיבור: ${credential.from})\n`);

/**
 * The count for any moment, not only for a calendar day (REQ-ANALYTICS-013):
 * who is on the guide right now, how many in an arbitrary window, and the totals
 * since measurement began. `now()` is the database clock, so the answer does not
 * depend on the clock of whoever runs the report.
 */
let live;
try {
  const rows = await runSql(
    credential.value,
    `SELECT
       (SELECT count(DISTINCT visitor_id) FROM public.analytics_events
         WHERE received_at > now() - interval '${LIVE_MINUTES} minutes')::int AS now_visitors,
       (SELECT count(DISTINCT visitor_id) FROM public.analytics_events
         WHERE received_at > now() - interval '${hours || 24} hours')::int AS window_visitors,
       (SELECT count(DISTINCT visitor_id) FROM public.analytics_events)::int AS all_visitors,
       (SELECT count(DISTINCT session_id) FROM public.analytics_events)::int AS all_sessions,
       (SELECT min(received_at) FROM public.analytics_events)::text AS first_event,
       -- The database's own idea of today, so a wrong clock on this machine
       -- cannot shift which day the report calls "today" (REQ-ANALYTICS-013).
       (now() AT TIME ZONE 'Asia/Jerusalem')::date::text AS today`
  );
  live = rows[0] ?? null;
} catch (error) {
  console.error(`אזהרה: לא ניתן היה לקרוא את הנתונים החיים (${error.message}).\n`);
  live = null;
}

let rows;
try {
  // `analytics_daily` answers "how many browsers sent anything at all", which
  // counts a crawler that loaded the page and left. For an accurate read of how
  // many people actually USED the guide, split each day's visitors into everyone,
  // and those who opened at least one slide and stayed at least READER_MS.
  // Computed from the canonical events table; no schema change, nothing written.
  rows = await runSql(
    credential.value,
    `WITH per_visitor AS (
       SELECT
         date_trunc('day', received_at AT TIME ZONE 'Asia/Jerusalem')::date AS day,
         visitor_id,
         count(*) FILTER (WHERE event_type = 'slide_view') AS slide_views,
         coalesce(sum(active_ms), 0) AS active_ms
       FROM public.analytics_events
       GROUP BY 1, 2
     ),
     per_day AS (
       SELECT
         day,
         count(*)::int AS visitors,
         count(*) FILTER (WHERE slide_views >= 1 AND active_ms >= ${READER_MS})::int AS readers,
         sum(slide_views)::int AS slide_views,
         sum(active_ms) AS active_ms
       FROM per_visitor
       GROUP BY day
     )
     SELECT
       per_day.day::text AS day,
       per_day.visitors,
       per_day.readers,
       per_day.slide_views,
       per_day.active_ms,
       d.sessions
     FROM per_day
     LEFT JOIN public.analytics_daily d ON d.day = per_day.day
     ORDER BY per_day.day DESC
     LIMIT ${days}`
  );
} catch (error) {
  console.error(`הקריאה נכשלה: ${error.message}`);
  process.exit(1);
}

// The database clock decides which day is "today"; this machine's clock only
// fills in if the live query could not be read at all.
const today =
  live?.today ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());
const todayRow = rows.find((row) => String(row.day).startsWith(today));

if (live) {
  const windowHours = hours || 24;
  const windowLabel = windowHours === 24 ? '24 השעות האחרונות' : `${windowHours} השעות האחרונות`;
  console.log('══════════════════════════════════════════════');
  console.log(`  ברגע זה במדריך:       ${int(live.now_visitors)}   (${LIVE_MINUTES} דקות אחרונות)`);
  console.log(`  ב${windowLabel}:  ${int(live.window_visitors)}`);
  console.log(`  מאז תחילת המדידה:     ${int(live.all_visitors)} דפדפנים · ${int(live.all_sessions)} ביקורים`);
  if (live.first_event) {
    const started = new Date(live.first_event);
    if (!Number.isNaN(started.valueOf())) {
      console.log(
        `  המדידה החלה:          ${new Intl.DateTimeFormat('he-IL', {
          timeZone: 'Asia/Jerusalem',
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(started)}`
      );
    }
  }
  console.log('══════════════════════════════════════════════\n');
}

console.log('══════════════════════════════════════════════');
if (todayRow) {
  console.log(`  היום קראו את המדריך:  ${int(todayRow.readers)}`);
  console.log(`  נכנסו בסך הכל:        ${int(todayRow.visitors)}`);
  console.log(`  ביקורים:              ${int(todayRow.sessions)}`);
  console.log(`  שקפים שנצפו:          ${int(todayRow.slide_views)}`);
  console.log(`  זמן קריאה מצטבר:      ${minutes(todayRow.active_ms)} דקות`);
} else {
  console.log('  היום עדיין לא נרשמה אף כניסה.');
}
console.log('══════════════════════════════════════════════\n');

if (rows.length) {
  console.log(`${days} הימים האחרונים:\n`);
  console.log('  תאריך      קראו    נכנסו   ביקורים   שקפים   דקות');
  console.log('  ' + '─'.repeat(48));
  for (const row of rows) {
    const label = HE_DATE.format(new Date(`${String(row.day).slice(0, 10)}T12:00:00Z`));
    console.log(
      '  ' +
        label.padEnd(11) +
        String(int(row.readers)).padEnd(8) +
        String(int(row.visitors)).padEnd(8) +
        String(int(row.sessions)).padEnd(10) +
        String(int(row.slide_views)).padEnd(8) +
        minutes(row.active_ms)
    );
  }
  const totalReaders = rows.reduce((sum, row) => sum + int(row.readers), 0);
  console.log(`\n  סך הכל בתקופה: ${totalReaders} קוראים (ספירה לפי יום — אותו דפדפן בשני ימים נספר פעמיים).`);
}

console.log(
  '\n„קראו" = פתחו לפחות שקף אחד ושהו לפחות ' +
    `${READER_MS / 1000} שניות. „נכנסו" כולל גם סורקים אוטומטיים\n` +
    'ומי שסגר מיד, ולכן הוא תמיד המספר הגבוה יותר.\n\n' +
    'שניהם סופרים דפדפנים ולא אנשים: אותו מורה מהטלפון ומהמחשב נספר פעמיים.\n' +
    'כדי שהביקורים שלך עצמך לא ייספרו — פתח את האתר פעם אחת עם ‎?analytics=off‎\n' +
    'בסוף הכתובת, בכל מכשיר שלך. לביטול: ‎?analytics=on‎.\n\n' +
    'לכל טווח זמן אחר:  npm run analytics -- --hours 3   ·   --days 30\n'
);
