import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HUB_PHOTOS } from "../data/hub-photos.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = "FlyingKitchen/1.0 (https://jonldavis-coder.github.io/flying-kitchen/; editorial hub)";

export function licenseAllowed(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;
  if (text.includes("noncommercial") || text.includes("non-commercial") || text.includes("-nc") || text.includes(" nc")) return false;
  if (text.includes("no deriv") || text.includes("-nd") || text.includes(" nd")) return false;
  if (text.includes("all rights reserved")) return false;
  if (text.includes("cc0") || text.includes("public domain") || text === "pd") return true;
  if (text.includes("cc by-sa") || text.includes("attribution-sharealike") || text.includes("attribution sharealike")) return true;
  if (text.includes("cc by") || text.includes("creative commons attribution")) return true;
  return false;
}

export function parsePhotoRecords(json, fallbackSlug = "") {
  if (!json) return [];
  const list = Array.isArray(json) ? json : Array.isArray(json.photos) ? json.photos : Object.entries(json).filter(([, value]) => value && typeof value === "object").map(([slug, value]) => ({ slug, ...value }));
  return list.map((raw) => normalizePhotoRecord(raw, raw.slug || fallbackSlug)).filter(Boolean);
}

export function photoFromCatalogItem(raw) {
  if (!raw?.slug) return null;
  const nested = raw.photo && typeof raw.photo === "object" ? raw.photo : null;
  const src = nested?.src || nested?.url || (typeof raw.photo === "string" ? raw.photo : "") || raw.photoUrl || raw.imageUrl || "";
  if (!src) return null;
  return normalizePhotoRecord({
    slug: raw.slug,
    src,
    alt: nested?.alt || raw.photoAlt || raw.imageAlt || "",
    credit: nested?.credit || raw.photoCredit || "",
    license: nested?.license || raw.photoLicense || "",
    licenseUrl: nested?.licenseUrl || raw.photoLicenseUrl || "",
    sourceUrl: nested?.sourceUrl || nested?.source || raw.photoSource || ""
  }, raw.slug);
}

function normalizePhotoRecord(raw, slug) {
  const id = String(slug || raw.slug || "").trim();
  const src = String(raw.src || raw.url || raw.file || "").trim();
  const alt = String(raw.alt || "").trim();
  const credit = String(raw.credit || raw.artist || "").trim();
  const license = String(raw.license || raw.licenseShortName || "").trim();
  if (!id || !src || !alt || !credit || !licenseAllowed(license)) return null;
  return {
    slug: id,
    src,
    alt,
    credit,
    license,
    licenseUrl: String(raw.licenseUrl || "").trim(),
    sourceUrl: String(raw.sourceUrl || raw.source || "").trim()
  };
}

export async function prepareHubPhotos() {
  const outDir = path.join(root, "assets", "photos", "hub");
  fs.mkdirSync(outDir, { recursive: true });
  const credits = [];
  for (const spec of HUB_PHOTOS) {
    const meta = await commonsInfo(spec.commons);
    if (!meta || !licenseAllowed(meta.license)) {
      throw new Error(`Refusing hub photo ${spec.commons}: license ${meta?.license || "missing"} is not CC0, CC BY, CC BY-SA, or public domain.`);
    }
    const dest = path.join(outDir, `${spec.id}.jpg`);
    await downloadOptimized(meta.thumbUrl || meta.url, dest, spec.role === "hero" ? 1600 : 1200);
    const size = imageSize(dest);
    credits.push({
      id: spec.id,
      role: spec.role,
      local: `assets/photos/hub/${spec.id}.jpg`,
      alt: spec.alt,
      caption: spec.caption,
      credit: meta.artist || "Wikimedia Commons contributor",
      license: meta.license,
      licenseUrl: meta.licenseUrl,
      sourceUrl: meta.page,
      commonsTitle: spec.commons,
      width: size.width,
      height: size.height
    });
  }
  fs.writeFileSync(path.join(root, "data", "hub-photo-credits.json"), JSON.stringify(credits, null, 2));
  return Object.fromEntries(credits.map((photo) => [photo.id, photo]));
}

export async function materializeEntryPhoto(siteId, photo) {
  if (!photo?.src) return null;
  const destDir = path.join(root, "assets", "photos", "sisters", siteId);
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, `${photo.slug}.jpg`);
  const remote = absolutePhotoUrl(photo.src);
  if (!remote) return null;
  await downloadOptimized(remote, dest, 900);
  const size = imageSize(dest);
  return {
    ...photo,
    local: `assets/photos/sisters/${siteId}/${photo.slug}.jpg`,
    width: size.width,
    height: size.height
  };
}

function absolutePhotoUrl(src) {
  if (src.startsWith("https://")) return src;
  return "";
}

export function sisterPhotoUrl(source, src) {
  if (!src) return "";
  if (src.startsWith("https://")) return src;
  const clean = String(src).replace(/^\//, "");
  return `https://raw.githubusercontent.com/${source.repo}/main/${clean}`;
}

async function commonsInfo(title) {
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime",
    iiurlwidth: "1600",
    format: "json"
  });
  const body = await getJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const page = Object.values(body.query.pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata || {};
  const license = textOf(meta.LicenseShortName) || textOf(meta.UsageTerms);
  return {
    license,
    licenseUrl: textOf(meta.LicenseUrl),
    artist: stripHtml(textOf(meta.Artist)),
    url: info.url,
    thumbUrl: info.thumburl || info.url,
    page: `https://commons.wikimedia.org/wiki/${title.replace(/ /g, "_")}`
  };
}

function textOf(field) {
  return String(field?.value || "").trim();
}

function stripHtml(value) {
  const text = String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.replace(/\b(\S+)(?:\s+\1\b)+/gi, "$1");
}

async function getJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

import { spawnSync } from "node:child_process";

const OPTIMIZE_PY = `
import sys
from PIL import Image
src, dest, max_width = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src)
im = im.convert("RGB")
if im.width > max_width:
    height = round(im.height * (max_width / im.width))
    im = im.resize((max_width, height), Image.Resampling.LANCZOS)
im.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
`;

async function downloadOptimized(url, dest, maxWidth) {
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const tmp = `${dest}.src`;
  fs.writeFileSync(tmp, bytes);
  const result = spawnSync("python3", ["-c", OPTIMIZE_PY, tmp, dest, String(maxWidth)], { encoding: "utf8" });
  fs.rmSync(tmp, { force: true });
  if (result.status !== 0) throw new Error(result.stderr || "Could not optimize photograph");
}

function imageSize(file) {
  const result = spawnSync("python3", ["-c", "import sys; from PIL import Image; im=Image.open(sys.argv[1]); print(im.size[0], im.size[1])", file], { encoding: "utf8" });
  const [width, height] = String(result.stdout || "0 0").trim().split(/\s+/).map(Number);
  return { width: width || 0, height: height || 0 };
}
