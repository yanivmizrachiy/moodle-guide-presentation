import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const queuePath = path.join(root, 'docs/task-queue.json');

function fail(message) {
  console.error(`task-advance: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(queuePath)) fail('docs/task-queue.json is missing.');
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
const tasks = Array.isArray(queue.tasks) ? queue.tasks : [];
const nextTasks = tasks.filter((task) => task.status === 'next');
if (nextTasks.length !== 1) fail(`expected exactly one next task; found ${nextTasks.length}.`);

const current = nextTasks[0];
const expectedId = process.argv[2];
if (expectedId && expectedId !== current.id) {
  fail(`refusing to advance ${current.id}: caller expected ${expectedId}.`);
}

const currentIndex = tasks.findIndex((task) => task.id === current.id);
const pendingIndex = tasks.findIndex((task, index) => index > currentIndex && task.status === 'pending');
const earlierPendingIndex = tasks.findIndex((task, index) => index <= currentIndex && task.status === 'pending');
const nextIndex = pendingIndex >= 0 ? pendingIndex : earlierPendingIndex;

current.status = 'done';
if (nextIndex >= 0) tasks[nextIndex].status = 'next';

const remainingBlocked = tasks.filter((task) => task.status === 'blocked');
if (nextIndex < 0 && remainingBlocked.length) {
  current.status = 'next';
  fail(`cannot finish queue while blocked tasks remain: ${remainingBlocked.map((task) => task.id).join(', ')}.`);
}

fs.writeFileSync(queuePath, `${JSON.stringify(queue, null, 2)}\n`, 'utf8');
console.log(nextIndex >= 0
  ? `Advanced ${current.id} -> ${tasks[nextIndex].id}.`
  : `Completed ${current.id}; all execution tasks are now done.`);
