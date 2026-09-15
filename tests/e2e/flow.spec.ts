import { expect, test } from '@playwright/test';

// REQ-GUIDE-001/002/003: a procedure is a numbered vertical sequence whose
// screenshots really load and whose action focus carries the red mark.
test.describe('flow slides and hotspots', () => {
  test('the edit-mode flow renders ordered steps with loaded, marked screenshots', async ({ page }) => {
    await page.goto('./?slide=edit-mode');
    const flow = page.getByRole('region', { name: 'רצף הפעולות' }).first();
    await expect(flow).toBeVisible();

    // Numbered badges appear in order.
    await expect(flow.getByText('1', { exact: true }).first()).toBeVisible();
    await expect(flow.getByText('2', { exact: true }).first()).toBeVisible();

    // Every screenshot in the flow actually painted pixels.
    const images = flow.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(images.nth(index)).toBeVisible();
      const width = await images.nth(index).evaluate((el) => (el as HTMLImageElement).naturalWidth);
      expect(width, `screenshot ${index} failed to load`).toBeGreaterThan(0);
    }

    // The real toggle is red-marked on both the off and on captures.
    await expect(flow.locator('svg title', { hasText: 'מצב עריכה' })).toHaveCount(2);
  });

  test('the honest failure state never appears on published slides', async ({ page }) => {
    await page.goto('./?slide=open-space-start');
    await expect(page.getByText('הצילום לא נטען')).toHaveCount(0);
  });
});
