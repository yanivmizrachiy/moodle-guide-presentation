import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const queuePath = path.join(root, 'docs/task-queue.json');
const ssotPath = path.join(root, 'SSOT.md');
const outPath = path.join(root, '.claude/TASK_CONTEXT.md');

function die(message) {
  console.error(`task-context: ${message}`);
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    die(`cannot read ${path.relative(root, file)}: ${error.message}`);
  }
}

function extractSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => /^#{1,6}\s+/.test(line) && line.replace(/^#{1,6}\s+/, '').trim() === heading);
  if (start < 0) return null;
  const level = (lines[start].match(/^#+/) ?? [''])[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#+)\s+/);
    if (match && match[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trim();
}

function gitLines(args) {
  try {
    const value = execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return value ? value.split(/\r?\n/) : [];
  } catch {
    return [];
  }
}

const queue = readJson(queuePath);
const tasks = Array.isArray(queue.tasks) ? queue.tasks : [];
const nextTasks = tasks.filter((task) => task.status === 'next');
if (nextTasks.length !== 1) die(`expected exactly one task with status "next"; found ${nextTasks.length}`);

const task = nextTasks[0];
for (const key of ['id', 'title', 'goal']) {
  if (typeof task[key] !== 'string' || !task[key].trim()) die(`active task is missing ${key}`);
}

const readFirst = Array.isArray(task.read_first) ? task.read_first : [];
const scope = Array.isArray(task.scope) ? task.scope : [];
const acceptance = Array.isArray(task.acceptance) ? task.acceptance : [];
const checks = Array.isArray(task.checks) ? task.checks : [];
const notes = Array.isArray(task.notes) ? task.notes : [];
const sectionNames = Array.isArray(task.ssot_sections) ? task.ssot_sections : [];

for (const relative of readFirst) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) die(`read_first path does not exist: ${relative}`);
}

const ssot = fs.readFileSync(ssotPath, 'utf8');
const sections = sectionNames.map((heading) => {
  const text = extractSection(ssot, heading);
  if (!text) die(`SSOT section not found: ${heading}`);
  return text;
});

const changed = gitLines(['status', '--short']);
const branch = gitLines(['branch', '--show-current'])[0] ?? 'unknown';
const head = gitLines(['rev-parse', '--short', 'HEAD'])[0] ?? 'unknown';

const bullets = (items) => items.length ? items.map((item) => `- ${item}`).join('\n') : '- none';
const numbered = (items) => items.length ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. none';

const output = `# TASK CONTEXT — generated, do not hand-edit

This file is intentionally minimal. It exists to preserve full implementation quality while avoiding repeated full-repository context loading.

## Active task

**${task.id} — ${task.title}**

${task.goal}

## Quality rule

Do not save tokens by reducing reasoning, verification, or correctness. Save tokens only by avoiding irrelevant files, repeated explanations, and repeated repository-wide audits.

## Read first

${bullets(readFirst)}

Start with these files only. Expand beyond them only when a concrete dependency, failing check, or verified impact requires it.

## Expected write scope

${bullets(scope)}

This is a focus boundary, not permission to ignore a proven dependency. If scope must expand, state the concrete dependency in the final BLOCKED/CHANGED report.

## Acceptance criteria

${numbered(acceptance)}

## Required checks

${bullets(checks)}

## Task-specific notes

${bullets(notes)}

## Relevant SSOT excerpts

${sections.join('\n\n---\n\n')}

## Current repository state

- Branch: ${branch}
- HEAD before work: ${head}
- Existing working-tree changes: ${changed.length ? changed.join(' | ') : 'clean'}

## Execution contract

- Preserve owner-authored wording unless this task explicitly authorizes wording changes.
- Do not perform unrelated cleanup or speculative refactors.
- Prefer canonical shared mechanisms over duplicated local fixes when the task genuinely requires reuse.
- A change is not complete until the required checks pass.
- Report only: CHANGED / VERIFIED / COMMIT / NEXT / BLOCKED. Do not repeat the SSOT or narrate the whole repository.
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, output, 'utf8');
console.log(`Generated ${path.relative(root, outPath)} for ${task.id}.`);
