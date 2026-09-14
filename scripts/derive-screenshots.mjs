// Generates the AVIF + WebP derivatives that the deck serves, from the real
// original captures (jpg/jpeg/png) in public/guide/screenshots.
// Originals are never modified; they are the archival source of truth.
//
// Quality-first pipeline for text-heavy Hebrew UI screenshots (SSOT.md rule 13):
//   downscale to max 3200px wide only when larger (Lanczos3, never enlarged)
//   -> mild sharpen -> AVIF q80 / WebP q88. Small legacy originals pass through
//   at native size; full-res 3200px captures keep their detail for the lightbox
//   and fullscreen projection.
//
// Usage:
//   npm run shots:derive                  create missing derivatives only
//   npm run shots:derive -- <stem...>     force-regenerate the given stems
//   npm run shots:derive -- --all         force-regenerate every derivative
import { readdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const MAX_WIDTH = 3200;
const dir = path.join(process.cwd(), 'public/guide/screenshots');
const names = readdirSync(dir);
const originals = names.filter((name) => /\.(?:jpg|jpeg|png)$/i.test(name));
const args = process.argv.slice(2);
const forceAll = args.includes('--all');
const forceStems = new Set(args.filter((a) => a !== '--all'));

function pipeline(source) {
  return sharp(source)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true, kernel: 'lanczos3' })
    .sharpen({ sigma: 0.5 });
}

let created = 0;
for (const original of originals) {
  const stem = original.replace(/\.[^.]+$/, '');
  const source = path.join(dir, original);
  const force = forceAll || forceStems.has(stem);
  for (const [ext, make] of [
    ['avif', (img) => img.avif({ quality: 80, effort: 6 })],
    ['webp', (img) => img.webp({ quality: 88, effort: 5 })],
  ]) {
    if (!force && names.includes(`${stem}.${ext}`)) continue;
    await make(pipeline(source)).toFile(path.join(dir, `${stem}.${ext}`));
    console.log(`created ${stem}.${ext}`);
    created += 1;
  }
}

console.log(created ? `Done: ${created} derivative(s) created.` : 'All derivatives already present.');
