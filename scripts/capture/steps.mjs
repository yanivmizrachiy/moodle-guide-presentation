// Drives the capture browser opened by launch.mjs over CDP. Never closes it.
// Usage: node steps.mjs '<json array of steps>'
// Steps: {"goto":url} {"click":selector} {"fill":[sel,text]} {"press":key}
//        {"hover":selector} {"wait":ms} {"selectIdx":[sel,index]} {"scroll":y}
//        {"dsf":2} {"cdpshot":file} {"shot":file} {"shotFull":file}
//        {"text":selector} {"eval":js}
//
// Capture quality (SSOT.md rule 13): use {"dsf":2} then {"cdpshot":file} for
// real 3200x1800 captures, and {"dsf":0} afterwards. The persistent context
// ignores launch-time deviceScaleFactor on its first tab, and page.screenshot
// overrides emulation with Playwright's own (1x) metrics — so the working
// path is a CDP Emulation.setDeviceMetricsOverride + Page.captureScreenshot.
//
// Safety: never drive a flow past a state-changing confirmation (creating a
// space, deleting content) without the owner's explicit go-ahead.
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const steps = JSON.parse(process.argv[2]);
const browser = await chromium.connectOverCDP('http://localhost:9223');
const page = browser.contexts()[0].pages()[0];
let cdp = null;
const cdpSession = async () => (cdp = cdp ?? (await page.context().newCDPSession(page)));

for (const step of steps) {
  if (step.goto) await page.goto(step.goto, { waitUntil: 'domcontentloaded' }).catch((e) => console.log('goto:', e.message));
  if (step.click) await page.click(step.click, { timeout: 8000 }).catch((e) => console.log('click failed:', e.message));
  if (step.fill) await page.fill(step.fill[0], step.fill[1], { timeout: 8000 }).catch((e) => console.log('fill failed:', e.message));
  if (step.press) await page.keyboard.press(step.press);
  if (step.hover) await page.hover(step.hover, { timeout: 8000 }).catch((e) => console.log('hover failed:', e.message));
  if (step.wait) await page.waitForTimeout(step.wait);
  if (step.selectIdx) await page.locator(step.selectIdx[0]).selectOption({ index: step.selectIdx[1] }).catch((e) => console.log('select failed:', e.message));
  if (step.scroll !== undefined) await page.evaluate((y) => window.scrollTo({ top: y }), step.scroll);
  if (step.dsf !== undefined) {
    await cdpSession();
    if (step.dsf) await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: step.dsf, mobile: false });
    else await cdp.send('Emulation.clearDeviceMetricsOverride');
  }
  if (step.cdpshot) {
    await cdpSession();
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(step.cdpshot, Buffer.from(data, 'base64'));
  }
  if (step.shot) await page.screenshot({ path: step.shot, scale: 'device' });
  if (step.shotFull) await page.screenshot({ path: step.shotFull, fullPage: true, scale: 'device' });
  if (step.text) console.log(await page.locator(step.text).first().innerText().catch(() => '(not found)'));
  if (step.eval) console.log(JSON.stringify(await page.evaluate(step.eval).catch((e) => e.message)));
}
console.log('DONE url=', page.url());
process.exit(0);
