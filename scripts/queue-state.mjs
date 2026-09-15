// Canonical classification of the task queue's execution state, shared by the
// lifecycle gate scripts so they agree on what "one active task" and "fully
// complete" mean. A fully-complete queue (every task done) is a valid
// terminal state — the gate must accept it, not fail on "0 next tasks".

/** Tasks currently marked `next`. */
export function nextTasks(tasks) {
  return (Array.isArray(tasks) ? tasks : []).filter((task) => task.status === 'next');
}

/** True only when there is at least one task and every task is done. */
export function isQueueComplete(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  return list.length > 0 && list.every((task) => task.status === 'done');
}

/**
 * Classify the queue into exactly one of:
 *  - { state: 'complete' }                 every task done
 *  - { state: 'active', task }             exactly one next task
 *  - { state: 'invalid', reason, next }    anything else (0 next but unfinished,
 *                                          or more than one next)
 */
export function classifyQueue(tasks) {
  const next = nextTasks(tasks);
  if (isQueueComplete(tasks)) return { state: 'complete' };
  if (next.length === 1) return { state: 'active', task: next[0] };
  if (next.length === 0) {
    return { state: 'invalid', reason: 'no next task but the queue is not complete', next };
  }
  return { state: 'invalid', reason: `expected exactly one next task; found ${next.length}`, next };
}
