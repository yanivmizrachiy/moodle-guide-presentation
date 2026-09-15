`SSOT.md is the sole normative authority. This file is an operational editing guide only.`

# Editing guide — Moodle guide presentation

Short, practical recipes. Every rule that matters lives in `SSOT.md`; this file
only tells you *where* and *how*. Run `npm run check` before every commit.

## Who owns what (one editable source each)

| Fact | Single source |
| --- | --- |
| Slide text, order, IDs, `status`, `branch`, `flow` | `src/data/guideDeck.ts` (`AUTHORED_GUIDE_SLIDES`) |
| Which chapter/topic a slide is in | `SLIDE_TOPICS` (id → topic) + `GUIDE_TOPICS` (topic → section) in `guideDeck.ts` — **not** the slide; `section` is derived |
| Chapters | `GUIDE_SECTIONS` in `guideDeck.ts` |
| Red focus marks (hotspots) | `src/data/guideHotspots.ts` |
| Real screenshots | `public/guide/screenshots/` (+ manifest below) |
| What each screenshot shows / privacy edits | `docs/GUIDE_SCREENSHOTS_MANIFEST.md` |
| Screens still missing real evidence | `docs/GUIDE_MISSING_CAPTURES.md` |
| Requirements + rules | `SSOT.md` (`REQ-*`) |
| Execution state (which task is next) | `docs/task-queue.json` (state only, not truth) |

Find a slide: search its `id:` in `guideDeck.ts` (e.g. `id: 'edit-mode'`).

## Common edits

- **Change a slide's wording** — edit its `title`/`summary`/`steps`/`flow[].text`/
  `points` in `guideDeck.ts`. Owner-authored text only (SSOT rule 11).
- **Add a slide** — add an object to `AUTHORED_GUIDE_SLIDES` (a unique `id`,
  `eyebrow`, `title`; do **not** write `section`), then map it in `SLIDE_TOPICS`
  (`'my-id': 'some-topic'`). Its chapter comes from that topic.
- **Change order** — move the object within `AUTHORED_GUIDE_SLIDES`.
- **Add a section or topic** — add to `GUIDE_SECTIONS` / `GUIDE_TOPICS`, then
  point slides at it via `SLIDE_TOPICS`.
- **Add a screenshot** — drop the real `NN-name.png|jpg` (device-full res) in
  `public/guide/screenshots/`, run `npm run shots:derive -- NN-name`, reference
  `{ src: 'NN-name.png', caption: '…' }` on a slide, and add a manifest row.
  Naming: `^\d{2}-[a-z0-9-]+`.
- **Add a hotspot** — first add `{ id, label, x, y, width, height }` (percent) under
  the screenshot's stem in `guideHotspots.ts`. If that screenshot has exactly one
  verified hotspot, it is the unambiguous focus. If the screenshot has several
  possible hotspots, the use stays unmarked until it selects exactly one with
  `screenshot.hotspotIds: ['id']`. Use `hotspotIds: []` to suppress even a single
  default focus. Never show two hotspots on one screenshot use; show the screen
  again in the next step if a second target must be taught. Size the ellipse so
  the target's text/icon stays fully readable inside the mark.
- **Mark `needs-capture`** — set `status: 'needs-capture'` + `missingCaptureId:
  'Mxx'` and add a `## Mxx` entry in `GUIDE_MISSING_CAPTURES.md`.
- **Close a missing capture** — add the real masked screenshot + derivatives,
  flip the slide to `status: 'ready'`, remove `missingCaptureId`, and delete the
  `## Mxx` entry from `GUIDE_MISSING_CAPTURES.md`.
- **Mark `needs-fact`** — set `status: 'needs-fact'` when the capability itself is
  unproven (blocks publishing); record the finding, invent nothing.

## Live Moodle capture (you log in; never Claude)

```bash
node scripts/capture/launch.mjs "https://moodlemoe.lms.education.gov.il/my/"   # then log in yourself
node scripts/capture/steps.mjs '[{"dsf":2},{"cdpshot":"raw/NN-name.png"}]'      # drive + full-res shot
```

Mask any PII (names, school, email, phone, IDs, grades) with clean pixel edits
before it enters the repo. Replace, never blur.

## Requirements & tasks (canonical lifecycle)

- **New requirement** — add a `[REQ-AREA-NNN]` line in `SSOT.md` and cover it with
  a task in `docs/task-queue.json` (every REQ must be covered — CI enforces it).
- **New task after the queue is complete** — append one `next` task to
  `docs/task-queue.json`, then follow `CLAUDE.md` rule 13: `npm run context:task`
  → implement → `npm run check` → `npm run task:advance -- <id>` →
  `npm run audit:ssot` → one commit → push.

## Checks before commit / push

```bash
npm run check        # fast per-task gate: typecheck + ssot + scope + tests + build + receipt
npm run check:full   # broad gate: check + browser/a11y/visual (Playwright)
```

Do not update visual baselines unless you made an intentional visual change:

```bash
npx playwright test tests/e2e/visual.spec.ts --update-snapshots   # deliberate only
```

Deploy is automatic from `main` via GitHub Actions.
