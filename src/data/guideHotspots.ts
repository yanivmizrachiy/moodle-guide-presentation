export type GuideHotspot = {
  /** Stable id for audits and future editing. */
  id: string;
  /** Short Hebrew description of the real Moodle control. */
  label: string;
  /** Percentage coordinates relative to the original screenshot. */
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Verified screenshot hotspots only.
 *
 * IMPORTANT:
 * - Keep this map empty for a screenshot until the control location has been
 *   checked against the real source image.
 * - Coordinates are percentages (0..100), never pixels, so overlays remain
 *   aligned on desktop, mobile and in the lightbox.
 * - Never infer or invent a hotspot from a caption alone.
 */
export const GUIDE_SCREENSHOT_HOTSPOTS: Readonly<Record<string, readonly GuideHotspot[]>> = Object.freeze({});

function isValidHotspot(hotspot: GuideHotspot) {
  return (
    hotspot.id.trim().length > 0 &&
    hotspot.label.trim().length > 0 &&
    Number.isFinite(hotspot.x) &&
    Number.isFinite(hotspot.y) &&
    Number.isFinite(hotspot.width) &&
    Number.isFinite(hotspot.height) &&
    hotspot.x >= 0 &&
    hotspot.y >= 0 &&
    hotspot.width > 0 &&
    hotspot.height > 0 &&
    hotspot.x + hotspot.width <= 100 &&
    hotspot.y + hotspot.height <= 100
  );
}

export function getGuideScreenshotHotspots(src: string): readonly GuideHotspot[] {
  const key = src.replace(/\.[^.]+$/, '');
  return (GUIDE_SCREENSHOT_HOTSPOTS[key] ?? []).filter(isValidHotspot);
}
