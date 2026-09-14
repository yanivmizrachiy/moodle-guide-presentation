import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  FIRST_GUIDE_SLIDE_ID,
  FIRST_TRAINING_SLIDE_ID,
  GUIDE_SECTIONS,
  GUIDE_SLIDES,
  PUBLISHED_GUIDE_SLIDES,
  QUICK_START_CANDIDATES,
  QUICK_START_SLIDE_IDS,
} from '@/data/guideDeck';
import { GUIDE_SCREENSHOT_HOTSPOTS, isValidHotspot } from '@/data/guideHotspots';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const screenshotFiles = readdirSync(join(root, 'public/guide/screenshots'));
const screenshotStems = new Set(screenshotFiles.map((name) => name.replace(/\.[^.]+$/, '')));
const missingCapturesDoc = readFileSync(join(root, 'docs/GUIDE_MISSING_CAPTURES.md'), 'utf8');

const allIds = GUIDE_SLIDES.map((slide) => slide.id);
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

  it('exactly one cover slide exists and opens the deck', () => {
    const covers = GUIDE_SLIDES.filter((slide) => slide.cover);
    expect(covers.map((slide) => slide.id)).toEqual([FIRST_GUIDE_SLIDE_ID]);
    expect(GUIDE_SLIDES[0]?.id).toBe(FIRST_GUIDE_SLIDE_ID);
  });

  it('the entry slides are published', () => {
    expect(publishedIds).toContain(FIRST_GUIDE_SLIDE_ID);
    expect(publishedIds).toContain(FIRST_TRAINING_SLIDE_ID);
  });

  it('every slide has a non-empty title and summary', () => {
    for (const slide of GUIDE_SLIDES) {
      expect(slide.title.trim(), `empty title on slide "${slide.id}"`).not.toBe('');
      expect(slide.summary.trim(), `empty summary on slide "${slide.id}"`).not.toBe('');
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
      for (const screenshot of slide.screenshots ?? []) {
        const stem = stemOf(screenshot.src);
        expect(screenshotFiles, `missing ${stem}.avif for slide "${slide.id}"`).toContain(`${stem}.avif`);
        expect(screenshotFiles, `missing ${stem}.webp for slide "${slide.id}"`).toContain(`${stem}.webp`);
        const hasOriginal = ['jpg', 'jpeg', 'png'].some((ext) => screenshotFiles.includes(`${stem}.${ext}`));
        expect(hasOriginal, `missing original capture for ${stem} (slide "${slide.id}")`).toBe(true);
      }
    }
  });

  it('screenshot captions are non-empty', () => {
    for (const slide of GUIDE_SLIDES) {
      for (const screenshot of slide.screenshots ?? []) {
        expect(screenshot.caption.trim(), `empty caption on "${screenshot.src}" (slide "${slide.id}")`).not.toBe('');
      }
    }
  });

  it('no orphan screenshot files exist on disk', () => {
    const referencedStems = new Set(
      GUIDE_SLIDES.flatMap((slide) => (slide.screenshots ?? []).map((screenshot) => stemOf(screenshot.src)))
    );
    for (const stem of screenshotStems) {
      expect(referencedStems, `screenshot "${stem}" is not referenced by any slide`).toContain(stem);
    }
  });

  it('screenshot filenames follow the naming convention', () => {
    for (const name of screenshotFiles) {
      expect(name).toMatch(/^\d{2}-[a-z0-9-]+\.(?:avif|webp|jpe?g|png)$/);
    }
  });
});

describe('routes', () => {
  it('quick-start candidates reference real slide ids', () => {
    const known = new Set(allIds);
    for (const id of QUICK_START_CANDIDATES) {
      expect(known, `quick-start candidate "${id}" does not exist in the deck`).toContain(id);
    }
    expect(new Set(QUICK_START_CANDIDATES).size).toBe(QUICK_START_CANDIDATES.length);
  });

  it('the quick-start route is non-empty and only contains published slides', () => {
    expect(QUICK_START_SLIDE_IDS.length).toBeGreaterThan(0);
    for (const id of QUICK_START_SLIDE_IDS) {
      expect(publishedIds).toContain(id);
    }
  });

  it('external links are https and labeled', () => {
    for (const slide of GUIDE_SLIDES) {
      if (!slide.link) continue;
      expect(slide.link.href, `non-https link on slide "${slide.id}"`).toMatch(/^https:\/\//);
      expect(slide.link.label.trim()).not.toBe('');
    }
  });

  it('the vite base matches the GitHub Pages project path', () => {
    const viteConfig = readFileSync(join(root, 'vite.config.ts'), 'utf8');
    expect(viteConfig).toContain("base: '/moodle-guide-presentation/'");
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
