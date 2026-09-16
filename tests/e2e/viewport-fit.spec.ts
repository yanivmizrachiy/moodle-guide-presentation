import { expect, test, type Page } from '@playwright/test';
import { PUBLISHED_GUIDE_SLIDES } from '../../src/data/guideDeck';

// REQ-PRESENTATION-001/003: the guide cover is a presentation screen, not a
// scroll page. These include short browser-content areas that are realistic on
// laptops after browser chrome/toolbars consume part of the physical screen.
const LAPTOP_VIEWPORTS = [
  { width: 1280, height: 640 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

const CONTENT_VIEWPORTS = [
  { width: 1280, height: 640 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
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

test('no published slide ever scrolls the page or scrolls sideways', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Laptop viewport invariant is exercised by the desktop project.');
  test.setTimeout(480_000);

  const failures: string[] = [];

  for (const viewport of CONTENT_VIEWPORTS) {
    await page.setViewportSize(viewport);

    for (const slide of PUBLISHED_GUIDE_SLIDES.filter((item) => !item.cover)) {
      await page.goto(`./?slide=${encodeURIComponent(slide.id)}`);
      await waitForStableSlide(page);

      const article = page.locator(`article[data-slide-id="${slide.id}"]`);
      await expect(article, `${slide.id}: slide article did not render`).toBeVisible();

      const metrics = await article.evaluate((element) => {
        const node = element as HTMLElement;
        const style = getComputedStyle(node);

        return {
          clientHeight: node.clientHeight,
          scrollHeight: node.scrollHeight,
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          overflowY: style.overflowY,
          documentScrollHeight: document.documentElement.scrollHeight,
          bodyScrollHeight: document.body.scrollHeight,
          viewportHeight: window.innerHeight,
        };
      });

      // REQ-PRESENTATION-002: a content slide teaches click-after-click with full
      // screenshots, so on a small screen it is taller than the viewport BY
      // DESIGN and scrolls inside its own article. What must never happen is the
      // page itself scrolling, or anything scrolling sideways.
      const reasons: string[] = [];
      if (metrics.scrollWidth > metrics.clientWidth + 1) reasons.push(`horizontal ${metrics.scrollWidth}>${metrics.clientWidth}`);
      if (metrics.documentScrollHeight > metrics.viewportHeight + 1) reasons.push('document scrolls');
      if (metrics.bodyScrollHeight > metrics.viewportHeight + 1) reasons.push('body scrolls');

      if (reasons.length > 0) failures.push(`${viewport.width}x${viewport.height} ${slide.id}: ${reasons.join(', ')}`);
    }
  }

  expect(failures, 'Slides that violate REQ-PRESENTATION-002').toEqual([]);
});

test('the cover carries no navigation controls', async ({ page }) => {
  // REQ-PRESENTATION-005: the cover IS the home page, so a house pointing at it,
  // a „back" with nothing behind it, a contents button beside „התחל" and a slide
  // counter are all noise. Search and the fullscreen control stay.
  await page.goto('./');
  await expect(page.locator('article[data-cover="true"]')).toBeVisible();

  for (const label of ['עמוד הבית', 'תוכן העניינים', 'חזרה שלב אחד אחורה', 'לשקף הקודם', 'לשקף הבא']) {
    await expect(page.getByRole('button', { name: label }), `the cover must not offer „${label}”`).toHaveCount(0);
  }

  // „התחל" opens the table of contents, which is why a contents button beside it
  // would be a second door to the same room.
  await expect(page.getByRole('button', { name: 'חיפוש במצגת' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'התחל' })).toBeVisible();
  // The way in and out of fullscreen stays on the cover too (REQ-PRESENTATION-004).
  await expect(page.getByRole('button', { name: /מסך מלא/ })).toBeVisible();

  // Every other slide keeps the full navigation.
  await page.goto('./?slide=edit-mode');
  await expect(page.getByRole('button', { name: 'עמוד הבית' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'תוכן העניינים' })).toBeVisible();
});

test('every control a thumb reaches is at least 44px on a phone', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Touch-target invariant is exercised by the mobile project.');

  // REQ-PRESENTATION-006. Checked on a content slide, which carries the full
  // header and the bottom bar; the cover is a strict subset of these controls.
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('./?slide=edit-mode');
  await waitForStableSlide(page);

  const tooSmall = await page.evaluate(() => {
    // Links and role=button count too: a control is whatever a thumb taps.
    const chrome = [
      ...document.querySelectorAll('header button, header a, header [role="button"], footer button, footer a, footer [role="button"]'),
    ];
    return chrome
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { label: element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '?', w: Math.round(rect.width), h: Math.round(rect.height) };
      })
      .filter((box) => box.w > 0 && (box.w < 44 || box.h < 44));
  });

  expect(tooSmall, 'controls below the 44px touch target').toEqual([]);
});

test('every published slide fits a 375px phone without sideways scrolling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Phone-width invariant is exercised by the mobile project.');
  test.setTimeout(480_000);

  // REQ-PRESENTATION-006: iPhone SE width is the narrowest real device the guide
  // must serve. Vertical scrolling inside the slide is fine; a sideways scrollbar
  // never is, and neither is content wider than the screen.
  await page.setViewportSize({ width: 375, height: 667 });
  const failures: string[] = [];

  for (const slide of PUBLISHED_GUIDE_SLIDES) {
    await page.goto(`./?slide=${encodeURIComponent(slide.id)}`);
    await waitForStableSlide(page);

    // Document-level metrics CANNOT see this: the shell is `fixed inset-0
    // overflow-hidden`, so it pins documentElement.scrollWidth to the viewport
    // while the slide overflows sideways behind it. An earlier version of this
    // test checked only those, and passed on a build that pushed the „לשקף הבא"
    // control 26px off the left edge. Measure the slide and the chrome instead.
    const overflow = await page.evaluate(() => {
      const article = document.querySelector('article[data-slide-id], article[data-cover="true"]');
      const controls = [...document.querySelectorAll('header button, header a, footer button, footer a')];
      return {
        rendered: Boolean(article),
        scrollWidth: article?.scrollWidth ?? 0,
        clientWidth: article?.clientWidth ?? 0,
        overflowX: article ? getComputedStyle(article).overflowX : '',
        viewportWidth: window.innerWidth,
        offscreen: controls
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              label: element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 16) ?? '?',
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            };
          })
          .filter((box) => box.width > 0 && (box.left < -1 || box.right > window.innerWidth + 1)),
      };
    });

    if (!overflow.rendered) {
      failures.push(`${slide.id}: slide did not render`);
      continue;
    }
    if (overflow.scrollWidth > overflow.clientWidth + 1) {
      failures.push(`${slide.id}: slide overflows sideways ${overflow.scrollWidth}>${overflow.clientWidth}`);
    }
    // Computed overflow-x is checked only for the explicit `scroll` value. CSS forces
    // the other axis to `auto` when one axis is not `visible`, so every slide that
    // legitimately scrolls vertically reports overflow-x:auto without any sideways
    // overflow existing — `auto` is never a failure. No rule in src/ sets overflow-x
    // today, so this branch is a guard against a future deliberate sideways scrollbar;
    // scrollWidth vs clientWidth above is what actually detects real overflow.
    if (overflow.overflowX === 'scroll') {
      failures.push(`${slide.id}: slide has a real sideways scrollbar`);
    }
    for (const control of overflow.offscreen) {
      failures.push(
        `${slide.id}: control „${control.label}" is off screen (${control.left}..${control.right} of ${overflow.viewportWidth})`
      );
    }
  }

  expect(failures, 'Slides that violate REQ-PRESENTATION-006').toEqual([]);
});

test('short mobile screens never clip the cover start control', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile reachability invariant is exercised by the mobile project.');

  for (const viewport of [
    { width: 393, height: 851 },
    { width: 851, height: 393 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('./');
    await waitForStableSlide(page);

    const cover = page.locator('article[data-cover="true"]');
    const start = cover.getByRole('button', { name: 'התחל' });
    await expect(start).toBeVisible();

    const reachable = await cover.evaluate((element) => {
      const article = element as HTMLElement;
      const button = article.querySelector('button');
      if (!(button instanceof HTMLElement)) return false;

      const isInside = () => {
        const articleRect = article.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        return buttonRect.top >= articleRect.top - 1 && buttonRect.bottom <= articleRect.bottom + 1;
      };

      if (isInside()) return true;
      article.scrollTop = article.scrollHeight;
      return isInside();
    });

    expect(reachable, `${viewport.width}x${viewport.height}: start control must remain reachable`).toBe(true);
  }
});
