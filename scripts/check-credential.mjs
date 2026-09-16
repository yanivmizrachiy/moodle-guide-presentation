// Answers one question: can this connection string actually read the analytics?
//
// It exists because the setup used to save first and discover the answer later.
// A credential that cannot authenticate, or that authenticates as a role with no
// read access, was written to .env.local and only failed when the report ran —
// leaving a broken file behind and no obvious way back.
//
// The string arrives in ANALYTICS_DATABASE_URL, never as a command-line argument
// (where it would land in shell history). Nothing here prints it, and both checks
// below have to pass before the caller is allowed to store it:
//   1. it authenticates at all;
//   2. the role it authenticates as can read public.analytics_sessions, which is
//      what the report needs. analytics_ingest authenticates but reads nothing.
//
// Exit code 0 means safe to save. Anything else means do not save.
import { describeCredentialProblem, runSql } from './lib/neon.mjs';

const connectionString = (process.env.ANALYTICS_DATABASE_URL ?? '').trim();

const problem = describeCredentialProblem(connectionString);
if (problem) {
  console.error(`המחרוזת אינה תקינה: ${problem}`);
  process.exit(2);
}

try {
  const rows = await runSql(
    connectionString,
    `SELECT current_user AS role,
            (SELECT count(*) FROM public.analytics_sessions)::int AS visits,
            (SELECT count(*) FROM public.analytics_events)::int AS events`
  );
  const result = rows[0] ?? {};
  console.log(`החיבור עובד. מחובר כ-${result.role}.`);
  console.log(`נראים ${Number(result.events ?? 0)} אירועים ב-${Number(result.visits ?? 0)} ביקורים.`);
  process.exit(0);
} catch (error) {
  console.error(`החיבור נכשל: ${error.message}`);
  // Authentication succeeded but the role cannot see the data — the exact shape
  // of the analytics_ingest mistake, worth naming rather than leaving as "denied".
  if (/permission denied|does not exist/i.test(error.message)) {
    console.error('התפקיד התחבר אך אינו רשאי לקרוא את נתוני האנליטיקה. יש לבחור ב-Neon את התפקיד neondb_owner.');
  }
  process.exit(1);
}
