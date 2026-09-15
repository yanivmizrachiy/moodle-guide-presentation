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
  'scripts/clean-generated.mjs',
  'scripts/derive-screenshots.mjs',
  'src/data/guideDeck.ts',
  'src/data/guideHotspots.ts',
  'src/data/hotspotPolicy.ts',
  'src/pages/Guide.tsx',
  'src/index.css',
  'src/guide-visual-isolation.css',
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
  '.claude/TASK_CONTEXT.md',
  '.claude/TASK_BASELINE.json',
  '.claude/CHECK_RECEIPT.json',
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
  /^\.claude\/(?:TASK_CONTEXT\.md|TASK_BASELINE\.json|CHECK_RECEIPT\.json)$/,
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

console.log(`SSOT audit passed: ${requirementIds.length} canonical requirements, one canonical deck, real assets, clean tracked tree, and standalone presentation boundaries preserved.`);
