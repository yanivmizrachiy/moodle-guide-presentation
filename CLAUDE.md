# Claude Code

1. `SSOT.md` is the sole normative authority. `docs/task-queue.json` is execution state only, never a second source of truth.
2. At the **start** of a task run `npm run context:task` and read `.claude/TASK_CONTEXT.md`. Treat its `REQ-*` lines as exact canonical SSOT excerpts for the active task.
3. Start with the files under `Read first`. Do **not** reread the full SSOT or scan the whole repository unless the task explicitly lists it or a concrete dependency, failing check, or verified conflict requires expansion.
4. Token saving must never reduce reasoning, verification, correctness, implementation quality, or necessary dependency inspection. Save context only by excluding irrelevant files, repeated explanations, and repeated repo-wide audits.
5. `REQ-*` ids are stable requirement anchors. Never delete, rename, silently weaken, or drop coverage for an approved requirement. A newly approved owner requirement must receive a canonical SSOT `REQ-*` id and execution coverage.
6. Content/order stay canonical in `src/data/guideDeck.ts`; do not create another deck/content source.
7. Never invent screenshots or hotspots. Missing real evidence stays `needs-capture`. Reuse verified existing evidence before capturing anything new.
8. Never add, delete, or rewrite owner-authored slide/TOC wording without explicit owner instruction. A listed `REQ-CONTENT-*` requirement authorizes only the facts/headings/intent it actually contains; do not improvise unrelated explanatory copy. No demo, mock, placeholder, marketing, or self-descriptive copy.
9. Preserve RTL, stable slide IDs, navigation, canonical assets, and existing working behavior. No unrelated cleanup/refactor.
10. Keep this repository presentation-only: no Teacher Hub, LTI, Supabase, backend, grades, or user-data systems.
11. The declared task scope is enforced. If a concrete dependency requires another path, add that path to the active task scope with the reason before changing it; do not silently broaden scope.
12. **Lifecycle is strict:** context first → implement only the active task → run every required check, including `npm run check` → only after all checks pass run `npm run task:advance -- <current-task-id>` → run `npm run audit:ssot` once more to validate the queue transition → commit. Do not run full `npm run check` again after advancing the queue in the same uncommitted worktree, because that would intentionally switch the active-task baseline.
13. A shared-component change must regression-check at least one dependent usage outside the immediate target when applicable.
14. If the queue is fully complete, do not invent follow-up work. New work starts only from a new owner-approved canonical requirement.
15. Final report only: `CHANGED / VERIFIED / COMMIT / NEXT / BLOCKED`. Do not restate the SSOT or narrate the repository.
