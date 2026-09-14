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
export const GUIDE_SCREENSHOT_HOTSPOTS: Readonly<Record<string, readonly GuideHotspot[]>> = Object.freeze({
  // Verified against the source image (1200x603): the blue "אישור" button
  // sits bottom-right-to-left at ~58-114px x, ~530-573px y.
  '24-wizard-step4': [
    { id: 'confirm-button', label: 'אישור', x: 2.6, y: 83.5, width: 8.6, height: 13.5 },
  ],
  // 3200x1800: the blue "רשום אותי" button on the current space's enrol page.
  '53-student-enrol': [
    { id: 'enrol-me', label: 'רשום אותי', x: 57.2, y: 47.4, width: 9.6, height: 9.8 },
  ],
  // 958x797: the "אין הגבלה" select beside "מספר נסיונות מותרים".
  '33-quiz-question-behaviour': [
    { id: 'unlimited-attempts', label: 'מספר נסיונות מותרים — אין הגבלה', x: 56.2, y: 11.8, width: 15.8, height: 10.4 },
  ],
  // 3200x1800 home page in edit mode: the "עריכה" toggle, top-left corner.
  '05-home-edit-on': [
    { id: 'edit-toggle', label: 'עריכה', x: 3.4, y: 2.2, width: 6.6, height: 6 },
  ],
  // 3200x1800 student quiz page after submission: the "ניסיון חדש" button.
  '56-quiz-retry': [
    { id: 'new-attempt', label: 'ניסיון חדש', x: 63, y: 33.2, width: 9.4, height: 7.6 },
  ],
  // 3200x1800 activity kebab menu: the availability and delete entries.
  '42-activity-menu': [
    { id: 'availability', label: 'זמינות', x: 5.2, y: 68, width: 13.4, height: 7.6 },
    { id: 'delete', label: 'מחיקה', x: 5.2, y: 80.8, width: 13.4, height: 7.6 },
  ],
});

export function isValidHotspot(hotspot: GuideHotspot) {
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
