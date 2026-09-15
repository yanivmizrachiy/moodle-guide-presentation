import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const disposablePaths = [
  'dist',
  '.vite',
  'coverage',
  '.cache',
  'test-results',
  'playwright-report',
  '.claude/TASK_CONTEXT.md',
  '.claude/TASK_BASELINE.json',
  '.claude/CHECK_RECEIPT.json',
];

const disposableNames = new Set(['.DS_Store', 'Thumbs.db', 'Desktop.ini']);
const disposableSuffixes = ['.log', '.tmp', '.tsbuildinfo', '.bak', '.orig'];
const skipDirs = new Set(['.git', 'node_modules', 'raw']);

let removed = 0;

function remove(relative) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return;
  fs.rmSync(absolute, { recursive: true, force: true });
  removed += 1;
  console.log(`removed ${relative}`);
}

function sweep(directory, relative = '') {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      sweep(path.join(directory, entry.name), rel);
      continue;
    }
    if (disposableNames.has(entry.name) || disposableSuffixes.some((suffix) => entry.name.endsWith(suffix))) {
      remove(rel);
    }
  }
}

for (const target of disposablePaths) remove(target);
sweep(root);

console.log(`Repository cleanup complete: ${removed} disposable path(s) removed. raw/ was preserved.`);
