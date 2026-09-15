import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

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

function statusPaths() {
  const output = gitText(['status', '--porcelain=v1', '--untracked-files=all']);
  if (!output) return [];
  const paths = new Set();
  for (const line of output.split(/\r?\n/)) {
    const raw = line.slice(3).trim();
    if (!raw) continue;
    if (raw.includes(' -> ')) {
      const [from, to] = raw.split(' -> ');
      if (from) paths.add(from.replace(/^"|"$/g, ''));
      if (to) paths.add(to.replace(/^"|"$/g, ''));
    } else {
      paths.add(raw.replace(/^"|"$/g, ''));
    }
  }
  return [...paths].sort();
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
const initial = new Set((baseline.initial_changed_paths ?? []).map(normalize));
const controlExempt = new Set(['docs/task-queue.json']);
const current = statusPaths().map(normalize);
const introduced = current.filter((file) => !initial.has(file) && !controlExempt.has(file));

function isAllowed(file) {
  return allowed.some((entry) => file === entry || file.startsWith(`${entry}/`));
}

const outside = introduced.filter((file) => !isAllowed(file));
if (outside.length) {
  console.error(`\nTask scope audit failed for ${task.id}:`);
  for (const file of outside) console.error(`- outside declared scope: ${file}`);
  console.error('\nIf a concrete dependency requires one of these paths, add it to the active task scope with a clear reason before proceeding.');
  process.exit(1);
}

console.log(`Task scope audit passed for ${task.id}: ${introduced.length} newly touched path(s), all within declared scope.`);
