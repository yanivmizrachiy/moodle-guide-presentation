import { expect, test } from '@playwright/test';

test.describe('navigation', () => {
  test('the cover opens and התחל opens the table of contents', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'מדריך למורים במערכת Moodle' })).toBeVisible();
    await page.getByRole('button', { name: 'התחל' }).click();
    await expect(page.getByRole('heading', { name: 'תוכן העניינים' })).toBeVisible();
    // Chapters render collapsed; the editing chapter is one of them.
    await expect(page.getByRole('button', { name: /מצב עריכה וניהול תוכן/ })).toBeVisible();
  });

  test('a deep link lands on its slide and survives refresh', async ({ page }) => {
    await page.goto('./?slide=edit-mode');
    await expect(
      page.getByRole('heading', { name: 'מהו מצב עריכה במרחב הלמידה ומה אפשר לעשות בו?' })
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'מהו מצב עריכה במרחב הלמידה ומה אפשר לעשות בו?' })
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
    await page.getByRole('button', { name: /מצב עריכה וניהול תוכן/ }).click();
    await page.getByRole('button', { name: 'אילו פעולות אפשר לבצע רק כשמצב העריכה דולק?' }).click();
    await expect(
      page.getByRole('heading', { name: 'אילו פעולות אפשר לבצע רק כשמצב העריכה דולק?' })
    ).toBeVisible();
    expect(page.url()).toContain('slide=edit-mode-dependent');
  });
});
