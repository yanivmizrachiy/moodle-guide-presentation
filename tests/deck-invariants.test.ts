import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  FIRST_GUIDE_SLIDE_ID,
  FIRST_TRAINING_SLIDE_ID,
  GUIDE_ATTRIBUTION,
  GUIDE_SECTIONS,
  GUIDE_SLIDES,
  GUIDE_TOPICS,
  PUBLISHED_GUIDE_SLIDES,
  SLIDE_TOPICS,
  EDIT_MODE_TOGGLE_COPY,
  isValidBranch,
  isValidBranchPath,
  isEditModeMetadataConsistent,
  normalizeSlide,
  type GuideBranch,
  type GuideBranchPath,
  type GuideSlide,
} from '@/data/guideDeck';
import { GUIDE_SCREENSHOT_HOTSPOTS, isValidHotspot } from '@/data/guideHotspots';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const screenshotFiles = readdirSync(join(root, 'public/guide/screenshots'));
const screenshotStems = new Set(screenshotFiles.map((name) => name.replace(/\.[^.]+$/, '')));
const missingCapturesDoc = readFileSync(join(root, 'docs/GUIDE_MISSING_CAPTURES.md'), 'utf8');

const allIds = GUIDE_SLIDES.map((slide) => slide.id);
// Every screenshot a slide can show: the classic array plus flow-step screens.
const shotsOf = (slide: (typeof GUIDE_SLIDES)[number]) => [
  ...(slide.screenshots ?? []),
  ...(slide.flow ?? []).flatMap((step) => (step.screenshot ? [step.screenshot] : [])),
  ...(slide.branch?.paths ?? []).flatMap((path) => [
    ...(path.screenshots ?? []),
    ...(path.flow ?? []).flatMap((step) => (step.screenshot ? [step.screenshot] : [])),
  ]),
];
const publishedIds = new Set(PUBLISHED_GUIDE_SLIDES.map((slide) => slide.id));
const sectionIds = new Set(GUIDE_SECTIONS.map((section) => section.id));
const stemOf = (src: string) => src.replace(/\.[^.]+$/, '');

describe('slide identity', () => {
  it('slide ids are unique and non-empty', () => {
    expect(allIds.every((id) => id.trim().length > 0)).toBe(true);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('every slide belongs to a declared section', () => {
    for (const slide of GUIDE_SLIDES) {
      expect(sectionIds, `unknown section "${slide.section}" on slide "${slide.id}"`).toContain(slide.section);
    }
  });

  it('every slide files under a topic of its own chapter', () => {
    const topicById = new Map(GUIDE_TOPICS.map((topic) => [topic.id, topic]));
    for (const topic of GUIDE_TOPICS) {
      expect(topic.title.trim()).not.toBe('');
      expect(sectionIds, `topic "${topic.id}" points at unknown section`).toContain(topic.section);
    }
    for (const slide of GUIDE_SLIDES) {
      const topic = slide.topic ? topicById.get(slide.topic) : undefined;
      expect(topic, `slide "${slide.id}" has no topic in SLIDE_TOPICS`).toBeDefined();
      expect(topic?.section, `slide "${slide.id}" topic belongs to another chapter`).toBe(slide.section);
    }
    const knownIds = new Set(GUIDE_SLIDES.map((slide) => slide.id));
    for (const key of Object.keys(SLIDE_TOPICS)) {
      expect(knownIds, `SLIDE_TOPICS has stale slide id "${key}"`).toContain(key);
    }
  });

  it('exactly one cover slide exists and opens the deck', () => {
    const covers = GUIDE_SLIDES.filter((slide) => slide.cover);
    expect(covers.map((slide) => slide.id)).toEqual([FIRST_GUIDE_SLIDE_ID]);
    expect(GUIDE_SLIDES[0]?.id).toBe(FIRST_GUIDE_SLIDE_ID);
  });

  it('the entry slides are published', () => {
    expect(publishedIds).toContain(FIRST_GUIDE_SLIDE_ID);
    expect(publishedIds).toContain(FIRST_TRAINING_SLIDE_ID);
  });

  it('the cover attribution text stays intact', () => {
    expect(GUIDE_ATTRIBUTION.district.trim()).not.toBe('');
    expect(GUIDE_ATTRIBUTION.site.trim()).not.toBe('');
  });

  it('every slide has a non-empty title and no blank text fields', () => {
    for (const slide of GUIDE_SLIDES) {
      expect(slide.title.trim(), `empty title on slide "${slide.id}"`).not.toBe('');
      if (slide.summary !== undefined) {
        expect(slide.summary.trim(), `blank summary on slide "${slide.id}"`).not.toBe('');
      }
    }
  });
});

describe('publication policy (truth rules)', () => {
  it('published slides are ready and carry no unresolved capture requirement', () => {
    for (const slide of PUBLISHED_GUIDE_SLIDES) {
      expect(slide.status).toBe('ready');
      expect(slide.missingCaptureId, `published slide "${slide.id}" still waits for a capture`).toBeUndefined();
    }
  });

  it('needs-capture slides declare a capture id that is documented', () => {
    for (const slide of GUIDE_SLIDES) {
      if (slide.status !== 'needs-capture') continue;
      expect(slide.missingCaptureId, `slide "${slide.id}" is needs-capture without a capture id`).toMatch(/^M\d+$/);
      expect(
        missingCapturesDoc.includes(`## ${slide.missingCaptureId}`),
        `capture id ${slide.missingCaptureId} (slide "${slide.id}") is not documented in GUIDE_MISSING_CAPTURES.md`
      ).toBe(true);
    }
  });
});

describe('screenshots', () => {
  it('published slides reference real files with avif, webp and an original', () => {
    for (const slide of PUBLISHED_GUIDE_SLIDES) {
      for (const screenshot of shotsOf(slide)) {
        const stem = stemOf(screenshot.src);
        expect(screenshotFiles, `missing ${stem}.avif for slide "${slide.id}"`).toContain(`${stem}.avif`);
        expect(screenshotFiles, `missing ${stem}.webp for slide "${slide.id}"`).toContain(`${stem}.webp`);
        const hasOriginal = ['jpg', 'jpeg', 'png'].some((ext) => screenshotFiles.includes(`${stem}.${ext}`));
        expect(hasOriginal, `missing original capture for ${stem} (slide "${slide.id}")`).toBe(true);
      }
    }
  });

  it('every rendered screenshot src (classic and flow) is a modern .avif with real siblings', () => {
    // The renderer serves `src` as the avif <source> and `src.replace(ext,'.webp')`
    // as the <img> fallback. If a raw .jpg/.png src survives normalization, the
    // avif source points at a possibly-deleted original and the card hard-fails.
    // So after normalization every referenced src must be .avif and both the
    // .avif and .webp files must exist on disk.
    for (const slide of PUBLISHED_GUIDE_SLIDES) {
      for (const screenshot of shotsOf(slide)) {
        expect(screenshot.src, `slide "${slide.id}" renders a non-avif src "${screenshot.src}"`).toMatch(/\.avif$/);
        const stem = stemOf(screenshot.src);
        expect(screenshotFiles, `rendered avif "${stem}.avif" missing (slide "${slide.id}")`).toContain(`${stem}.avif`);
        expect(screenshotFiles, `rendered webp "${stem}.webp" missing (slide "${slide.id}")`).toContain(`${stem}.webp`);
      }
    }
  });

  it('screenshot captions and flow texts are non-empty', () => {
    for (const slide of GUIDE_SLIDES) {
      for (const screenshot of shotsOf(slide)) {
        expect(screenshot.caption.trim(), `empty caption on "${screenshot.src}" (slide "${slide.id}")`).not.toBe('');
      }
      for (const step of slide.flow ?? []) {
        expect(step.text.trim(), `empty flow step on slide "${slide.id}"`).not.toBe('');
      }
    }
  });

  it('no orphan screenshot files exist on disk', () => {
    const referencedStems = new Set(
      GUIDE_SLIDES.flatMap((slide) => shotsOf(slide).map((screenshot) => stemOf(screenshot.src)))
    );
    for (const stem of screenshotStems) {
      expect(referencedStems, `screenshot "${stem}" is not referenced by any slide`).toContain(stem);
    }
  });

  it('screenshot filenames follow the naming convention', () => {
    for (const name of screenshotFiles) {
      expect(name).toMatch(/^\d{2,3}-[a-z0-9-]+\.(?:avif|webp|jpe?g|png)$/);
    }
  });
});

describe('links', () => {
  it('external links are https and labeled (slide links and inline flow-step links)', () => {
    const allLinks = GUIDE_SLIDES.flatMap((slide) =>
      [
        ...(slide.link ? [slide.link] : []),
        ...(slide.flow ?? []).flatMap((step) => (step.link ? [step.link] : [])),
        ...(slide.branch?.paths ?? []).flatMap((path) =>
          (path.flow ?? []).flatMap((step) => (step.link ? [step.link] : []))
        ),
      ].map((link) => ({ id: slide.id, link }))
    );
    for (const { id, link } of allLinks) {
      expect(link.href, `non-https link on slide "${id}"`).toMatch(/^https:\/\//);
      expect(link.label.trim(), `empty link label on slide "${id}"`).not.toBe('');
    }
  });

  it('the vite base matches the GitHub Pages project path', () => {
    const viteConfig = readFileSync(join(root, 'vite.config.ts'), 'utf8');
    expect(viteConfig).toContain("base: '/moodle-guide-presentation/'");
  });
});

describe('display quality (SSOT rule 14)', () => {
  it('screenshots never sit on a permanently promoted or stretched layer', () => {
    const isolationCss = readFileSync(join(root, 'src/guide-visual-isolation.css'), 'utf8');
    const guideTsx = readFileSync(join(root, 'src/pages/Guide.tsx'), 'utf8');
    // A standing will-change keeps the card rasterized once and rescaled.
    expect(isolationCss).not.toMatch(/will-change\s*:/);
    // A resting positive translateZ stretches the raster through the perspective.
    // Negative Z (the decorative shadow behind the card) is fine.
    expect(guideTsx).not.toMatch(/translateZ\((?!-)/);
  });
});

describe('hotspots', () => {
  it('hotspots only annotate real screenshots and stay within bounds', () => {
    for (const [stem, hotspots] of Object.entries(GUIDE_SCREENSHOT_HOTSPOTS)) {
      expect(screenshotStems, `hotspots reference unknown screenshot "${stem}"`).toContain(stem);
      const ids = hotspots.map((hotspot) => hotspot.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const hotspot of hotspots) {
        expect(isValidHotspot(hotspot), `invalid hotspot "${hotspot.id}" on "${stem}"`).toBe(true);
      }
    }
  });
});

describe('procedure, branch and edit-mode model (REQ-GUIDE)', () => {
  it('every branch is a genuine two-path split with real, non-empty routes', () => {
    for (const slide of GUIDE_SLIDES) {
      if (!slide.branch) continue;
      expect(isValidBranch(slide.branch), `slide "${slide.id}" has an invalid branch`).toBe(true);
      for (const path of slide.branch.paths) {
        expect(path.label.trim(), `empty branch path label on slide "${slide.id}"`).not.toBe('');
        for (const step of path.flow ?? []) {
          expect(step.text.trim(), `empty branch flow step on slide "${slide.id}"`).not.toBe('');
        }
        for (const step of path.steps ?? []) {
          expect(step.trim(), `empty branch step on slide "${slide.id}"`).not.toBe('');
        }
      }
    }
  });

  it('a slide uses at most one top-level procedure shape (linear flow xor branch)', () => {
    for (const slide of GUIDE_SLIDES) {
      expect(
        !(slide.flow && slide.branch),
        `slide "${slide.id}" declares both a linear flow and a branch`
      ).toBe(true);
    }
  });

  it('edit-mode dependency metadata is consistent for every slide', () => {
    for (const slide of GUIDE_SLIDES) {
      expect(
        isEditModeMetadataConsistent(slide),
        `slide "${slide.id}" has inconsistent edit-mode metadata`
      ).toBe(true);
    }
  });

  it('the branch validator rejects malformed two-path structures', () => {
    const good: GuideBranchPath = { label: 'דרך א', flow: [{ text: 'צעד' }] };
    const other: GuideBranchPath = { label: 'דרך ב', steps: ['צעד'] };
    const emptyLabel: GuideBranchPath = { label: '  ', steps: ['x'] };
    const noRoute: GuideBranchPath = { label: 'דרך ב' };
    expect(isValidBranchPath(good)).toBe(true);
    expect(isValidBranch({ paths: [good, other] })).toBe(true);
    // one path, three paths, an empty label, and a route-less path are all rejected.
    expect(isValidBranch({ paths: [good] } as unknown as GuideBranch)).toBe(false);
    expect(isValidBranch({ paths: [good, other, good] } as unknown as GuideBranch)).toBe(false);
    expect(isValidBranch({ paths: [good, emptyLabel] })).toBe(false);
    expect(isValidBranch({ paths: [good, noRoute] })).toBe(false);
  });

  it('the edit-mode validator rejects inconsistent metadata', () => {
    const base = { id: 'x', section: 'x', eyebrow: 'x', title: 'x' } as GuideSlide;
    expect(isEditModeMetadataConsistent({ ...base, requiresEditMode: true })).toBe(false);
    expect(isEditModeMetadataConsistent({ ...base, requiresEditMode: true, steps: [] })).toBe(false);
    expect(isEditModeMetadataConsistent({ ...base, requiresEditMode: true, flow: [{ text: 't' }] })).toBe(true);
    expect(
      isEditModeMetadataConsistent({
        ...base,
        requiresEditMode: true,
        screenshots: [{ src: 'x.png', caption: 'c' }],
      })
    ).toBe(true);
    expect(isEditModeMetadataConsistent({ ...base, requiresEditMode: false })).toBe(true);
    expect(
      isEditModeMetadataConsistent({ ...base, requiresEditMode: 'yes' as unknown as boolean })
    ).toBe(false);
  });

  it('the edit-mode teaching copy stays exactly as the owner locked it (REQ-CONTENT-004)', () => {
    expect(EDIT_MODE_TOGGLE_COPY.off).toBe('כך מכבים את מצב העריכה');
    expect(EDIT_MODE_TOGGLE_COPY.on).toBe('כך מדליקים את מצב העריכה');
  });

  it('the edit-mode dependent group is backed by published, flagged procedures', () => {
    const groupSlides = GUIDE_SLIDES.filter((slide) => slide.editModeGroup);
    if (groupSlides.length === 0) return;
    const dependent = PUBLISHED_GUIDE_SLIDES.filter((slide) => slide.requiresEditMode);
    expect(dependent.length, 'editModeGroup renders an empty group').toBeGreaterThan(0);
  });

  it('inside the editing chapter, the edit-mode concept precedes every dependent procedure (REQ-CONTENT-006)', () => {
    const order = PUBLISHED_GUIDE_SLIDES.map((slide) => slide.id);
    const conceptIndex = order.indexOf('edit-mode');
    expect(conceptIndex).toBeGreaterThanOrEqual(0);
    for (const slide of PUBLISHED_GUIDE_SLIDES) {
      if (!slide.requiresEditMode || slide.section !== 'editing') continue;
      expect(
        order.indexOf(slide.id),
        `"${slide.id}" is taught before the edit-mode concept`
      ).toBeGreaterThan(conceptIndex);
    }
  });

  it('schema additions cannot convert missing evidence to ready (truth stays strict)', () => {
    const normalized = normalizeSlide({
      id: '__truth_probe__',
      eyebrow: 'x',
      title: 'x',
      status: 'ready',
      missingCaptureId: 'M99',
      branch: {
        paths: [
          { label: 'דרך א', flow: [{ text: 'צעד' }] },
          { label: 'דרך ב', flow: [{ text: 'צעד' }] },
        ],
      },
    });
    expect(normalized.status).toBe('needs-capture');
  });
});

describe('space-opening choice as a vertical flow (REQ-CONTENT-008)', () => {
  const twoPaths = GUIDE_SLIDES.find((slide) => slide.id === 'open-space-two-paths');

  it('open-space-two-paths is a genuine two-path branch', () => {
    expect(twoPaths, 'open-space-two-paths slide is missing').toBeDefined();
    expect(twoPaths!.branch, 'open-space-two-paths has no branch').toBeDefined();
    expect(isValidBranch(twoPaths!.branch!)).toBe(true);
  });

  it("the 'without study group' path is a vertical flow that opens with the two owner steps", () => {
    const path = twoPaths!.branch!.paths.find((candidate) => candidate.label === 'ללא קבוצת לימוד');
    expect(path, "the 'ללא קבוצת לימוד' path is missing").toBeDefined();
    const texts = (path!.flow ?? []).map((step) => step.text);
    expect(texts.slice(0, 2)).toEqual([
      'המרחב מתחיל ללא תלמידים.',
      'אפשר לצרף תלמידים למרחב גם מאוחר יותר.',
    ]);
    // A real vertical flow, not a steps/screenshots list.
    expect(path!.steps ?? [], 'the without-group path still carries a steps[] list').toEqual([]);
    expect(path!.screenshots ?? [], 'the without-group path still carries a top-level screenshot').toEqual([]);
  });

  it("the card continues downward into the real add-students how-to (REQ-CONTENT-009)", () => {
    const path = twoPaths!.branch!.paths.find((candidate) => candidate.label === 'ללא קבוצת לימוד');
    const texts = (path!.flow ?? []).map((step) => step.text);
    // The enrolment continuation the owner asked for, in one source.
    expect(texts).toContain('המורה לוחץ על „העתקת כתובת מרחב הלמידה ללוח”.');
    expect(texts).toContain('המורה שולח לתלמיד את הקישור שהועתק.');
    expect(texts).toContain('התלמיד לוחץ על הכפתור „רשום אותי”.');
    // Backed by the real Moodle captures, moved here (not invented).
    const stems = (path!.flow ?? [])
      .flatMap((step) => (step.screenshot ? [stemOf(step.screenshot.src)] : []));
    expect(stems).toEqual([
      '02-copy-space-link',
      '01-login',
      '53-student-enrol',
      '54-student-enrolled',
      '47-participants-list',
    ]);
  });

  it("the 'with study group' path requests only its own card's focus", () => {
    const path = twoPaths!.branch!.paths.find((candidate) => candidate.label === 'עם קבוצת לימוד');
    const shots = path!.screenshots ?? [];
    expect(shots.length).toBe(1);
    expect(shots[0].hotspotIds).toEqual(['with-group']);
  });
});

describe('add-students guidance has a single source (REQ-CONTENT-009)', () => {
  it('there is no separate self-enrol-auto slide duplicating the card', () => {
    expect(GUIDE_SLIDES.some((slide) => slide.id === 'self-enrol-auto')).toBe(false);
    expect(Object.keys(SLIDE_TOPICS)).not.toContain('self-enrol-auto');
  });

  it('every enrolment teaching step lives in exactly one place across the deck', () => {
    const allStepTexts = GUIDE_SLIDES.flatMap((slide) => [
      ...(slide.flow ?? []).map((step) => step.text),
      ...(slide.branch?.paths ?? []).flatMap((path) => (path.flow ?? []).map((step) => step.text)),
    ]);
    const count = (needle: string) => allStepTexts.filter((text) => text === needle).length;
    // Single source (REQ-CONTENT-009): the add-students how-to is taught once, in
    // the open-space-two-paths card — never re-taught by another slide.
    expect(count('המורה לוחץ על „העתקת כתובת מרחב הלמידה ללוח”.'), 'copy-link step duplicated').toBe(1);
    expect(count('המורה שולח לתלמיד את הקישור שהועתק.'), 'send-link step duplicated').toBe(1);
    expect(count('התלמיד לוחץ על הכפתור „רשום אותי”.'), 'enrol step duplicated').toBe(1);
    expect(count('התלמיד רואה שההרשמה הצליחה ונכנס למרחב.'), 'success step duplicated').toBe(1);
  });
});

describe('no demo in code, UI or identifiers (REQ-STABILITY-008)', () => {
  const collectSources = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) out.push(...collectSources(full));
      else if (/\.(?:ts|tsx|css)$/.test(entry.name)) out.push(full);
    }
    return out;
  };
  const sources = collectSources(join(root, 'src')).map((file) => ({
    file,
    text: readFileSync(file, 'utf8'),
  }));

  it('no app source names a guide field editModeDemo', () => {
    const offenders = sources.filter((source) => source.text.includes('editModeDemo')).map((source) => source.file);
    expect(offenders, `editModeDemo found in: ${offenders.join(', ')}`).toEqual([]);
  });

  it("no UI source renders the 'צילום אמיתי' label", () => {
    const offenders = sources.filter((source) => source.text.includes('צילום אמיתי')).map((source) => source.file);
    expect(offenders, `'צילום אמיתי' found in: ${offenders.join(', ')}`).toEqual([]);
  });
});
