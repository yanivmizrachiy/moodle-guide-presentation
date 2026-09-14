// Generates the AVIF + WebP derivatives that the deck serves, from the real
// original captures (jpg/jpeg/png) in public/guide/screenshots.
// Originals are never modified; they are the archival source of truth.
//
// Derivative pipeline (quality-first for text-heavy UI screenshots):
//   resize to max 1920px wide (Lanczos3, never enlarged) -> mild sharpen
//   -> AVIF q72 / WebP q90. Oversized captures (e.g. 2x-DPR 3200px) would
//   otherwise be downscaled ~7x by the browser and smear the Hebrew text.
//
// Usage:
//   npm run shots:derive                  create missing derivatives only
//   npm run shots:derive -- <stem...>     force-regenerate the given stems
import { readdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.join(process.cwd(), 'public/guide/screenshots');
const names = readdirSync(dir);
const originals = names.filter((name) => /\.(?:jpg|jpeg|png)$/i.test(name));
const forceStems = new Set(process.argv.slice(2));

function pipeline(source) {
  return sharp(source)
    .resize({ width: 1920, withoutEnlargement: true, kernel: 'lanczos3' })
    .sharpen({ sigma: 0.6 });
}

let created = 0;
for (const original of originals) {
  const stem = original.replace(/\.[^.]+$/, '');
  const source = path.join(dir, original);
  const force = forceStems.has(stem);
  for (const [ext, make] of [
    ['avif', (img) => img.avif({ quality: 72, effort: 6 })],
    ['webp', (img) => img.webp({ quality: 90, effort: 5 })],
  ]) {
    if (!force && names.includes(`${stem}.${ext}`)) continue;
    await make(pipeline(source)).toFile(path.join(dir, `${stem}.${ext}`));
    console.log(`created ${stem}.${ext}`);
    created += 1;
  }
}

console.log(created ? `Done: ${created} derivative(s) created.` : 'All derivatives already present.');
