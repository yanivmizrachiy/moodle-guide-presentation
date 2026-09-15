# Claude Code

1. `SSOT.md` is the sole normative authority for this project.
2. This repository is presentation-only. Do not add Teacher Hub, LTI, Supabase, backend, grades, user-data systems, or unrelated infrastructure.
3. Content/order stay canonical in `src/data/guideDeck.ts`; do not create another deck/content source.
4. Never invent screenshots or hotspots. Missing real evidence stays `needs-capture`. Reuse verified existing evidence before capturing anything new.
5. Never add, delete, or rewrite owner-authored slide/TOC wording without explicit owner instruction.
6. Preserve RTL, stable slide IDs, navigation, canonical assets, and existing working behavior.
7. For large files, locate the relevant slide id, type, function, component, or test first; read only the surrounding code needed for the change.
8. Shared-component changes must regression-check at least one dependent usage outside the immediate target when applicable.
9. Generated outputs and local artifacts are not source: never commit `dist/`, `.vite/`, `coverage/`, Playwright reports, raw captures, logs, temporary files, or generated Claude context/receipt files.
10. Run `npm run check` before every commit. For meaningful UI changes, run `npm run check:full`.
11. Use `npm run clean` to remove disposable local build/test artifacts. It intentionally does not delete `raw/` captures because they may contain evidence that has not yet been integrated.
12. Do not update visual baselines unless the visual change is deliberate and verified.
13. Keep changes scoped to the requested work; do not perform unrelated refactors.
14. Final report should be concise: changed, verified, commit, and any real blocker.
