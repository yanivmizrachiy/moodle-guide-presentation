import { expect, test } from '@playwright/test';

// REQ-PRESENTATION-001/003: the guide cover is a presentation screen, not a
// scroll page. These are common laptop/browser viewport sizes, including the
// shorter 720px case that previously exposed the regression.
const LAPTOP_VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
];

test('cover stays completely inside one viewport without scrolling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Laptop viewport invariant is exercised by the desktop project.');

  for (const viewport of LAPTOP_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto('./');
    await page.evaluate(async () => {
      await document.fonts.ready;
      const images = Array.from(document.images);
      await Promise.all(
        images.map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                image.addEventListener('load', () => resolve(), { once: true });
                image.addEventListener('error', () => resolve(), { once: true });
              })
        )
      );
    });

    const cover = page.locator('article[data-cover="true"]');
    await expect(cover).toBeVisible();
    await expect(cover.getByRole('button', { name: 'התחל' })).toBeVisible();

    const metrics = await cover.evaluate((element) => {
      const article = element as HTMLElement;
      const content = article.firstElementChild as HTMLElement | null;
      const style = getComputedStyle(article);
      const articleRect = article.getBoundingClientRect();
      const startButton = article.querySelector('button');
      const startRect = startButton?.getBoundingClientRect();

      return {
        articleClientHeight: article.clientHeight,
        articleScrollHeight: article.scrollHeight,
        articleClientWidth: article.clientWidth,
        articleScrollWidth: article.scrollWidth,
        contentClientHeight: content?.clientHeight ?? 0,
        contentScrollHeight: content?.scrollHeight ?? 0,
        documentScrollHeight: document.documentElement.scrollHeight,
        bodyScrollHeight: document.body.scrollHeight,
        viewportHeight: window.innerHeight,
        overflowY: style.overflowY,
        startInsideArticle: Boolean(
          startRect &&
            startRect.top >= articleRect.top - 1 &&
            startRect.bottom <= articleRect.bottom + 1
        ),
      };
    });

    expect(metrics.overflowY, `${viewport.width}x${viewport.height}: cover must not be scrollable`).toBe('hidden');
    expect(metrics.articleScrollHeight, `${viewport.width}x${viewport.height}: cover content overflowed vertically`).toBeLessThanOrEqual(
      metrics.articleClientHeight + 1
    );
    expect(metrics.articleScrollWidth, `${viewport.width}x${viewport.height}: cover content overflowed horizontally`).toBeLessThanOrEqual(
      metrics.articleClientWidth + 1
    );
    expect(metrics.contentScrollHeight, `${viewport.width}x${viewport.height}: cover inner layout exceeded its screen`).toBeLessThanOrEqual(
      metrics.contentClientHeight + 1
    );
    expect(metrics.documentScrollHeight, `${viewport.width}x${viewport.height}: document became scrollable`).toBeLessThanOrEqual(
      metrics.viewportHeight + 1
    );
    expect(metrics.bodyScrollHeight, `${viewport.width}x${viewport.height}: body became scrollable`).toBeLessThanOrEqual(
      metrics.viewportHeight + 1
    );
    expect(metrics.startInsideArticle, `${viewport.width}x${viewport.height}: start button fell below the cover`).toBe(true);
  }
});
