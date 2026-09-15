import { expect, test } from '@playwright/test';

// The guide must run without significant runtime errors: no uncaught page
// errors and no console.error output while browsing representative slides.
const PATHS = ['./', './?slide=open-space-start', './?slide=edit-mode', './?slide=open-space-two-paths', './?slide=activity-dates'];

test('no runtime errors while browsing representative slides', async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console.error: ${message.text()}`);
  });

  for (const path of PATHS) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  await page.getByRole('button', { name: 'תוכן העניינים' }).click();
  await expect(page.getByRole('heading', { name: 'תוכן העניינים' })).toBeVisible();

  expect(problems, problems.join('\n')).toEqual([]);
});
