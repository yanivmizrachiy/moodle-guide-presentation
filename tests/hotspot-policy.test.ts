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
  it('keeps ambiguous multi-target screenshots clean unless one target is selected', () => {
    expect(getVisibleGuideHotspots('45-open-space-choice.avif')).toEqual([]);
    expect(getVisibleGuideHotspots('45-open-space-choice.avif', [])).toEqual([]);
  });

  it('preserves one unambiguous authored focus when a screenshot has exactly one verified target', () => {
    expect(getVisibleGuideHotspots('03-topbar-edit-off.avif').map((spot) => spot.id)).toEqual(['edit-toggle']);
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
