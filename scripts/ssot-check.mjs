import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const required = [
  'SSOT.md',
  'CLAUDE.md',
  'MIGRATION_MANIFEST.md',
  'docs/task-queue.json',
  'scripts/build-task-context.mjs',
  'scripts/task-scope-check.mjs',
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

const ssotPath = path.join(root, 'SSOT.md');
const ssot = fs.existsSync(ssotPath) ? fs.readFileSync(ssotPath, 'utf8') : '';
const requirementIds = [...ssot.matchAll(/\[(REQ-[A-Z]+-\d{3})\]/g)].map((match) => match[1]);
const requirementSet = new Set(requirementIds);
if (requirementSet.size !== requirementIds.length) {
  const seen = new Set();
  const duplicates = new Set();
  for (const id of requirementIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  errors.push(`SSOT requirement ids must be unique; duplicates: ${[...duplicates].join(', ')}`);
}
if (!requirementIds.length) errors.push('SSOT must contain stable REQ-* requirement ids.');

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
if (pkg.scripts?.['context:task'] !== 'node scripts/build-task-context.mjs') {
  errors.push('package.json must expose context:task through scripts/build-task-context.mjs.');
}
if (pkg.scripts?.['audit:scope'] !== 'node scripts/task-scope-check.mjs') {
  errors.push('package.json must expose audit:scope through scripts/task-scope-check.mjs.');
}
const checkScript = String(pkg.scripts?.check ?? '');
if (!checkScript.includes('npm run context:task')) errors.push('npm run check must validate/generate the active minimal task context.');
if (!checkScript.includes('npm run audit:scope')) errors.push('npm run check must enforce the active task scope.');

const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
for (const requiredIgnore of ['node_modules/', 'dist/', '.claude/TASK_CONTEXT.md', '.claude/TASK_BASELINE.json']) {
  if (!gitignore.includes(requiredIgnore)) errors.push(`.gitignore must contain ${requiredIgnore}`);
}

const queuePath = path.join(root, 'docs/task-queue.json');
if (fs.existsSync(queuePath)) {
  try {
    const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    const tasks = Array.isArray(queue.tasks) ? queue.tasks : [];
    const ids = tasks.map((task) => task.id);
    if (!tasks.length) errors.push('Task queue must contain tasks.');
    if (new Set(ids).size !== ids.length) errors.push('Task queue task ids must be unique.');
    const allowedStatuses = new Set(['next', 'pending', 'done', 'blocked']);
    const coveredRequirements = new Set();

    for (const task of tasks) {
      if (!task.id || !task.title || !task.goal) errors.push(`Task ${task.id ?? '<missing-id>'} is missing id/title/goal.`);
      if (!allowedStatuses.has(task.status)) errors.push(`Task ${task.id ?? '<missing-id>'} has invalid status ${task.status}.`);
      if (!Array.isArray(task.requirements)) errors.push(`Task ${task.id ?? '<missing-id>'} must define a requirements array.`);
      if (!Array.isArray(task.scope) || !task.scope.length) errors.push(`Task ${task.id ?? '<missing-id>'} must define a non-empty scope.`);
      if (!Array.isArray(task.evidence)) errors.push(`Task ${task.id ?? '<missing-id>'} must define an evidence array.`);
      for (const requirement of task.requirements ?? []) {
        if (!requirementSet.has(requirement)) errors.push(`Task ${task.id} references unknown SSOT requirement ${requirement}.`);
        coveredRequirements.add(requirement);
      }
    }

    for (const requirement of requirementIds) {
      if (!coveredRequirements.has(requirement)) errors.push(`Canonical SSOT requirement has no execution coverage: ${requirement}.`);
    }

    const next = tasks.filter((task) => task.status === 'next');
    if (next.length !== 1) {
      errors.push(`Task queue must contain exactly one next task; found ${next.length}.`);
    } else {
      const active = next[0];
      if (!Array.isArray(active.read_first) || !active.read_first.length) errors.push(`Active task ${active.id} needs read_first paths.`);
      if (!Array.isArray(active.acceptance) || !active.acceptance.length) errors.push(`Active task ${active.id} needs acceptance criteria.`);
      if (!Array.isArray(active.checks) || !active.checks.includes('npm run check')) errors.push(`Active task ${active.id} must require npm run check.`);
      if (!(active.requirements?.length || active.audit_all_requirements)) errors.push(`Active task ${active.id} needs canonical requirement ids or audit_all_requirements.`);
      for (const relative of active.read_first ?? []) {
        if (!fs.existsSync(path.join(root, relative))) errors.push(`Active task read_first path does not exist: ${relative}`);
      }
    }
  } catch (error) {
    errors.push(`Invalid docs/task-queue.json: ${error.message}`);
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

console.log(`SSOT audit passed: ${requirementIds.length} canonical requirements covered, one canonical deck, real assets, requirement-scoped context, task scope guard, and standalone boundaries preserved.`);
