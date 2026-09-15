import { getGuideScreenshotHotspots, type GuideHotspot } from './guideHotspots';

/**
 * Resolve the one red focus mark, if any, for a screenshot use.
 *
 * - An explicit hotspotIds list selects its first verified target.
 * - An explicit empty list suppresses focus completely.
 * - With no per-use selection, one and only one verified hotspot is considered
 *   an unambiguous authored focus and may render automatically.
 * - A screenshot that defines several possible hotspots stays clean until the
 *   current step explicitly selects one of them.
 *
 * The result is always capped at one target so competing red circles can never
 * cover a general screenshot.
 */
export function getVisibleGuideHotspots(
  src: string,
  requestedIds?: readonly string[]
): readonly GuideHotspot[] {
  const all = getGuideScreenshotHotspots(src);

  if (requestedIds !== undefined) {
    const requestedId = requestedIds[0];
    if (!requestedId) return [];
    return all.filter((hotspot) => hotspot.id === requestedId).slice(0, 1);
  }

  return all.length === 1 ? all : [];
}
