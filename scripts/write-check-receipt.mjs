import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readStatusPaths } from './git-status.mjs';
import { classifyQueue, nextTasks } from './queue-state.mjs';

const root = process.cwd();
const queuePath = path.join(root, 'docs/task-queue.json');
const receiptPath = path.join(root, '.claude/CHECK_RECEIPT.json');

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

const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
const tasks = Array.isArray(queue.tasks) ? queue.tasks : [];
const classification = classifyQueue(tasks);
const complete = classification.state === 'complete';
if (classification.state === 'invalid') {
  console.error(`check-receipt: expected one active task or a fully complete queue; ${classification.reason}.`);
  process.exit(1);
}

const changedPaths = readStatusPaths(root);
const receipt = {
  version: 1,
  task_id: complete ? null : nextTasks(tasks)[0].id,
  queue_complete: complete,
  head: gitText(['rev-parse', 'HEAD']) || 'unknown',
  queue_hash: gitText(['hash-object', 'docs/task-queue.json']) || 'unknown',
  changed_paths: changedPaths,
  fingerprints: Object.fromEntries(changedPaths.map((relative) => [relative, fingerprint(relative)])),
  verified_at: new Date().toISOString()
};

fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
console.log(`Check receipt recorded for ${complete ? 'completed queue' : receipt.task_id} at ${receipt.head.slice(0, 12)}.`);
