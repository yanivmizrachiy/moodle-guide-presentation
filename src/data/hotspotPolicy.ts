import { getGuideScreenshotHotspots, type GuideHotspot } from './guideHotspots';

/**
 * Resolve the one red focus mark, if any, for a screenshot use.
 *
 * Red focus is always explicit per use: defining a verified hotspot for an
 * image never makes it appear automatically. A screenshot use must request
 * exactly one hotspot id. Missing/empty/unknown selections render no focus.
 *
 * The result is always capped at one target so competing red circles can never
 * cover a general screenshot.
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
