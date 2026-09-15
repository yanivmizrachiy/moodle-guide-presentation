import { expect, test } from '@playwright/test';

test.describe('navigation', () => {
  test('the cover opens and התחל opens the table of contents', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'מדריך למורים במערכת Moodle' })).toBeVisible();
    await page.getByRole('button', { name: 'התחל' }).click();
    await expect(page.getByRole('heading', { name: 'תוכן העניינים' })).toBeVisible();
    // Chapters render collapsed; the editing chapter is one of them.
    await expect(page.getByRole('button', { name: 'מצב עריכה', exact: true })).toBeVisible();
  });

  test('a deep link lands on its slide and survives refresh', async ({ page }) => {
    await page.goto('./?slide=edit-mode');
    await expect(
      page.getByRole('heading', { name: 'איך נכנסים למצב עריכה?' })
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'איך נכנסים למצב עריכה?' })
    ).toBeVisible();
    expect(page.url()).toContain('slide=edit-mode');
  });

  test('next/previous move between slides and the URL follows', async ({ page }) => {
    await page.goto('./?slide=open-space-start');
    await expect(page.getByRole('heading', { name: 'איך פותחים מרחב למידה במודל?' })).toBeVisible();
    await page.getByRole('button', { name: 'הבא' }).click();
    await expect(page).toHaveURL(/slide=(?!open-space-start)/);
    await page.getByRole('button', { name: 'הקודם' }).click();
    await expect(page).toHaveURL(/slide=open-space-start/);
  });

  test('a TOC entry deep-links to the exact slide', async ({ page }) => {
    await page.goto('./?slide=open-space-start');
    await page.getByRole('button', { name: 'תוכן העניינים' }).click();
    await page.getByRole('button', { name: 'מצב עריכה', exact: true }).click();
    await page.getByRole('button', { name: 'מה ניתן לעשות במצב עריכה?' }).click();
    await expect(
      page.getByRole('heading', { name: 'מה ניתן לעשות במצב עריכה?' })
    ).toBeVisible();
    expect(page.url()).toContain('slide=edit-mode-dependent');
  });
});
