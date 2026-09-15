import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readStatusPaths } from './git-status.mjs';

const root = process.cwd();
const queuePath = path.join(root, 'docs/task-queue.json');
const ssotPath = path.join(root, 'SSOT.md');
const outPath = path.join(root, '.claude/TASK_CONTEXT.md');
const baselinePath = path.join(root, '.claude/TASK_BASELINE.json');

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

function extractRequirement(markdown, id) {
  const line = markdown.split(/\r?\n/).find((candidate) => candidate.includes(`[${id}]`));
  return line?.trim() ?? null;
}

function gitText(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function gitLines(args) {
  const value = gitText(args);
  return value ? value.split(/\r?\n/) : [];
}

function fingerprint(relative) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return '__MISSING__';
  const stat = fs.lstatSync(absolute);
  if (stat.isDirectory()) return '__DIRECTORY__';
  if (stat.isSymbolicLink()) return `symlink:${fs.readlinkSync(absolute)}`;
  return `sha256:${createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')}`;
}

const queue = readJson(queuePath);
const tasks = Array.isArray(queue.tasks) ? queue.tasks : [];
const nextTasks = tasks.filter((task) => task.status === 'next');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
if (nextTasks.length === 0 && tasks.length && tasks.every((task) => task.status === 'done')) {
  const complete = `# TASK CONTEXT — generated, do not hand-edit\n\n## Queue complete\n\nAll approved execution tasks are marked done. There is no active implementation task.\n\nDo not invent follow-up work. A new owner-approved requirement must first be added to the canonical SSOT with a stable REQ-* id and explicit execution coverage.\n`;
  fs.writeFileSync(outPath, complete, 'utf8');
  if (fs.existsSync(baselinePath)) fs.rmSync(baselinePath);
  console.log('Generated completed task context: no active task remains.');
  process.exit(0);
}
if (nextTasks.length !== 1) die(`expected exactly one task with status "next" unless the queue is fully complete; found ${nextTasks.length}`);

const task = nextTasks[0];
for (const key of ['id', 'title', 'goal']) {
  if (typeof task[key] !== 'string' || !task[key].trim()) die(`active task is missing ${key}`);
}

const readFirst = Array.isArray(task.read_first) ? task.read_first : [];
const scope = Array.isArray(task.scope) ? task.scope : [];
const acceptance = Array.isArray(task.acceptance) ? task.acceptance : [];
const checks = Array.isArray(task.checks) ? task.checks : [];
const notes = Array.isArray(task.notes) ? task.notes : [];
const evidence = Array.isArray(task.evidence) ? task.evidence : [];
const sectionNames = Array.isArray(task.ssot_sections) ? task.ssot_sections : [];
const requirementIds = Array.isArray(task.requirements) ? task.requirements : [];

for (const relative of readFirst) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) die(`read_first path does not exist: ${relative}`);
}

const ssot = fs.readFileSync(ssotPath, 'utf8');
const allRequirementIds = [...ssot.matchAll(/\[(REQ-[A-Z]+-\d{3})\]/g)].map((match) => match[1]);
const requestedRequirementIds = task.audit_all_requirements ? allRequirementIds : requirementIds;
const canonicalRequirements = requestedRequirementIds.map((id) => {
  const text = extractRequirement(ssot, id);
  if (!text) die(`canonical SSOT requirement not found: ${id}`);
  return text;
});

const sections = sectionNames.map((heading) => {
  const text = extractSection(ssot, heading);
  if (!text) die(`SSOT section not found: ${heading}`);
  return text;
});

const changedPaths = readStatusPaths(root);
const branch = gitLines(['branch', '--show-current'])[0] ?? 'unknown';
const head = gitLines(['rev-parse', '--short', 'HEAD'])[0] ?? 'unknown';
const fullHead = gitText(['rev-parse', 'HEAD']) || 'unknown';
const ssotHash = gitText(['hash-object', 'SSOT.md']) || 'unknown';
const queueHash = gitText(['hash-object', 'docs/task-queue.json']) || 'unknown';

let baseline = null;
if (fs.existsSync(baselinePath)) {
  try {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  } catch {
    baseline = null;
  }
}
if (!baseline || baseline.task_id !== task.id || baseline.head !== fullHead || baseline.version !== 2) {
  baseline = {
    version: 2,
    task_id: task.id,
    head: fullHead,
    initial_changed_paths: changedPaths,
    initial_fingerprints: Object.fromEntries(changedPaths.map((relative) => [relative, fingerprint(relative)])),
    created_at: new Date().toISOString()
  };
  fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
}

const bullets = (items) => items.length ? items.map((item) => `- ${item}`).join('\n') : '- none';
const numbered = (items) => items.length ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. none';

const output = `# TASK CONTEXT — generated, do not hand-edit

This file is intentionally minimal. It preserves full implementation quality while avoiding repeated full-repository context loading.

## Active task

**${task.id} — ${task.title}**

${task.goal}

## Quality rule

Do not save tokens by reducing reasoning, verification, correctness, implementation quality, or necessary dependency inspection. Save tokens only by avoiding irrelevant files, repeated explanations, and repeated repository-wide audits.

## Canonical requirements for this task

${bullets(canonicalRequirements)}

These are exact SSOT requirement lines. Do not reread the full SSOT unless it is listed under Read first or a concrete dependency/conflict requires it.

## Evidence map

${bullets(evidence)}

Reuse verified existing evidence before capturing anything new. An evidence note is a navigation aid, never permission to assume a state is proven; verify the referenced asset/manifest entry before relying on it.

## Read first

${bullets(readFirst)}

Start with these files only. Expand beyond them only when a concrete dependency, failing check, or verified impact requires it.

## Expected write scope

${bullets(scope)}

This is a focus boundary. The scope guard compares work against the task-start baseline, including fingerprints of any pre-existing dirty files. If a proven dependency requires another path, add that path to the active task scope with a concrete reason before relying on it.

## Acceptance criteria

${numbered(acceptance)}

## Required checks

${bullets(checks)}

## Task-specific notes

${bullets(notes)}

## Additional relevant SSOT excerpts

${sections.length ? sections.join('\n\n---\n\n') : 'none — use the canonical requirement lines above unless a proven dependency requires more.'}

## Context provenance

- SSOT hash: ${ssotHash}
- Task queue hash: ${queueHash}
- Requirement ids: ${requestedRequirementIds.length ? requestedRequirementIds.join(', ') : 'none'}
- Scope baseline: .claude/TASK_BASELINE.json for task ${baseline.task_id} at HEAD ${baseline.head.slice(0, 12)}

## Current repository state

- Branch: ${branch}
- HEAD before work: ${head}
- Existing working-tree changes at context generation: ${changedPaths.length ? changedPaths.join(' | ') : 'clean'}

## Execution contract

- Preserve owner-authored wording unless this task explicitly authorizes wording changes through its canonical REQ-CONTENT requirements.
- Use only owner-approved facts, headings, and intent. Do not invent explanatory copy to fill gaps.
- Never invent screenshots, hotspots, Moodle states, or missing evidence.
- Do not perform unrelated cleanup or speculative refactors.
- Prefer canonical shared mechanisms over duplicated local fixes when the task genuinely requires reuse.
- Preserve existing working behavior and regression-check shared dependencies that were touched.
- Preserve pre-existing working-tree changes outside scope exactly; the scope guard fingerprints them.
- A change is not complete until the required checks pass.
- Report only: CHANGED / VERIFIED / COMMIT / NEXT / BLOCKED. Do not repeat the SSOT or narrate the whole repository.
`;

fs.writeFileSync(outPath, output, 'utf8');
console.log(`Generated ${path.relative(root, outPath)} for ${task.id} with ${requestedRequirementIds.length} canonical requirements and ${evidence.length} evidence notes.`);
