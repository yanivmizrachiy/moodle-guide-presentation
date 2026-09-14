// Interval recorder: screenshots the capture browser every 3.5s (~6 minutes)
// while the user walks a flow by hand. Screenshot-only; never interacts.
// Usage: node rec.mjs [outDir]   (frames land as <outDir>/rec-NNN.png)
import { chromium } from 'playwright';
import path from 'node:path';

const outDir = process.argv[2] ?? 'raw';
const browser = await chromium.connectOverCDP('http://localhost:9223');
const page = browser.contexts()[0].pages()[0];
for (let i = 1; i <= 100; i++) {
  await page.screenshot({ path: path.join(outDir, `rec-${String(i).padStart(3, '0')}.png`) }).catch(() => {});
  await page.waitForTimeout(3500);
}
console.log('REC_DONE');
process.exit(0);
