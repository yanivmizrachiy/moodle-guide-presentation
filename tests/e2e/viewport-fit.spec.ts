import { expect, test, type Page } from '@playwright/test';
import { PUBLISHED_GUIDE_SLIDES } from '../../src/data/guideDeck';

// REQ-PRESENTATION-001/003: the guide cover is a presentation screen, not a
// scroll page. These are common laptop/browser viewport sizes, including the
// shorter 720px case that previously exposed the regression.
const LAPTOP_VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
];

async function waitForStableSlide(page: Page) {
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
}

test('cover stays completely inside one viewport without scrolling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Laptop viewport invariant is exercised by the desktop project.');

  for (const viewport of LAPTOP_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto('./');
    await waitForStableSlide(page);

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

test('every published content slide stays inside one laptop viewport without scrolling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Laptop viewport invariant is exercised by the desktop project.');
  test.setTimeout(180_000);

  const viewport = { width: 1366, height: 768 };
  await page.setViewportSize(viewport);
  const failures: string[] = [];

  for (const slide of PUBLISHED_GUIDE_SLIDES.filter((item) => !item.cover)) {
    await page.goto(`./?slide=${encodeURIComponent(slide.id)}`);
    await waitForStableSlide(page);

    const article = page.locator(`article[data-slide-id="${slide.id}"]`);
    await expect(article, `${slide.id}: slide article did not render`).toBeVisible();

    const metrics = await article.evaluate((element) => {
      const node = element as HTMLElement;
      const content = node.firstElementChild as HTMLElement | null;
      const style = getComputedStyle(node);
      const nodeRect = node.getBoundingClientRect();
      const contentRect = content?.getBoundingClientRect();

      return {
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        overflowY: style.overflowY,
        documentScrollHeight: document.documentElement.scrollHeight,
        bodyScrollHeight: document.body.scrollHeight,
        viewportHeight: window.innerHeight,
        contentInside: Boolean(
          contentRect &&
            contentRect.top >= nodeRect.top - 1 &&
            contentRect.bottom <= nodeRect.bottom + 1 &&
            contentRect.left >= nodeRect.left - 1 &&
            contentRect.right <= nodeRect.right + 1
        ),
      };
    });

    const reasons: string[] = [];
    if (metrics.overflowY !== 'hidden') reasons.push(`overflow-y=${metrics.overflowY}`);
    if (metrics.scrollHeight > metrics.clientHeight + 1) reasons.push(`vertical ${metrics.scrollHeight}>${metrics.clientHeight}`);
    if (metrics.scrollWidth > metrics.clientWidth + 1) reasons.push(`horizontal ${metrics.scrollWidth}>${metrics.clientWidth}`);
    if (metrics.documentScrollHeight > metrics.viewportHeight + 1) reasons.push('document scrolls');
    if (metrics.bodyScrollHeight > metrics.viewportHeight + 1) reasons.push('body scrolls');
    if (!metrics.contentInside) reasons.push('content rectangle leaves article');

    if (reasons.length > 0) failures.push(`${slide.id}: ${reasons.join(', ')}`);
  }

  expect(failures, `Slides that violate REQ-PRESENTATION-002 at ${viewport.width}x${viewport.height}`).toEqual([]);
});
