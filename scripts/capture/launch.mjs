// Opens a headed Chromium for a live Moodle capture session. The user logs in
// themselves (credentials are never typed by automation); the browser then
// stays alive and is driven over CDP by steps.mjs.
//
// playwright resolves here already: it is a transitive dependency of the
// @playwright/test devDependency (pinned in package-lock.json), so run this
// from the repo root. Only the browser binary needs installing once:
//   npx playwright install chromium        # same step CI already runs
//   node scripts/capture/launch.mjs [start-url]
// From a folder outside the repo, install playwright there first.
//
// The launch-time deviceScaleFactor below is ignored by the persistent context's
// first tab — the tab steps.mjs drives. A real 2x capture must go through
// steps.mjs: {"dsf":2} then {"cdpshot":file}, then {"dsf":0} (SSOT.md rule 13).
import { chromium } from 'playwright';
import os from 'node:os';
import path from 'node:path';

// A second, independent browser (e.g. a student account for student-view
// captures) runs side by side with CDP_PORT=9224 PROFILE=student.
const url = process.argv[2] ?? 'https://moodlemoe.lms.education.gov.il/';
const port = process.env.CDP_PORT || '9223';
const profileName = process.env.PROFILE ? `moodle-guide-capture-${process.env.PROFILE}` : 'moodle-guide-capture-profile';
const profile = path.join(os.tmpdir(), profileName);
const ctx = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 2,
  locale: 'he-IL',
  args: [`--remote-debugging-port=${port}`, '--window-size=1650,1040'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto(url, { waitUntil: 'domcontentloaded' });
console.log('BROWSER_READY');
await new Promise(() => {});
