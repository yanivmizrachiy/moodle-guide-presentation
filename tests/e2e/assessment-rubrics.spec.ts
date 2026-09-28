import { expect, test } from '@playwright/test';

test.describe('assessment rubric source truth', () => {
  test('grade 7 and grade 8 assessment information is present on the tasks slide', async ({ page }) => {
    await page.goto('./?slide=send-task');

    await expect(page.getByRole('heading', { name: 'איך שולחים לתלמידים משימה?' })).toBeVisible();

    await expect(page.getByText(/כיתה ז׳ — משימה 1: 1\.11\.26-13\.11\.26/)).toBeVisible();
    await expect(page.getByText(/משימה 2: 26\.1\.27-4\.2\.27/).first()).toBeVisible();
    await expect(page.getByText(/משימה 3: 14\.3\.27-26\.3\.27/).first()).toBeVisible();
    await expect(page.getByText(/מבחן מפמ״ר: 23\.5\.27-4\.6\.27/).first()).toBeVisible();

    await expect(page.getByText(/כיתה ח׳ — משימה 1: 25\.10\.26-6\.11\.26/)).toBeVisible();
    await expect(page.getByText(/משימה 4 - מבחן מפמ״ר: 23\.5\.27-4\.6\.27/)).toBeVisible();

    await expect(page.getByText(/זמן מומלץ 60 דקות/)).toHaveCount(0);
    await expect(page.getByText(/שני שיעורים ברצף/)).toHaveCount(0);
  });
});
