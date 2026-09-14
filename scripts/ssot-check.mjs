import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const required = [
  'SSOT.md',
  'CLAUDE.md',
  'MIGRATION_MANIFEST.md',
  'src/data/guideDeck.ts',
  'src/data/guideHotspots.ts',
  'src/pages/Guide.tsx',
  'src/index.css',
  'src/guide-visual-isolation.css',
  'public/guide/jerusalem-math-logo.png',
  'public/guide/jerusalem-math-logo.webp',
  'public/guide/screenshots'
];

for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing required SSOT item: ${relative}`);
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

const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
for (const requiredIgnore of ['node_modules/', 'dist/']) {
  if (!gitignore.includes(requiredIgnore)) errors.push(`.gitignore must contain ${requiredIgnore}`);
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

console.log('SSOT audit passed: one canonical deck, real assets present, and standalone boundaries preserved.');
