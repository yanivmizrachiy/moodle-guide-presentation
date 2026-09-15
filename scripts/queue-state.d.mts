type Task = { id: string; status: string };
export declare function nextTasks<T extends Task>(tasks: T[]): T[];
export declare function isQueueComplete(tasks: Task[]): boolean;
export type QueueClassification<T extends Task = Task> =
  | { state: 'complete' }
  | { state: 'active'; task: T }
  | { state: 'invalid'; reason: string; next: T[] };
export declare function classifyQueue<T extends Task>(tasks: T[]): QueueClassification<T>;
