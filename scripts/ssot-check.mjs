import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// The tree to audit. Normally the repo you are standing in; SSOT_ROOT lets a test
// point the audit at a throwaway directory instead, so a guard can be PROVEN to
// fail against a deliberately broken copy without ever touching the real files.
// Three guards were found this week that could not fail at all — they watched a
// file that never contained the thing they forbade. tests/audit-guards.test.ts
// now catches that class of bug mechanically.
const root = process.env.SSOT_ROOT ? path.resolve(process.env.SSOT_ROOT) : process.cwd();
const errors = [];
const required = [
  'SSOT.md',
  'CLAUDE.md',
  'MIGRATION_MANIFEST.md',
  'docs/EDITING_GUIDE.md',
  'docs/GUIDE_MISSING_CAPTURES.md',
  'docs/GUIDE_SCREENSHOTS_MANIFEST.md',
  'docs/ANALYTICS.md',
  'db/analytics-schema.sql',
  '.github/workflows/pages.yml',
  'scripts/clean-generated.mjs',
  'scripts/derive-screenshots.mjs',
  'scripts/analytics-report.mjs',
  'כמה-נכנסו.cmd',
  'הגדרה-ראשונית.cmd',
  'הגדרת-דוח-כניסות.ps1',
  'src/data/guideDeck.ts',
  'src/data/guideHotspots.ts',
  'src/data/hotspotPolicy.ts',
  'src/lib/analytics.ts',
  'src/main.tsx',
  'src/pages/Guide.tsx',
  'src/index.css',
  'src/guide-visual-isolation.css',
  'tests/e2e/viewport-fit.spec.ts',
  'public/guide/jerusalem-math-logo.png',
  'public/guide/jerusalem-math-logo.webp',
  'public/guide/screenshots',
];

for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing required project item: ${relative}`);
}

const ssotPath = path.join(root, 'SSOT.md');
const ssot = fs.existsSync(ssotPath) ? fs.readFileSync(ssotPath, 'utf8') : '';
const requirementIds = [...ssot.matchAll(/\[(REQ-[A-Z]+-\d{3})\]/g)].map((match) => match[1]);
if (!requirementIds.length) errors.push('SSOT must contain stable REQ-* requirement ids.');
if (new Set(requirementIds).size !== requirementIds.length) {
  const seen = new Set();
  const duplicates = new Set();
  for (const id of requirementIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  errors.push(`SSOT requirement ids must be unique; duplicates: ${[...duplicates].join(', ')}`);
}

const dataDir = path.join(root, 'src/data');
if (fs.existsSync(dataDir)) {
  const decks = fs.readdirSync(dataDir).filter((name) => /^guideDeck.*\.ts$/i.test(name));
  if (decks.length !== 1 || decks[0] !== 'guideDeck.ts') {
    errors.push(`Exactly one guide deck source is allowed; found: ${decks.join(', ') || 'none'}`);
  }
}

for (const duplicate of ['src/content/deck.ts', 'src/data/guideDeckSource.ts']) {
  if (fs.existsSync(path.join(root, duplicate))) errors.push(`Forbidden duplicate content source: ${duplicate}`);
}

const guidePath = path.join(root, 'src/pages/Guide.tsx');
if (fs.existsSync(guidePath)) {
  const guide = fs.readFileSync(guidePath, 'utf8');
  if (!guide.includes('import.meta.env.BASE_URL')) errors.push('Guide asset URLs must use import.meta.env.BASE_URL.');
  if (!guide.includes('toggleFullscreen')) errors.push('Guide must keep the visible fullscreen fallback control.');
}

const screenshotsModulePath = path.join(root, 'src/components/guide/screenshots.tsx');
if (fs.existsSync(screenshotsModulePath)) {
  const shots = fs.readFileSync(screenshotsModulePath, 'utf8');
  if (!shots.includes('${import.meta.env.BASE_URL}guide/screenshots/')) {
    errors.push('Screenshot URLs must be built from import.meta.env.BASE_URL in src/components/guide/screenshots.tsx.');
  }
} else {
  errors.push('Missing required project item: src/components/guide/screenshots.tsx');
}

const mainPath = path.join(root, 'src/main.tsx');
if (fs.existsSync(mainPath)) {
  const main = fs.readFileSync(mainPath, 'utf8');
  if (!main.includes('installFirstInteractionFullscreen')) {
    errors.push('Guide must request native fullscreen from the first eligible real user interaction.');
  }
}

// REQ-PRESENTATION-004 + REQ-STABILITY-003: the Fullscreen API is touched in one
// module only. Two copies once drifted apart — the second fired first and skipped
// the automated-run exclusion the first one promised.
const fullscreenPath = path.join(root, 'src/lib/fullscreen.ts');
if (fs.existsSync(fullscreenPath)) {
  const fullscreen = fs.readFileSync(fullscreenPath, 'utf8');
  if (!fullscreen.includes('requestFullscreen')) {
    errors.push('First-interaction fullscreen must use the browser Fullscreen API.');
  }
  if (!fullscreen.includes('webkitRequestFullscreen')) {
    errors.push('Fullscreen must support the webkit spelling, or Safari and iPad get no fullscreen at all.');
  }
  if (!fullscreen.includes('navigator.webdriver')) {
    errors.push('Automated browser runs must remain excluded from first-interaction fullscreen side effects.');
  }
} else {
  errors.push('Missing required project item: src/lib/fullscreen.ts');
}

// Every source file, not a hand-picked pair. The previous guard scanned two files
// with a pattern that could not match `webkitRequestFullscreen` — the very spelling
// the module exists to provide — so it enforced almost nothing.
function sourceFilesUnder(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...sourceFilesUnder(full));
    else if (/[.]tsx?$/.test(entry.name)) found.push(full);
  }
  return found;
}

const FULLSCREEN_MODULE = path.resolve(root, 'src/lib/fullscreen.ts');
const DIRECT_FULLSCREEN_CALL = /(?:webkit)?(?:request|exit)Fullscreen\s*\(/i;
// Anchored on a document receiver on purpose: a bare name would false-positive on
// the module's own exported fullscreenElement() helper, which is correct usage.
const DIRECT_FULLSCREEN_READ = /(?:document|doc)\s*\.\s*(?:webkit)?[Ff]ullscreen(?:Element|Enabled)/;

const srcDir = path.join(root, 'src');
if (fs.existsSync(srcDir)) {
  for (const file of sourceFilesUnder(srcDir)) {
    if (path.resolve(file) === FULLSCREEN_MODULE) continue;
    const text = fs.readFileSync(file, 'utf8');
    const relative = path.relative(root, file).split(path.sep).join('/');
    if (DIRECT_FULLSCREEN_CALL.test(text)) {
      errors.push(`Fullscreen API must be called only through src/lib/fullscreen.ts; direct call in ${relative}.`);
    }
    if (DIRECT_FULLSCREEN_READ.test(text)) {
      errors.push(`Fullscreen state must be read through src/lib/fullscreen.ts; direct read in ${relative}.`);
    }
  }
}

// REQ-PRESENTATION-004 layer (א) + (ג): the shell fills the screen on every device,
// and on iPhone — where the Fullscreen API reaches nothing but <video> — the only
// real fullscreen is the home-screen install. Deleting any of this silently takes
// fullscreen away from a whole class of devices, so the gate holds it in place.
const indexHtmlPath = path.join(root, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  if (!html.includes('viewport-fit=cover')) {
    errors.push('index.html must keep viewport-fit=cover so the guide fills a notched phone screen.');
  }
  if (!html.includes('rel="manifest"')) {
    errors.push('index.html must link the web app manifest; without it there is no fullscreen on iPhone.');
  }
  if (!html.includes('apple-mobile-web-app-capable')) {
    errors.push('index.html must keep apple-mobile-web-app-capable; it is what makes iOS open the guide without browser chrome.');
  }
  if (!html.includes('apple-mobile-web-app-status-bar-style')) {
    errors.push('index.html must keep apple-mobile-web-app-status-bar-style for the iOS standalone status bar.');
  }
}

const manifestPath = path.join(root, 'public/manifest.webmanifest');
if (fs.existsSync(manifestPath)) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    errors.push('public/manifest.webmanifest is not valid JSON.');
  }
  if (manifest) {
    if (manifest.display !== 'fullscreen') {
      errors.push('Web app manifest must declare display "fullscreen" (REQ-PRESENTATION-004).');
    }
    if (!Array.isArray(manifest.display_override) || !manifest.display_override.includes('standalone')) {
      errors.push('Web app manifest must keep a display_override fallback that includes "standalone".');
    }
    for (const field of ['start_url', 'scope']) {
      if (typeof manifest[field] !== 'string' || !manifest[field].includes('/moodle-guide-presentation/')) {
        errors.push(`Web app manifest ${field} must sit under the GitHub Pages base path.`);
      }
    }
    if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
      errors.push('Web app manifest must list at least one real icon.');
    } else {
      for (const icon of manifest.icons) {
        const iconPath = path.join(root, 'public', String(icon.src ?? ''));
        if (!fs.existsSync(iconPath)) errors.push(`Web app manifest icon is missing on disk: ${icon.src}`);
      }
    }
  }
} else {
  errors.push('Missing required project item: public/manifest.webmanifest');
}

const visualIsolationPath = path.join(root, 'src/guide-visual-isolation.css');
if (fs.existsSync(visualIsolationPath)) {
  const css = fs.readFileSync(visualIsolationPath, 'utf8');
  if (!css.includes('article[data-cover="true"]')) {
    errors.push('Cover viewport-fit rule is missing from guide visual isolation.');
  }
  // REQ-PRESENTATION-001 vs 002: ONLY the cover may be clipped shut. Clipping
  // content slides too put text and controls out of reach on every desktop width.
  if (!css.includes('/* REQ-PRESENTATION-001 cover no-scroll')) {
    errors.push('The cover must keep its single-viewport no-scroll rule (REQ-PRESENTATION-001).');
  }
  if (/article\[data-slide-id\](?![^{]*:not\(\[data-cover\]\))[^{]*\{[^}]*overflow:\s*hidden/.test(css)) {
    errors.push('Content slides must not be clipped shut: they scroll inside the article (REQ-PRESENTATION-002).');
  }
}

const viewportTestPath = path.join(root, 'tests/e2e/viewport-fit.spec.ts');
if (fs.existsSync(viewportTestPath)) {
  const viewportTest = fs.readFileSync(viewportTestPath, 'utf8');
  if (!viewportTest.includes('PUBLISHED_GUIDE_SLIDES')) {
    errors.push('Viewport regression test must derive its coverage from the canonical published deck.');
  }
  if (!viewportTest.includes('filter((item) => !item.cover)')) {
    errors.push('Viewport regression test must inspect every published non-cover slide.');
  }
  if (!viewportTest.includes('1280, height: 640')) {
    errors.push('Viewport regression test must keep the short laptop browser viewport case.');
  }
  // REQ-PRESENTATION-002: a content slide may scroll inside its own article — it
  // teaches click-after-click with full screenshots and is taller than a phone by
  // design. Only the cover is one screen (REQ-PRESENTATION-001). What must never
  // regress is the page scrolling or anything scrolling sideways.
  if (!viewportTest.includes('scrollWidth > metrics.clientWidth + 1')) {
    errors.push('Viewport regression test must detect horizontal overflow on every published slide.');
  }
  if (!viewportTest.includes('documentScrollHeight > metrics.viewportHeight + 1')) {
    errors.push('Viewport regression test must detect the document itself becoming scrollable.');
  }
  // REQ-PRESENTATION-005 and REQ-PRESENTATION-006.
  if (!viewportTest.includes('the cover carries no navigation controls')) {
    errors.push('Viewport regression test must prove the cover offers no navigation controls.');
  }
  if (!viewportTest.includes('width: 375')) {
    errors.push('Viewport regression test must keep the 375px phone case.');
  }
}

const analyticsPath = path.join(root, 'src/lib/analytics.ts');
if (fs.existsSync(analyticsPath)) {
  const analytics = fs.readFileSync(analyticsPath, 'utf8');
  if (!analytics.includes("const PRODUCTION_HOST = 'yanivmizrachiy.github.io';")) {
    errors.push('Analytics must remain explicitly gated to the production GitHub Pages host.');
  }
  if (!analytics.includes('window.location.hostname !== PRODUCTION_HOST')) {
    errors.push('Analytics must refuse to run outside the production host.');
  }
  if (!analytics.includes('/rest/v1/rpc/track_analytics_events')) {
    errors.push('Analytics ingestion must use the canonical RPC endpoint.');
  }
  if (analytics.includes('/rest/v1/analytics_events')) {
    errors.push('Browser analytics must not write directly to the analytics_events table endpoint.');
  }
  for (const eventType of ['session_start', 'heartbeat', 'slide_view', 'session_end']) {
    if (!analytics.includes(`'${eventType}'`)) errors.push(`Missing canonical analytics event type: ${eventType}`);
  }
}

const analyticsSchemaPath = path.join(root, 'db/analytics-schema.sql');
if (fs.existsSync(analyticsSchemaPath)) {
  const schema = fs.readFileSync(analyticsSchemaPath, 'utf8');
  for (const requiredSql of [
    'CREATE OR REPLACE FUNCTION public.track_analytics_events(events jsonb)',
    'CREATE OR REPLACE VIEW public.analytics_sessions AS',
    'CREATE OR REPLACE VIEW public.analytics_daily AS',
    'REVOKE ALL ON TABLE public.analytics_events FROM PUBLIC;',
    'REVOKE ALL ON TABLE public.analytics_events FROM analytics_ingest;',
    'REVOKE ALL ON FUNCTION public.track_analytics_events(jsonb) FROM PUBLIC;',
    'GRANT EXECUTE ON FUNCTION public.track_analytics_events(jsonb) TO analytics_ingest;',
  ]) {
    if (!schema.includes(requiredSql)) errors.push(`Analytics schema invariant missing: ${requiredSql}`);
  }
}

// The report runs with the OWNER's connection string, which can write anything.
// It is documented as read-only (REQ-ANALYTICS-013/014) and nothing enforced that,
// so a future "just add a cleanup query" would have been a one-line accident with
// no way back. The patterns below are SQL-shaped on purpose: a bare word like
// "update" appears in ordinary English comments, "UPDATE x SET" does not.
const reportPath = path.join(root, 'scripts/analytics-report.mjs');
if (fs.existsSync(reportPath)) {
  const report = fs.readFileSync(reportPath, 'utf8');
  const writes = [
    /\binsert\s+into\b/i,
    /\bdelete\s+from\b/i,
    /\bupdate\s+[\w.]+\s+set\b/i,
    /\btruncate\b/i,
    /\b(drop|alter)\s+(table|view|function|index|schema)\b/i,
    /\bcreate\s+(table|view|function|index|schema|or\s+replace)\b/i,
    /\b(grant|revoke)\s+\w+/i,
  ];
  const found = writes.find((pattern) => pattern.test(report));
  if (found) {
    errors.push(
      `Analytics report must stay read-only; it contains a write statement matching ${found}.`
    );
  }
  // The visit-length half of REQ-ANALYTICS-014 is only answerable from the
  // per-session view. Reading it from the daily totals would silently turn
  // "how long did a teacher stay" into "how long did everyone stay together".
  if (!report.includes('public.analytics_sessions')) {
    errors.push('Analytics report must read public.analytics_sessions for visit length (REQ-ANALYTICS-014).');
  }
}

// Twice in one week a shell heredoc collapsed an escape and wrote a literal 0x08
// byte into this very file where `\b` was meant. Both times the regex still looked
// correct in a diff, and the guard it belonged to quietly stopped matching what it
// was written to catch. Text source has no business holding C0 control characters,
// so refuse them outright rather than trusting the next escape to survive.
function textFilesUnder(dir) {
  const found = [];
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...textFilesUnder(full));
    else if (/[.](tsx?|m?js|css|html|json|md|sql|cmd|ps1|yml)$/.test(entry.name)) found.push(full);
  }
  return found;
}

// Expressed as code points rather than as a regex character class: writing this
// check with unicode escapes is exactly how the corruption it looks for gets
// introduced, because every layer between here and the file may eat an escape.
function firstControlCharacter(text) {
  for (const character of text) {
    const code = character.codePointAt(0);
    if (code < 0x20 && code !== 9 && code !== 10 && code !== 13) return code;
  }
  return null;
}
const textFiles = [
  ...['src', 'scripts', 'db', 'docs', 'tests', '.github'].flatMap((dir) =>
    textFilesUnder(path.join(root, dir))
  ),
  ...['SSOT.md', 'CLAUDE.md', 'README.md', 'index.html', 'package.json']
    .map((name) => path.join(root, name))
    .filter((file) => fs.existsSync(file)),
];
for (const file of textFiles) {
  const code = firstControlCharacter(fs.readFileSync(file, 'utf8'));
  if (code === null) continue;
  const relative = path.relative(root, file).split(path.sep).join('/');
  const label = code.toString(16).toUpperCase().padStart(4, '0');
  errors.push(
    `${relative} contains a literal control character (U+${label}); an escape was mangled before it was written.`
  );
}

// REQ-STABILITY-010. cmd.exe re-reads a batch file byte by byte AS IT RUNS, so a
// `chcp 65001` line shifts the read position for every multi-byte line after it:
// the lines below get chopped into fragments and executed as commands. That is
// not theoretical — כמה-נכנסו.cmd, the one file the owner is told to double-click,
// carried a Hebrew `title` line and was silently broken this whole time. It never
// changed directory and never ran the report; the window printed "'run' is not
// recognized" and closed. Hebrew belongs in the program the .cmd launches.
const rootEntries = fs.existsSync(root) ? fs.readdirSync(root) : [];
for (const entry of rootEntries) {
  if (!entry.toLowerCase().endsWith('.cmd')) continue;
  const bytes = fs.readFileSync(path.join(root, entry));
  const offset = bytes.findIndex((byte) => byte > 127);
  if (offset >= 0) {
    errors.push(
      `${entry} contains a non-ASCII byte at offset ${offset}; cmd.exe mis-reads multi-byte lines after chcp and silently chops the commands under them (REQ-STABILITY-010).`
    );
  }
}

// הגדרה-ראשונית.cmd locates the setup script by extension, precisely because a
// Hebrew filename cannot survive being passed as a cmd argument. That indirection
// is only correct while exactly one .ps1 sits at the repo root.
const rootPowerShellScripts = rootEntries.filter((name) => name.toLowerCase().endsWith('.ps1'));
if (rootPowerShellScripts.length !== 1) {
  errors.push(
    `Exactly one .ps1 must sit at the repo root; the setup launcher finds it by extension. Found ${rootPowerShellScripts.length}: ${rootPowerShellScripts.join(', ') || 'none'}.`
  );
}

// Report, never crash: an audit that throws on a missing file tells you nothing
// about the other 30 guards behind it.
const pkgPath = path.join(root, 'package.json');
let pkg = { scripts: {}, dependencies: {}, devDependencies: {} };
if (!fs.existsSync(pkgPath)) errors.push('Missing required project item: package.json');
else {
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    errors.push('package.json is not valid JSON.');
  }
}
const deps = Object.keys({ ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) });
for (const forbidden of ['@supabase/supabase-js', 'express', 'cookie-parser', 'helmet', 'xlsx']) {
  if (deps.includes(forbidden)) errors.push(`Non-presentation dependency is forbidden: ${forbidden}`);
}

const expectedScripts = {
  'audit:ssot': 'node scripts/ssot-check.mjs',
  clean: 'node scripts/clean-generated.mjs',
  analytics: 'node scripts/analytics-report.mjs',
  check: 'npm run typecheck && npm run audit:ssot && npm run test && npm run build',
  'check:full': 'npm run check && npm run test:e2e',
};
for (const [name, expected] of Object.entries(expectedScripts)) {
  if (pkg.scripts?.[name] !== expected) errors.push(`package.json script ${name} must be: ${expected}`);
}

const pagesPath = path.join(root, '.github/workflows/pages.yml');
if (fs.existsSync(pagesPath)) {
  const pages = fs.readFileSync(pagesPath, 'utf8');
  const checkIndex = pages.indexOf('npm run check');
  const browserInstallIndex = pages.indexOf('npx playwright install --with-deps chromium');
  const e2eIndex = pages.indexOf('npm run test:e2e');
  const uploadIndex = pages.indexOf('actions/upload-pages-artifact@');

  if (checkIndex < 0) errors.push('Pages deploy must run npm run check before publishing.');
  if (browserInstallIndex < 0) errors.push('Pages deploy must install Chromium for Playwright before publishing.');
  if (e2eIndex < 0) errors.push('Pages deploy must run npm run test:e2e before publishing.');
  if (uploadIndex < 0) errors.push('Pages deploy must upload a Pages artifact.');
  if (browserInstallIndex >= 0 && e2eIndex >= 0 && browserInstallIndex > e2eIndex) {
    errors.push('Pages deploy must install Chromium before npm run test:e2e.');
  }
  if (checkIndex >= 0 && e2eIndex >= 0 && checkIndex > e2eIndex) {
    errors.push('Pages deploy must run npm run check before npm run test:e2e.');
  }
  if (e2eIndex >= 0 && uploadIndex >= 0 && e2eIndex > uploadIndex) {
    errors.push('Pages artifact must not be uploaded before browser E2E passes.');
  }
}

const gitignorePath = path.join(root, '.gitignore');
if (!fs.existsSync(gitignorePath)) errors.push('Missing required project item: .gitignore');
const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
for (const requiredIgnore of [
  'node_modules/',
  'dist/',
  '.vite/',
  'coverage/',
  '/raw/',
  '/test-results/',
  '/playwright-report/',
  '*.tsbuildinfo',
]) {
  if (!gitignore.includes(requiredIgnore)) errors.push(`.gitignore must contain ${requiredIgnore}`);
}

let tracked = [];
try {
  tracked = execFileSync('git', ['ls-files', '-z'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).split('\0').filter(Boolean);
} catch {
  errors.push('Unable to inspect tracked files with git ls-files.');
}

const forbiddenTracked = [
  /^dist\//,
  /^\.vite\//,
  /^coverage\//,
  /^\.cache\//,
  /^test-results\//,
  /^playwright-report\//,
  /^raw\//,
  /^\.claude\/settings\.local\.json$/,
  /^\.claude\/TASK_CONTEXT\.md$/,
  /^\.claude\/TASK_BASELINE\.json$/,
  /^\.claude\/CHECK_RECEIPT\.json$/,
  /(?:^|\/)\.DS_Store$/,
  /(?:^|\/)Thumbs\.db$/,
  /(?:^|\/)Desktop\.ini$/,
  /\.log$/i,
  /\.tmp$/i,
  /\.tsbuildinfo$/i,
  /\.bak$/i,
  /\.orig$/i,
];

for (const file of tracked) {
  if (forbiddenTracked.some((pattern) => pattern.test(file))) {
    errors.push(`Generated/junk file must not be tracked: ${file}`);
  }
}

const screenshotsDir = path.join(root, 'public/guide/screenshots');
if (fs.existsSync(screenshotsDir)) {
  const names = fs.readdirSync(screenshotsDir);
  const originals = names.filter((name) => /\.(?:jpg|jpeg|png)$/i.test(name));
  if (!originals.length) errors.push('No original real Moodle screenshots were found.');
  for (const original of originals) {
    const base = original.replace(/\.[^.]+$/, '');
    for (const ext of ['avif', 'webp']) {
      if (!names.includes(`${base}.${ext}`)) errors.push(`Missing ${ext.toUpperCase()} derivative for ${original}`);
    }
  }
}

if (errors.length) {
  console.error('\nSSOT audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`SSOT audit passed: ${requirementIds.length} canonical requirements, one canonical deck, protected analytics and presentation boundaries, real assets, clean tracked tree, and standalone presentation boundaries preserved.`);
