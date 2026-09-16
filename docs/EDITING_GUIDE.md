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

Find a slide: search its `id:` in `guideDeck.ts` (e.g. `id: 'edit-mode'`).

## Common edits

- **Change a slide's wording** — edit its `title`/`summary`/`steps`/`flow[].text`/
  `points` in `guideDeck.ts`. Owner-authored text only (SSOT rule 11). A click step
  is phrased with the word „הכפתור" and the exact button name in quotes; a result
  step says what the screen does (it opens / it appears), never „רואים…"
  (REQ-GUIDE-001/009).
- **Add a slide** — add an object to `AUTHORED_GUIDE_SLIDES` (a unique `id` and
  `title`; `eyebrow` is optional; do **not** write `section`), then map it in `SLIDE_TOPICS`
  (`'my-id': 'some-topic'`). Its chapter comes from that topic.
- **Change order** — move the object within `AUTHORED_GUIDE_SLIDES`.
- **Flag a slide as edit-mode dependent** — set `requiresEditMode: true` **and**
  `actionLabel: 'שינוי כותרת'`: the action's name as a noun, never the verb form
  („משנים כותרת") and never a question. The slide then lists itself in the
  edit-mode group, and its row opens it (REQ-CONTENT-004). The label is authored,
  never derived from the title — a flagged slide without one fails `npm run check`.
- **Add a section or topic** — add to `GUIDE_SECTIONS` / `GUIDE_TOPICS`, then
  point slides at it via `SLIDE_TOPICS`.
- **Add a screenshot** — drop the real `NN-name.png|jpg` (device-full res) in
  `public/guide/screenshots/`, run `npm run shots:derive -- NN-name`, reference
  `{ src: 'NN-name.png', caption: '…' }` on a slide, and add a manifest row.
  Naming: `^\d{2,3}-[a-z0-9-]+`. A capture whose clicked control is not legible
  (low resolution, blur, a narrow crop) is weak evidence — re-shoot it at full
  resolution instead of enlarging the old file (SSOT rule 13).
- **Add a hotspot** — first add `{ id, label, x, y, width, height }` (percent) under
  the screenshot's stem in `guideHotspots.ts`. This only defines a verified target;
  it never displays automatically. To show the red focus in a specific screenshot
  use, select exactly one target with `screenshot.hotspotIds: ['id']`. With no
  `hotspotIds` (or with `hotspotIds: []`) the screenshot stays clean. Never show
  two hotspots on one screenshot use; show the screen again in the next step if a
  second target must be taught. Size the ellipse so the target's text/icon stays
  fully readable inside the mark — it surrounds the control, it does not cross it.
  Measure the box on the image itself and check the rendered result before
  publishing; the app draws both the circle and an arrow pointing at it, on the
  WHOLE screen (REQ-GUIDE-008). A close-up is opt-in per use (`zoom: true`) and
  only for a control that stands alone on an empty part of the screen.
- **Teach a screen with three or more options** — put a `choice: { options: [...] }`
  on the slide. Each option carries `label` (its name exactly as the screen writes
  it), `meaning` (one focused sentence on what choosing it gives) and its own
  `screenshot` of the SAME whole screen with `hotspotIds: ['its-own-target']`.
  One mark per option, never one circle around them all, and no two options may
  share a target (REQ-GUIDE-012). Two real routes stay a `branch` (REQ-GUIDE-004).
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

`raw/` is intentionally ignored by Git. Mask any PII (names, school, email,
phone, IDs, grades) with clean pixel edits before a screenshot enters the repo.
Replace, never blur.

## Repository hygiene

```bash
npm run clean
```

This removes disposable build/test artifacts (`dist`, `.vite`, coverage,
Playwright output and generated Claude temp files). It does **not** delete
`raw/` captures.

Tracked generated junk is rejected by `npm run audit:ssot`.

## Checks before commit / push

```bash
npm run check        # typecheck + SSOT audit + unit tests + production build
npm run check:full   # check + browser/a11y/visual Playwright tests
```

Do not update visual baselines unless you made an intentional visual change:

```bash
npx playwright test tests/e2e/visual.spec.ts --update-snapshots   # deliberate only
```

Deploy is automatic from `main` via GitHub Actions.
