import { describe, expect, it } from 'vitest';
import { parseStatusPaths } from '../scripts/git-status.mjs';

// Regression suite for the canonical porcelain parser used by every lifecycle
// gate script. The historical defect: trimming the raw block stripped the
// leading status space of the FIRST entry, so ` M src/data/guideDeck.ts`
// parsed as the phantom path "rc/data/guideDeck.ts" and the scope gate
// false-failed a fully in-scope change.
describe('git status porcelain parsing (gate scripts)', () => {
  it('parses a worktree-modified FIRST entry without dropping its leading status space', () => {
    expect(parseStatusPaths(' M src/data/guideDeck.ts\n')).toEqual(['src/data/guideDeck.ts']);
    expect(parseStatusPaths(' M SSOT.md\n')).toEqual(['SSOT.md']);
  });

  it('never produces the historical phantom paths', () => {
    const parsed = parseStatusPaths(' M src/data/guideDeck.ts\n M SSOT.md\n');
    expect(parsed).not.toContain('rc/data/guideDeck.ts');
    expect(parsed).not.toContain('SOT.md');
    expect(parsed).toEqual(['SSOT.md', 'src/data/guideDeck.ts']);
  });

  it('parses added, deleted and untracked entries', () => {
    expect(parseStatusPaths('A  public/guide/screenshots/40-x.png\n')).toEqual([
      'public/guide/screenshots/40-x.png',
    ]);
    expect(parseStatusPaths(' D docs/removed.md\n')).toEqual(['docs/removed.md']);
    expect(parseStatusPaths('D  docs/staged-removed.md\n')).toEqual(['docs/staged-removed.md']);
    expect(parseStatusPaths('?? scratch/new-file.txt\n')).toEqual(['scratch/new-file.txt']);
  });

  it('parses multiple mixed entries, first entry included, sorted and de-duplicated', () => {
    const raw = [
      ' M src/data/guideDeck.ts',
      'M  docs/task-queue.json',
      'A  tests/new.test.ts',
      '?? notes.txt',
      ' M src/data/guideDeck.ts',
    ].join('\n');
    expect(parseStatusPaths(raw)).toEqual([
      'docs/task-queue.json',
      'notes.txt',
      'src/data/guideDeck.ts',
      'tests/new.test.ts',
    ]);
  });

  it('parses a rename into both of its sides', () => {
    expect(parseStatusPaths('R  docs/old-name.md -> docs/new-name.md\n')).toEqual([
      'docs/new-name.md',
      'docs/old-name.md',
    ]);
  });

  it('preserves significant whitespace inside paths and unquotes quoted paths', () => {
    expect(parseStatusPaths(' M docs/name with spaces.md\n')).toEqual(['docs/name with spaces.md']);
    expect(parseStatusPaths(' M "docs/quoted name.md"\n')).toEqual(['docs/quoted name.md']);
  });

  it('returns an empty list for empty or whitespace-only output', () => {
    expect(parseStatusPaths('')).toEqual([]);
    expect(parseStatusPaths('\n')).toEqual([]);
  });
});
