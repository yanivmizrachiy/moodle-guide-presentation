import { describe, expect, it } from 'vitest';
import { GUIDE_SLIDES } from '@/data/guideDeck';
import { GUIDE_SCREENSHOT_HOTSPOTS } from '@/data/guideHotspots';
import { getVisibleGuideHotspots } from '@/data/hotspotPolicy';

const stemOf = (src: string) => src.replace(/\.[^.]+$/, '');

const shotsOf = (slide: (typeof GUIDE_SLIDES)[number]) => [
  ...(slide.screenshots ?? []),
  ...(slide.flow ?? []).flatMap((step) => (step.screenshot ? [step.screenshot] : [])),
  ...(slide.branch?.paths ?? []).flatMap((path) => [
    ...(path.screenshots ?? []),
    ...(path.flow ?? []).flatMap((step) => (step.screenshot ? [step.screenshot] : [])),
  ]),
];

describe('red focus policy', () => {
  it('shows no red focus unless the screenshot use explicitly selects one target', () => {
    expect(getVisibleGuideHotspots('45-open-space-choice.avif')).toEqual([]);
    expect(getVisibleGuideHotspots('45-open-space-choice.avif', [])).toEqual([]);
    expect(getVisibleGuideHotspots('10-course-page.avif')).toEqual([]);
  });

  it('renders one requested verified focus and never multiple competing focuses', () => {
    expect(getVisibleGuideHotspots('45-open-space-choice.avif', ['with-group']).map((spot) => spot.id)).toEqual([
      'with-group',
    ]);
    expect(
      getVisibleGuideHotspots('45-open-space-choice.avif', ['with-group', 'without-group']).map((spot) => spot.id)
    ).toEqual(['with-group']);
  });

  it('silently renders no focus for an unknown requested id', () => {
    expect(getVisibleGuideHotspots('45-open-space-choice.avif', ['not-real'])).toEqual([]);
  });

  it('every authored screenshot use requests at most one real hotspot', () => {
    for (const slide of GUIDE_SLIDES) {
      for (const screenshot of shotsOf(slide)) {
        const ids = screenshot.hotspotIds;
        if (ids === undefined || ids.length === 0) continue;

        expect(ids.length, `slide "${slide.id}" requests multiple hotspots on "${screenshot.src}"`).toBe(1);
        const stem = stemOf(screenshot.src);
        const knownIds = new Set((GUIDE_SCREENSHOT_HOTSPOTS[stem] ?? []).map((hotspot) => hotspot.id));
        expect(
          knownIds,
          `slide "${slide.id}" requests unknown hotspot "${ids[0]}" on "${stem}"`
        ).toContain(ids[0]);
      }
    }
  });
});
