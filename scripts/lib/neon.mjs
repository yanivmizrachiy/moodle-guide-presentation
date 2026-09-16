// The one place that talks to Neon over HTTPS.
//
// Neon speaks SQL over plain HTTP, so nothing here needs a database driver and
// the repo gains no dependency. The endpoint is the connection string's own host
// plus /sql. Both the report and the credential check import this, so there is a
// single implementation of the request, the error handling and the rule that a
// connection string never appears in output.
//
// Read-only by contract: callers pass SELECTs. scripts/ssot-check.mjs enforces
// that for the report (REQ-ANALYTICS-013/014).

/** True for anything that looks like a Postgres connection string. */
export function looksLikeConnectionString(value) {
  return typeof value === 'string' && /^postgres(ql)?:\/\//i.test(value.trim());
}

/**
 * Why a connection string is unusable, in Hebrew, or null when it looks fine.
 *
 * This exists because of a real failure: Neon does not hold the password of a
 * role that was created in SQL rather than through its console, so it renders
 * that role's password as asterisks and copies the asterisks too. The result was
 * a saved credential that could never authenticate, and an error message that
 * arrived only after the report had already stored it.
 */
export function describeCredentialProblem(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return 'לא נמצאה מחרוזת חיבור.';
  if (!looksLikeConnectionString(trimmed)) {
    if (/^psql\s/i.test(trimmed)) return 'זו פקודת psql שלמה ולא מחרוזת חיבור. ב-Neon בחר "Connection string".';
    if (/^jdbc:/i.test(trimmed)) return 'זו גרסת Java (jdbc:). בחר ב-Neon את האפשרות שמתחילה ב-postgresql://.';
    if (/^https?:\/\//i.test(trimmed)) return 'זו כתובת אתר רגילה ולא מחרוזת חיבור.';
    return 'המחרוזת אינה מתחילה ב-postgresql://.';
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return 'המחרוזת אינה כתובת תקינה.';
  }

  const role = decodeURIComponent(parsed.username || '');
  const secret = decodeURIComponent(parsed.password || '');

  if (!role) return 'במחרוזת אין שם משתמש.';
  if (!secret) return 'במחרוזת אין סיסמה.';
  if (/^[*•·]+$/.test(secret)) {
    return `הסיסמה הועתקה ככוכביות ולא כערך אמיתי. זה קורה כאשר Neon אינו מחזיק את הסיסמה של התפקיד "${role}".`;
  }
  if (role === 'analytics_ingest') {
    return 'התפקיד הוא analytics_ingest — לתפקיד הזה אין הרשאת קריאה בכלל, והוא קיים רק כדי שהדפדפן של המורים יוכל לכתוב אירוע. בחר ב-Neon את התפקיד neondb_owner.';
  }
  return null;
}

/** Sends one SQL statement to Neon and returns its rows. */
export async function runSql(connectionString, query) {
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
      ? ' המחרוזת שגויה או פגה. העתק אותה מחדש מ-Neon תחת "Connect", עם התפקיד neondb_owner.'
      : '';
    throw new Error(`המסד החזיר שגיאה ${response.status}: ${reason}${hint}`);
  }

  const payload = await response.json();
  return payload.rows ?? [];
}
