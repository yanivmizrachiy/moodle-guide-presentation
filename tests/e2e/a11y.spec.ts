import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Automated accessibility gate on representative guide states. Serious and
// critical findings fail the run — they get fixed, never filtered away.
const PAGES = [
  { name: 'cover', path: './' },
  { name: 'flow slide', path: './?slide=open-space-start' },
  { name: 'edit-mode slide with the teaching toggle', path: './?slide=edit-mode' },
  { name: 'two-path branch', path: './?slide=open-space-two-paths' },
  { name: 'edit-mode dependent group', path: './?slide=edit-mode-dependent' },
];

test.describe('accessibility', () => {
  for (const target of PAGES) {
    test(`axe scan: ${target.name}`, async ({ page }) => {
      await page.goto(target.path);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical'
      );
      expect(
        blocking,
        blocking
          .map((violation) => `${violation.id}: ${violation.help} -> ${violation.nodes[0]?.target}`)
          .join('\n')
      ).toEqual([]);
    });
  }

  test('the table of contents is accessible', async ({ page }) => {
    await page.goto('./?slide=open-space-start');
    await page.getByRole('button', { name: 'תוכן העניינים' }).click();
    await expect(page.getByRole('heading', { name: 'תוכן העניינים' })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical'
    );
    expect(
      blocking,
      blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')
    ).toEqual([]);
  });
});
