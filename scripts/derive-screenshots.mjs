// Generates the AVIF + WebP derivatives that the deck serves, from the real
// original captures (jpg/jpeg/png) in public/guide/screenshots.
// Only missing derivatives are created; originals are never modified.
// Usage: npm run shots:derive
import { readdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.join(process.cwd(), 'public/guide/screenshots');
const names = readdirSync(dir);
const originals = names.filter((name) => /\.(?:jpg|jpeg|png)$/i.test(name));

let created = 0;
for (const original of originals) {
  const stem = original.replace(/\.[^.]+$/, '');
  const source = path.join(dir, original);
  for (const [ext, make] of [
    ['avif', (img) => img.avif({ quality: 60 })],
    ['webp', (img) => img.webp({ quality: 82 })],
  ]) {
    if (names.includes(`${stem}.${ext}`)) continue;
    await make(sharp(source)).toFile(path.join(dir, `${stem}.${ext}`));
    console.log(`created ${stem}.${ext}`);
    created += 1;
  }
}

console.log(created ? `Done: ${created} derivative(s) created.` : 'All derivatives already present.');
