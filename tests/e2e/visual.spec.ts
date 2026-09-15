import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// Controlled visual-regression baselines for representative slide shapes
// (plain, flow, branch, hotspot, group, TOC) on desktop and mobile.
// Baselines are per-platform; on a platform that has none yet the suite
// skips with an explicit message instead of blessing itself — new baselines
// are generated deliberately (locally or via the update-visual-baselines
// workflow), never silently in a gate run.
const snapshotsDir = fileURLToPath(new URL('./visual.spec.ts-snapshots', import.meta.url));
const hasPlatformBaselines =
  existsSync(snapshotsDir) && readdirSync(snapshotsDir).some((name) => name.includes(process.platform));

test.skip(
  !hasPlatformBaselines && !process.env.UPDATE_SNAPSHOTS,
  `no visual baselines for ${process.platform} yet — generate them deliberately with --update-snapshots`
);

const SLIDES = [
  { name: 'cover', path: './' },
  { name: 'flow', path: './?slide=open-space-start' },
  { name: 'branch', path: './?slide=open-space-two-paths' },
  { name: 'edit-mode', path: './?slide=edit-mode' },
  { name: 'dependent-group', path: './?slide=edit-mode-dependent' },
];

test.describe('visual regression', () => {
  for (const slide of SLIDES) {
    test(slide.name, async ({ page }) => {
      await page.goto(slide.path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`${slide.name}.png`, {
        animations: 'disabled',
        // The cover logo spins by design; masking it keeps the baseline honest
        // about everything else without freezing a mid-rotation frame.
        mask: [page.locator('img[alt^="יחידת מתמטיקה"]')],
      });
    });
  }

  test('toc', async ({ page }) => {
    await page.goto('./?slide=open-space-start');
    await page.getByRole('button', { name: 'תוכן העניינים' }).click();
    await expect(page.getByRole('heading', { name: 'תוכן העניינים' })).toBeVisible();
    await expect(page).toHaveScreenshot('toc.png', { animations: 'disabled' });
  });
});
