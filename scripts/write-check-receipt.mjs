import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

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
const next = tasks.filter((task) => task.status === 'next');
const complete = next.length === 0 && tasks.length > 0 && tasks.every((task) => task.status === 'done');
if (!complete && next.length !== 1) {
  console.error(`check-receipt: expected one active task or a fully complete queue; found ${next.length} active tasks.`);
  process.exit(1);
}

const changedPaths = statusPaths();
const receipt = {
  version: 1,
  task_id: complete ? null : next[0].id,
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
