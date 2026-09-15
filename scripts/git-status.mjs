// Canonical `git status --porcelain=v1` path parsing for the lifecycle gate
// scripts (task context, scope guard, check receipt, task advancement).
//
// Every porcelain v1 line is `XY PATH` — a two-character status code, one
// space, then the path. The status code of an entry that is modified only in
// the worktree BEGINS WITH A SPACE (e.g. " M src/x"). Trimming the raw block
// before parsing therefore strips the first entry's leading status character
// and shifts its path by one, producing a phantom path ("src/x" -> "rc/x").
// That exact defect broke the scope gate; this module parses the raw,
// untrimmed output and is the only status parser the gate scripts may use.
import { execFileSync } from 'node:child_process';

function unquote(value) {
  return value.replace(/^"|"$/g, '');
}

/**
 * Parse raw, UNTRIMMED porcelain v1 output into a sorted, de-duplicated list
 * of changed paths. Renames contribute both sides. Significant whitespace in
 * paths is preserved; only the fixed three-character `XY ` prefix is removed.
 */
export function parseStatusPaths(raw) {
  if (!raw) return [];
  const paths = new Set();
  for (const line of raw.split(/\r?\n/)) {
    // A valid entry is at least `XY p` (four characters). Never trim the line:
    // the leading status space of a worktree-only change is significant.
    if (line.length < 4) continue;
    const entry = line.slice(3);
    if (!entry) continue;
    if (entry.includes(' -> ')) {
      const [from, to] = entry.split(' -> ');
      if (from) paths.add(unquote(from));
      if (to) paths.add(unquote(to));
    } else {
      paths.add(unquote(entry));
    }
  }
  return [...paths].sort();
}

/** Read the working tree's changed paths without corrupting the first entry. */
export function readStatusPaths(root) {
  let raw = '';
  try {
    raw = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    raw = '';
  }
  return parseStatusPaths(raw);
}
