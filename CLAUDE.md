# Claude Code

1. `SSOT.md` is the sole normative authority. `docs/task-queue.json` is execution state only, never a second source of truth.
2. Before implementation run `npm run context:task` and read `.claude/TASK_CONTEXT.md`. Treat its `REQ-*` lines as exact canonical SSOT excerpts for the active task.
3. Start with the files under `Read first`. Do **not** reread the full SSOT or scan the whole repository unless the task explicitly lists it or a concrete dependency, failing check, or verified conflict requires expansion.
4. Token saving must never reduce reasoning, verification, correctness, implementation quality, or necessary dependency inspection. Save context only by excluding irrelevant files, repeated explanations, and repeated repo-wide audits.
5. `REQ-*` ids are stable requirement anchors. Never delete, rename, silently weaken, or drop coverage for an approved requirement. A newly approved owner requirement must receive a canonical SSOT `REQ-*` id and execution coverage.
6. Content/order stay canonical in `src/data/guideDeck.ts`; do not create another deck/content source.
7. Never invent screenshots or hotspots. Missing real evidence stays `needs-capture`.
8. Never add, delete, or rewrite owner-authored slide/TOC wording without explicit owner instruction. No demo, mock, placeholder, marketing, or self-descriptive copy.
9. Preserve RTL, stable slide IDs, navigation, canonical assets, and existing working behavior. No unrelated cleanup/refactor.
10. Keep this repository presentation-only: no Teacher Hub, LTI, Supabase, backend, grades, or user-data systems.
11. Before commit run the checks named in `.claude/TASK_CONTEXT.md`; `npm run check` is always mandatory. A shared-component change must regression-check at least one dependent usage outside the immediate target when applicable.
12. Final report only: `CHANGED / VERIFIED / COMMIT / NEXT / BLOCKED`. Do not restate the SSOT or narrate the repository.
