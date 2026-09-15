import { expect, test } from '@playwright/test';

// REQ-CONTENT-004: the guide-side teaching toggle really works, is
// accessible, and shows the owner-locked captions exactly:
// OFF -> "כך מכבים את מצב העריכה", ON -> "כך מדליקים את מצב העריכה".
const OFF_COPY = 'כך מכבים את מצב העריכה';
const ON_COPY = 'כך מדליקים את מצב העריכה';

test.describe('edit-mode teaching toggle', () => {
  test('mouse: toggles state and swaps the locked captions', async ({ page }) => {
    await page.goto('./?slide=edit-mode');
    const toggle = page.getByRole('switch', { name: 'מתג עריכה לתרגול' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText(OFF_COPY, { exact: true })).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText(ON_COPY, { exact: true })).toBeVisible();
    await expect(page.getByText(OFF_COPY, { exact: true })).toHaveCount(0);
  });

  test('keyboard: the switch is focusable and Enter/Space both operate it', async ({ page }) => {
    await page.goto('./?slide=edit-mode');
    const toggle = page.getByRole('switch', { name: 'מתג עריכה לתרגול' });
    await toggle.focus();
    await expect(toggle).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText(OFF_COPY, { exact: true })).toBeVisible();
  });

  test('the control is framed as a guide widget, beside the real evidence', async ({ page }) => {
    await page.goto('./?slide=edit-mode');
    await expect(page.getByText('רכיב אינטראקטיבי של המדריך', { exact: true })).toBeVisible();
    // The real Moodle captures remain on the same slide as the evidence.
    // Each capture appears more than once in the flow, so the evidence check
    // takes the first use of each.
    await expect(page.locator('img[src*="10-course-page"]').first()).toBeVisible();
    await expect(page.locator('img[src*="05-home-edit-on"]').first()).toBeVisible();
  });
});
