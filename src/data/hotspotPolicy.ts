import { getGuideScreenshotHotspots, type GuideHotspot } from './guideHotspots';

/**
 * Red focus marks are opt-in per screenshot use.
 *
 * A screenshot with no explicit hotspot id stays clean. When a caller provides
 * ids, only the first verified id is rendered. This makes a single visual focus
 * the invariant and prevents a general screenshot from accumulating every
 * hotspot that happens to be defined for the underlying image.
 */
export function getVisibleGuideHotspots(
  src: string,
  requestedIds?: readonly string[]
): readonly GuideHotspot[] {
  const requestedId = requestedIds?.[0];
  if (!requestedId) return [];

  return getGuideScreenshotHotspots(src)
    .filter((hotspot) => hotspot.id === requestedId)
    .slice(0, 1);
}
