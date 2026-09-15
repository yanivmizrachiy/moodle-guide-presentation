import { expect, test } from '@playwright/test';

// REQ-GUIDE-004: a genuine two-path split must be visibly split — two lanes
// on desktop, a connected vertical stack on mobile — never prose alone.
test.describe('two-path branch', () => {
  test('both paths and the connector are visible, laid out per viewport', async ({ page }, testInfo) => {
    await page.goto('./?slide=open-space-two-paths');
    const withPath = page.getByRole('region', { name: 'עם קבוצת לימוד' });
    const withoutPath = page.getByRole('region', { name: 'ללא קבוצת לימוד' });
    await expect(withPath).toBeVisible();
    await expect(withoutPath).toBeVisible();
    await expect(page.getByText('או', { exact: true })).toBeVisible();

    const a = await withPath.boundingBox();
    const b = await withoutPath.boundingBox();
    if (!a || !b) throw new Error('branch paths have no layout boxes');
    if (testInfo.project.name === 'desktop') {
      // Side by side: same band vertically, clearly separated horizontally.
      expect(Math.abs(a.y - b.y)).toBeLessThan(48);
      expect(Math.abs(a.x - b.x)).toBeGreaterThan(a.width * 0.5);
    } else {
      // Stacked: the second lane starts below the first.
      const first = a.y < b.y ? a : b;
      const second = a.y < b.y ? b : a;
      expect(second.y).toBeGreaterThan(first.y + first.height * 0.6);
      expect(Math.abs(a.x - b.x)).toBeLessThan(24);
    }
  });

  test('the with-group path circles only its own card on the shared choice screen', async ({ page }) => {
    await page.goto('./?slide=open-space-two-paths');
    const withPath = page.getByRole('region', { name: 'עם קבוצת לימוד' });
    await expect(withPath.locator('svg title')).toHaveText(['עם קבוצת לימוד']);
  });

  // REQ-CONTENT-008/009: the "without study group" card is a real vertical process
  // that continues downward, in one source, into the full add-students how-to —
  // opening steps, then sending the link and the student's enrolment on real
  // captures — joined by the canonical down-arrows, with no red circle.
  test('the without-group card continues downward into the real add-students flow', async ({ page }) => {
    await page.goto('./?slide=open-space-two-paths');
    const withoutPath = page.getByRole('region', { name: 'ללא קבוצת לימוד' });
    const step1 = withoutPath.getByText('המרחב מתחיל ללא תלמידים.');
    const sendLink = withoutPath.getByText('המורה שולח לתלמיד את הקישור הישיר למרחב הלימוד.');
    const enrol = withoutPath.getByText('התלמיד לוחץ על הכפתור „רשום אותי”.');
    await expect(step1).toBeVisible();
    await expect(sendLink).toBeVisible();
    await expect(enrol).toBeVisible();

    // A genuine top-to-bottom sequence: the enrolment continuation sits below the opener.
    const bTop = await step1.boundingBox();
    const bEnrol = await enrol.boundingBox();
    if (!bTop || !bEnrol) throw new Error('without-group flow steps have no layout boxes');
    expect(bEnrol.y).toBeGreaterThan(bTop.y);

    // Multiple canonical down-arrows carry the card downward through its steps.
    expect(await withoutPath.locator('svg.lucide-chevrons-down').count()).toBeGreaterThanOrEqual(2);

    // The real Moodle captures actually load inside the card.
    const images = withoutPath.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const width = await images.nth(index).evaluate((el) => (el as HTMLImageElement).naturalWidth);
      expect(width, `capture ${index} failed to load`).toBeGreaterThan(0);
    }

    // Explicit-opt-in policy: none of these captures request a focus, so no red circle.
    await expect(withoutPath.locator('svg title')).toHaveCount(0);
  });
});
