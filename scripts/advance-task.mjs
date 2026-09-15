import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readStatusPaths } from './git-status.mjs';
import { classifyQueue } from './queue-state.mjs';

const root = process.cwd();
const queuePath = path.join(root, 'docs/task-queue.json');
const receiptPath = path.join(root, '.claude/CHECK_RECEIPT.json');

function fail(message) {
  console.error(`task-advance: ${message}`);
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

const args = process.argv.slice(2);
const verifyOnly = args.includes('--verify');
const expectedId = args.find((arg) => arg !== '--verify');

if (!fs.existsSync(queuePath)) fail('docs/task-queue.json is missing.');
if (!fs.existsSync(receiptPath)) fail('verified check receipt is missing; run npm run check successfully before advancing.');

const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
const tasks = Array.isArray(queue.tasks) ? queue.tasks : [];
const classification = classifyQueue(tasks);
if (classification.state === 'invalid') fail(classification.reason);

let receipt;
try {
  receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
} catch (error) {
  fail(`cannot read verified check receipt: ${error.message}`);
}
if (receipt.version !== 1) fail('check receipt version is unsupported; rerun npm run check.');

const head = gitText(['rev-parse', 'HEAD']) || 'unknown';
const queueHash = gitText(['hash-object', 'docs/task-queue.json']) || 'unknown';
const currentPaths = readStatusPaths(root);
const receiptPaths = Array.isArray(receipt.changed_paths) ? [...receipt.changed_paths].sort() : [];

// A verified receipt must describe exactly the current committed/working state.
function assertReceiptMatchesTree() {
  if (receipt.head !== head) fail('HEAD changed since the verified check; rerun npm run check.');
  if (receipt.queue_hash !== queueHash) fail('Task queue changed since the verified check; rerun npm run check.');
  if (JSON.stringify(receiptPaths) !== JSON.stringify(currentPaths)) {
    fail('Working-tree changed-path set differs from the verified check; rerun npm run check.');
  }
  for (const relative of currentPaths) {
    const expected = receipt.fingerprints?.[relative];
    const actual = fingerprint(relative);
    if (expected !== actual) fail(`Working-tree content changed after verification: ${relative}. Rerun npm run check.`);
  }
}

// A fully-complete queue is a valid terminal state: there is nothing to
// advance, so verify (and the gate's verify:advance step, and therefore
// npm run check on the finished project) confirm the complete-queue receipt
// matches the tree and pass — instead of failing on "0 next tasks".
if (classification.state === 'complete') {
  if (!receipt.queue_complete) fail('queue is complete but the receipt is for an active task; rerun npm run check.');
  assertReceiptMatchesTree();
  console.log(
    verifyOnly
      ? 'Task advancement verification passed: the task queue is fully complete.'
      : 'Task queue is already fully complete; nothing to advance.'
  );
  process.exit(0);
}

const current = classification.task;
if (expectedId && expectedId !== current.id) {
  fail(`refusing to advance ${current.id}: caller expected ${expectedId}.`);
}
if (receipt.queue_complete) fail('check receipt belongs to an already-complete queue.');
if (receipt.task_id !== current.id) fail(`check receipt belongs to ${receipt.task_id ?? '<none>'}, active task is ${current.id}.`);
assertReceiptMatchesTree();

const currentIndex = tasks.findIndex((task) => task.id === current.id);
const pendingIndex = tasks.findIndex((task, index) => index > currentIndex && task.status === 'pending');
const earlierPendingIndex = tasks.findIndex((task, index) => index <= currentIndex && task.status === 'pending');
const nextIndex = pendingIndex >= 0 ? pendingIndex : earlierPendingIndex;
const remainingBlocked = tasks.filter((task) => task.status === 'blocked');
if (nextIndex < 0 && remainingBlocked.length) {
  fail(`cannot finish queue while blocked tasks remain: ${remainingBlocked.map((task) => task.id).join(', ')}.`);
}

if (verifyOnly) {
  console.log(nextIndex >= 0
    ? `Task advancement verification passed for ${current.id}; next would be ${tasks[nextIndex].id}.`
    : `Task advancement verification passed for ${current.id}; queue would become complete.`);
  process.exit(0);
}

current.status = 'done';
if (nextIndex >= 0) tasks[nextIndex].status = 'next';

fs.writeFileSync(queuePath, `${JSON.stringify(queue, null, 2)}\n`, 'utf8');
fs.rmSync(receiptPath, { force: true });
console.log(nextIndex >= 0
  ? `Advanced ${current.id} -> ${tasks[nextIndex].id} using verified check receipt.`
  : `Completed ${current.id}; all execution tasks are now done using verified check receipt.`);
