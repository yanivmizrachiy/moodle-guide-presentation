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

  test('each path circles only its own card on the shared choice screen', async ({ page }) => {
    await page.goto('./?slide=open-space-two-paths');
    const withPath = page.getByRole('region', { name: 'עם קבוצת לימוד' });
    const withoutPath = page.getByRole('region', { name: 'ללא קבוצת לימוד' });
    await expect(withPath.locator('svg title')).toHaveText(['עם קבוצת לימוד']);
    await expect(withoutPath.locator('svg title')).toHaveText(['ללא קבוצת לימוד']);
  });
});
