// Opens a headed Chromium for a live Moodle capture session. The user logs in
// themselves (credentials are never typed by automation); the browser then
// stays alive and is driven over CDP by steps.mjs.
//
// Requires playwright, which is deliberately NOT a dependency of this repo
// (heavy, not needed for build/CI). Run from any folder that has it:
//   npm i playwright && npx playwright install chromium
//   node <repo>/scripts/capture/launch.mjs [start-url]
//
// Screenshots are captured at deviceScaleFactor 2 for crisp derivatives.
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
