import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readStatusPaths } from './git-status.mjs';

const root = process.cwd();
const queuePath = path.join(root, 'docs/task-queue.json');
const baselinePath = path.join(root, '.claude/TASK_BASELINE.json');

function fail(message) {
  console.error(`task-scope: ${message}`);
  process.exit(1);
}

function gitText(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function fingerprint(relative) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return '__MISSING__';
  const stat = fs.lstatSync(absolute);
  if (stat.isDirectory()) return '__DIRECTORY__';
  if (stat.isSymbolicLink()) return `symlink:${fs.readlinkSync(absolute)}`;
  return `sha256:${createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')}`;
}

if (!fs.existsSync(queuePath)) fail('docs/task-queue.json is missing.');
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
const tasks = Array.isArray(queue.tasks) ? queue.tasks : [];
const next = tasks.filter((task) => task.status === 'next');

if (next.length === 0 && tasks.length && tasks.every((task) => task.status === 'done')) {
  console.log('Task scope audit passed: task queue is fully complete.');
  process.exit(0);
}
if (next.length !== 1) fail(`expected exactly one next task unless the queue is fully complete; found ${next.length}.`);
if (!fs.existsSync(baselinePath)) fail('task baseline is missing; run npm run context:task before implementation.');

const task = next[0];
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const head = gitText(['rev-parse', 'HEAD']) || 'unknown';

if (baseline.version !== 2) fail('task baseline is stale; run npm run context:task before implementation.');
if (baseline.task_id !== task.id) {
  fail(`baseline belongs to ${baseline.task_id}, active task is ${task.id}; run npm run context:task at the start of the active task.`);
}
if (baseline.head !== head) {
  fail('HEAD changed after the task baseline was created. Run checks before committing, then advance the task and regenerate context.');
}

const scope = Array.isArray(task.scope) ? task.scope : [];
if (!scope.length) fail(`active task ${task.id} has no scope.`);
if (scope.some((entry) => /^repository\b/i.test(entry))) {
  console.log(`Task scope audit passed for ${task.id}: repository-wide verified-finding scope.`);
  process.exit(0);
}

const normalize = (value) => value.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
const allowed = scope.map(normalize);
const controlExempt = new Set(['docs/task-queue.json']);
const initialPaths = (baseline.initial_changed_paths ?? []).map(normalize);
const initialSet = new Set(initialPaths);
const initialFingerprints = baseline.initial_fingerprints ?? {};
const currentPaths = readStatusPaths(root).map(normalize);
const currentSet = new Set(currentPaths);

function isAllowed(file) {
  return allowed.some((entry) => file === entry || file.startsWith(`${entry}/`));
}

const violations = [];
for (const file of currentPaths) {
  if (controlExempt.has(file) || isAllowed(file)) continue;
  if (!initialSet.has(file)) {
    violations.push(`${file} (newly touched outside scope)`);
    continue;
  }
  const expected = initialFingerprints[file];
  const actual = fingerprint(file);
  if (expected !== actual) violations.push(`${file} (pre-existing dirty file changed outside scope)`);
}

for (const file of initialPaths) {
  if (controlExempt.has(file) || isAllowed(file)) continue;
  if (!currentSet.has(file)) {
    const expected = initialFingerprints[file];
    const actual = fingerprint(file);
    if (expected !== actual) violations.push(`${file} (pre-existing dirty state was removed or altered outside scope)`);
  }
}

if (violations.length) {
  console.error(`\nTask scope audit failed for ${task.id}:`);
  for (const violation of violations) console.error(`- ${violation}`);
  console.error('\nIf a concrete dependency requires one of these paths, add it to the active task scope with a clear reason before proceeding.');
  process.exit(1);
}

const newlyTouched = currentPaths.filter((file) => !initialSet.has(file) && !controlExempt.has(file));
console.log(`Task scope audit passed for ${task.id}: ${newlyTouched.length} newly touched path(s); pre-existing out-of-scope changes preserved byte-for-byte.`);
