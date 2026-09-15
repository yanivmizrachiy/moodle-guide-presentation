# Claude Code

1. `SSOT.md` is the sole normative authority. `docs/task-queue.json` is execution state only, never a second source of truth.
2. Before implementation run `npm run context:task` and read `.claude/TASK_CONTEXT.md`. Start with its `Read first` files; expand only for a concrete dependency, failing check, or verified impact.
3. Token saving must never reduce reasoning, verification, correctness, or implementation quality. Save context only by excluding irrelevant files, repeated explanations, and repeated repo-wide audits.
4. Content/order stay canonical in `src/data/guideDeck.ts`; do not create another deck/content source.
5. Never invent screenshots or hotspots. Missing real evidence stays `needs-capture`.
6. Never add, delete, or rewrite owner-authored slide/TOC wording without explicit owner instruction. No demo, mock, placeholder, marketing, or self-descriptive copy.
7. Preserve RTL, stable slide IDs, navigation, canonical assets, and existing working behavior. No unrelated cleanup/refactor.
8. Keep this repository presentation-only: no Teacher Hub, LTI, Supabase, backend, grades, or user-data systems.
9. Before commit run the checks named in `.claude/TASK_CONTEXT.md`; `npm run check` is always mandatory.
10. Final report only: `CHANGED / VERIFIED / COMMIT / NEXT / BLOCKED`. Do not restate the SSOT or narrate the repository.
