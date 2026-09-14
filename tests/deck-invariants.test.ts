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
      expect(name).toMatch(/^\d{2}-[a-z0-9-]+\.(?:avif|webp|jpe?g|png)$/);
    }
  });
});

describe('links', () => {
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
