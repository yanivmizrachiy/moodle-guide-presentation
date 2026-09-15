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

  // REQ-CONTENT-008: the "without study group" path is a real vertical process,
  // not a screenshot list — two ordered steps joined by the canonical down-arrow,
  // and no red circle at all (it carries no capture).
  test('the without-group path is a vertical flow with a down arrow and no card circle', async ({ page }) => {
    await page.goto('./?slide=open-space-two-paths');
    const withoutPath = page.getByRole('region', { name: 'ללא קבוצת לימוד' });
    const step1 = withoutPath.getByText('המרחב מתחיל ללא תלמידים.');
    const step2 = withoutPath.getByText('אפשר לצרף תלמידים למרחב גם מאוחר יותר.');
    await expect(step1).toBeVisible();
    await expect(step2).toBeVisible();

    // A genuine top-to-bottom sequence: step 2 sits below step 1.
    const b1 = await step1.boundingBox();
    const b2 = await step2.boundingBox();
    if (!b1 || !b2) throw new Error('without-group flow steps have no layout boxes');
    expect(b2.y).toBeGreaterThan(b1.y);

    // The canonical double down-arrow between the two steps.
    await expect(withoutPath.locator('svg.lucide-chevrons-down')).toHaveCount(1);
    // No red hotspot circle in this path.
    await expect(withoutPath.locator('svg title')).toHaveCount(0);
  });
});
