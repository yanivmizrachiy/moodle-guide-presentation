# Claude Code

1. `SSOT.md` is the sole normative authority for this project.
2. This repository is the presentation plus the supporting services `SSOT.md` approves. **A database is permitted** (owner decision, 2026-09-16) — today Neon, holding the anonymous usage analytics of REQ-ANALYTICS-001..013; its client code, schema reference, reporting script and operational documentation belong here. What stays out: Teacher Hub, LTI, grades, student data, account systems, identifiable user-data systems, any backend that serves the guide itself, and unrelated infrastructure. The site is still built and published only from this repo through GitHub Pages, and the visitor's browser never receives a database client or a database credential.
3. Content/order stay canonical in `src/data/guideDeck.ts`; do not create another deck/content source.
4. Never invent screenshots or hotspots. Missing real evidence stays `needs-capture`. Reuse verified existing evidence before capturing anything new.
5. Never add, delete, or rewrite owner-authored slide/TOC wording without explicit owner instruction.
6. Preserve RTL, stable slide IDs, navigation, canonical assets, and existing working behavior.
7. For large files, locate the relevant slide id, type, function, component, or test first; read only the surrounding code needed for the change.
8. Shared-component changes must regression-check at least one dependent usage outside the immediate target when applicable.
9. Generated outputs and local artifacts are not source: never commit `dist/`, `.vite/`, `coverage/`, Playwright reports, raw captures, logs, temporary files, or generated Claude context/receipt files. Live analytics events remain in Neon; only their code/schema/docs belong in Git.
10. Run `npm run check` before every commit. For meaningful UI changes, run `npm run check:full`.
11. Use `npm run clean` to remove disposable local build/test artifacts. It intentionally does not delete `raw/` captures because they may contain evidence that has not yet been integrated.
12. Do not update visual baselines unless the visual change is deliberate and verified.
13. Keep changes scoped to the requested work; do not perform unrelated refactors.
14. Final report should be concise: changed, verified, commit, and any real blocker.
15. Production deploy safety is invariant: `.github/workflows/pages.yml` must run `npm run check`, install real Chromium for Playwright, run `npm run test:e2e`, and only then upload the GitHub Pages artifact. Never weaken, skip, reorder past the upload, or bypass this gate.
16. Analytics safety is invariant: production collection remains host-gated, must never block the guide, and must use the RPC ingestion path defined by `SSOT.md`; do not grant browser-facing direct table read/write access or add PII without an explicit SSOT change.
17. Presentation viewport safety is invariant, as `SSOT.md` defines it: only the **cover** must fit one viewport with no scrolling (REQ-PRESENTATION-001). A content slide teaches click-after-click with full screenshots and scrolls **inside its own `article`** by design (REQ-PRESENTATION-002) — never clip it shut, and never re-introduce a "every slide fits one screen" rule; the owner retracted it. What must never regress on any slide: the document or body scrolling, sideways scrolling at any width, and text or a control clipped out of reach. Any change to shared presentation layout, typography, screenshots, flows, branches, header/footer height, or slide chrome must run the viewport regression test across all published slides, alongside the existing E2E/visual suite, before merge or deploy.
18. Fullscreen behavior must respect browser security: the guide fills the viewport immediately and may request native Fullscreen only from an eligible real user activation. Keep the visible Fullscreen control as fallback; never add browser-policy bypasses or test-only behavior that changes what real users see.
