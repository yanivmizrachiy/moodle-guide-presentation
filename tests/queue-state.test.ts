import { describe, expect, it } from 'vitest';
import { classifyQueue, isQueueComplete, nextTasks } from '../scripts/queue-state.mjs';

// Regression suite for the lifecycle gate's queue classification. The defect
// it guards: a fully-complete queue was rejected as "0 next tasks", which
// failed verify:advance -> npm run check -> CI on the finished project.
const done = (id: string) => ({ id, status: 'done' });
const next = (id: string) => ({ id, status: 'next' });
const pending = (id: string) => ({ id, status: 'pending' });
const blocked = (id: string) => ({ id, status: 'blocked' });

describe('task queue state classification', () => {
  it('treats a queue where every task is done as complete (valid terminal state)', () => {
    const tasks = [done('P0'), done('P1'), done('P2')];
    expect(isQueueComplete(tasks)).toBe(true);
    expect(classifyQueue(tasks)).toEqual({ state: 'complete' });
  });

  it('treats exactly one next task as the active state', () => {
    const tasks = [done('P0'), next('P1'), pending('P2')];
    expect(isQueueComplete(tasks)).toBe(false);
    expect(nextTasks(tasks)).toHaveLength(1);
    const result = classifyQueue(tasks);
    expect(result.state).toBe('active');
    expect(result.state === 'active' && result.task.id).toBe('P1');
  });

  it('rejects zero next tasks while work is unfinished', () => {
    const tasks = [done('P0'), pending('P1')];
    const result = classifyQueue(tasks);
    expect(result.state).toBe('invalid');
    expect(result.state === 'invalid' && result.reason).toMatch(/not complete/);
  });

  it('rejects more than one next task', () => {
    const tasks = [next('P0'), next('P1')];
    const result = classifyQueue(tasks);
    expect(result.state).toBe('invalid');
    expect(result.state === 'invalid' && result.reason).toMatch(/exactly one next task; found 2/);
  });

  it('a blocked task keeps the queue from being complete', () => {
    const tasks = [done('P0'), blocked('P1')];
    expect(isQueueComplete(tasks)).toBe(false);
    expect(classifyQueue(tasks).state).toBe('invalid');
  });

  it('an empty queue is not complete', () => {
    expect(isQueueComplete([])).toBe(false);
    expect(classifyQueue([]).state).toBe('invalid');
  });
});
