/** Downscale existing masthead JPEGs into 480, 768, and 1080 AVIF, WebP, and JPEG. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire("/tmp/imgtools/node_modules/sharp/package.json");
const sharp = require("sharp");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const photos = JSON.parse(fs.readFileSync(path.join(root, "data/dish-photos.json"), "utf8"));
const steps = [480, 768, 1080];
const dir = path.join(root, "assets/photos/editorial");

function jobs() {
  const list = [];
  for (const photo of photos) {
    if (!photo.mastWidth || !photo.mastHeight) continue;
    const source = path.join(dir, `${photo.id}-mast-${photo.mastWidth}.jpg`);
    if (!fs.existsSync(source)) continue;
    for (const width of steps) {
      if (width >= photo.mastWidth) continue;
      const height = Math.max(1, Math.round(photo.mastHeight * width / photo.mastWidth));
      const base = path.join(dir, `${photo.id}-mast-${width}`);
      list.push({ source, base, width, height });
    }
  }
  return list;
}

async function writeOne(job) {
  const jpg = `${job.base}.jpg`;
  const webp = `${job.base}.webp`;
  const avif = `${job.base}.avif`;
  if (fs.existsSync(jpg) && fs.existsSync(webp) && fs.existsSync(avif)) return false;
  const image = sharp(job.source).resize(job.width, job.height, { fit: "fill" });
  await image.clone().jpeg({ quality: 78, progressive: true, mozjpeg: true }).toFile(jpg);
  await image.clone().webp({ quality: 72 }).toFile(webp);
  await image.clone().avif({ quality: 60, effort: 4 }).toFile(avif);
  return true;
}

const list = jobs();
let written = 0;
const queue = list.slice();
async function worker() {
  while (queue.length) {
    const job = queue.shift();
    if (await writeOne(job)) written += 1;
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log(`mast srcset ${written} new files, ${list.length} widths checked`);
