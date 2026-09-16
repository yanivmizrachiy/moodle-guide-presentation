import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
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
  if (guide.includes('return `/guide/screenshots/${src}`;')) errors.push('Root-only screenshot URL remains in Guide.tsx.');
  if (!guide.includes('toggleFullscreen')) errors.push('Guide must keep the visible fullscreen fallback control.');
}

const mainPath = path.join(root, 'src/main.tsx');
if (fs.existsSync(mainPath)) {
  const main = fs.readFileSync(mainPath, 'utf8');
  if (!main.includes('installFirstInteractionFullscreen')) {
    errors.push('Guide must request native fullscreen from the first eligible real user interaction.');
  }
  if (!main.includes('document.documentElement.requestFullscreen()')) {
    errors.push('First-interaction fullscreen must use the browser Fullscreen API.');
  }
  if (!main.includes('navigator.webdriver')) {
    errors.push('Automated browser runs must remain excluded from first-interaction fullscreen side effects.');
  }
}

const visualIsolationPath = path.join(root, 'src/guide-visual-isolation.css');
if (fs.existsSync(visualIsolationPath)) {
  const css = fs.readFileSync(visualIsolationPath, 'utf8');
  if (!css.includes('article[data-cover="true"]')) {
    errors.push('Cover viewport-fit rule is missing from guide visual isolation.');
  }
  if (!css.includes('article[data-slide-id]:not([data-cover])')) {
    errors.push('Published content slides must keep the canonical no-scroll desktop/laptop viewport rule.');
  }
  if (!css.includes('overflow: hidden !important;')) {
    errors.push('Presentation article viewport rules must keep scrollbars disabled.');
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
  if (!viewportTest.includes('scrollHeight > metrics.clientHeight + 1')) {
    errors.push('Viewport regression test must detect real hidden vertical overflow, not only visible scrollbars.');
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

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const deps = Object.keys({ ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) });
for (const forbidden of ['@supabase/supabase-js', 'express', 'cookie-parser', 'helmet', 'xlsx']) {
  if (deps.includes(forbidden)) errors.push(`Non-presentation dependency is forbidden: ${forbidden}`);
}

const expectedScripts = {
  'audit:ssot': 'node scripts/ssot-check.mjs',
  clean: 'node scripts/clean-generated.mjs',
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

const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
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
