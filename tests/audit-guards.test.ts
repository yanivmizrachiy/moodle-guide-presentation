import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const auditScript = join(root, 'scripts/ssot-check.mjs');

/**
 * A guard that cannot fail is worse than no guard: it reports "passed" forever
 * while the thing it names rots. Three such guards were found in this repo in a
 * single week — each watched a file that could never contain what it forbade, so
 * the audit was green on a defect it was written to catch.
 *
 * These tests prove each guard bites. For every one: take the real file, break
 * exactly the thing the guard protects, run the audit against a throwaway copy,
 * and require the guard's own message. Then run it again with the file intact and
 * require the message to be gone — otherwise a guard that fires on everything
 * would pass this test too.
 *
 * The real repo is never touched: SSOT_ROOT points the audit at a temp directory.
 */
function runAuditIn(dir: string): string {
  try {
    return execFileSync(process.execPath, [auditScript], {
      cwd: root,
      env: { ...process.env, SSOT_ROOT: dir },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string };
    return `${failure.stdout ?? ''}${failure.stderr ?? ''}`;
  }
}

const sandboxes: string[] = [];

function auditWithFiles(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'ssot-guard-'));
  sandboxes.push(dir);
  for (const [name, contents] of Object.entries(files)) {
    const target = join(dir, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }
  return runAuditIn(dir);
}

function auditWith(file: string, contents: string): string {
  return auditWithFiles({ [file]: contents });
}

afterAll(() => {
  for (const dir of sandboxes) rmSync(dir, { recursive: true, force: true });
});

/** Each case: the guarded file, how to break it, and the message that must appear. */
const GUARDS: { name: string; file: string; break: (source: string) => string; message: string }[] = [
  {
    name: 'screenshot URLs must come from BASE_URL',
    file: 'src/components/guide/screenshots.tsx',
    break: (source) => source.split('${import.meta.env.BASE_URL}guide/screenshots/').join('/guide/screenshots/'),
    message: 'Screenshot URLs must be built from import.meta.env.BASE_URL',
  },
  {
    name: 'fullscreen must keep the webkit spelling Safari needs',
    file: 'src/lib/fullscreen.ts',
    break: (source) => source.split('webkitRequestFullscreen').join('requestFullscreenX'),
    message: 'Fullscreen must support the webkit spelling',
  },
  {
    name: 'automated runs stay out of first-interaction fullscreen',
    file: 'src/lib/fullscreen.ts',
    break: (source) => source.split('navigator.webdriver').join('false'),
    message: 'Automated browser runs must remain excluded',
  },
  {
    name: 'the guide fills a notched phone screen',
    file: 'index.html',
    // split/join, not replace: the first occurrence is in a comment, so a
    // single replace left the real meta tag intact and the guard rightly
    // stayed quiet — this test caught its own blunt instrument.
    break: (source) => source.split('viewport-fit=cover').join('viewport-fit=auto'),
    message: 'viewport-fit=cover',
  },
  {
    name: 'the web app manifest is what gives iPhone fullscreen',
    file: 'index.html',
    break: (source) => source.split('rel="manifest"').join('rel="prefetch"'),
    message: 'must link the web app manifest',
  },
  {
    name: 'the manifest opens the guide fullscreen',
    file: 'public/manifest.webmanifest',
    break: (source) => source.split('"display": "fullscreen"').join('"display": "browser"'),
    message: 'must declare display "fullscreen"',
  },
  {
    // The report runs with the owner's own connection string, which can write
    // anything. "Read-only" was a promise in a comment until this guard existed.
    name: 'the analytics report must stay read-only',
    file: 'scripts/analytics-report.mjs',
    break: (source) =>
      source
        .split('const liveVisits = await readOrWarn(')
        .join(
          "await runSql(credential.value, 'DELETE FROM public.analytics_events'); const liveVisits = await readOrWarn("
        ),
    message: 'Analytics report must stay read-only',
  },
  {
    // Visit length is only answerable per session. Read from the daily rollup it
    // silently becomes "how long did everyone stay together", which is not the
    // question the owner asked.
    name: 'visit length must come from the per-session view',
    file: 'scripts/analytics-report.mjs',
    break: (source) => source.split('public.analytics_sessions').join('public.analytics_daily'),
    message: 'must read public.analytics_sessions for visit length',
  },
  {
    // Twice this week a mangled escape wrote a raw 0x08 byte into a source file in
    // place of a word boundary, and the regex around it went on looking correct in
    // the diff while matching nothing.
    name: 'a mangled escape cannot land as a literal control character',
    file: 'src/lib/fullscreen.ts',
    break: (source) => String.fromCharCode(8) + source,
    message: 'contains a literal control character',
  },
  {
    // cmd.exe re-reads a batch file byte by byte, so a multi-byte line after
    // `chcp 65001` shifts the read position and chops the commands under it.
    // This is how the owner's only double-click tool was silently broken.
    name: 'a .cmd must stay ASCII or cmd.exe chops the lines under it',
    file: 'כמה-נכנסו.cmd',
    break: (source) => source + 'rem שלום',
    message: 'contains a non-ASCII byte',
  },
];

describe('the SSOT audit guards can actually fail', () => {
  for (const guard of GUARDS) {
    it(guard.name, () => {
      const path = join(root, guard.file);
      expect(existsSync(path), `${guard.file} is missing`).toBe(true);
      const original = readFileSync(path, 'utf8');
      const broken = guard.break(original);

      expect(broken, `breaking ${guard.file} changed nothing — the guard's subject moved`).not.toBe(
        original
      );

      expect(auditWith(guard.file, broken), `guard stayed silent while ${guard.file} was broken`).toContain(
        guard.message
      );
      expect(auditWith(guard.file, original), `guard fires even on the correct ${guard.file}`).not.toContain(
        guard.message
      );
    });
  }

  it('the setup launcher breaks if a second .ps1 joins it at the root', () => {
    // הגדרה-ראשונית.cmd finds the setup script by extension, because a Hebrew
    // filename does not survive being passed as a cmd argument. With two
    // candidates at the root, which one runs becomes a coin toss.
    const message = 'Exactly one .ps1 must sit at the repo root';
    expect(auditWithFiles({ 'setup.ps1': '# one', 'other.ps1': '# two' })).toContain(message);
    expect(auditWithFiles({ 'setup.ps1': '# one' })).not.toContain(message);
  });

  it('the audit reports a missing file instead of crashing on it', () => {
    // An audit that throws on the first absent file tells you nothing about the
    // thirty guards queued behind it.
    const output = auditWith('README.md', '# probe\n');
    expect(output).toContain('SSOT audit failed');
    expect(output).toContain('Missing required project item: SSOT.md');
  });
});
