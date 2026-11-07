import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SISTERS } from "../data/sisters.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = path.join(root, "data", "cache");

const VEHICLE_LABELS = {
  balloon: "Hot air balloon",
  plane: "Plane",
  train: "Train",
  boat: "Boat"
};

const SETTLEMENT_RE = /\b(settlers?|enslaved|immigration|migration|migrated|puritans?|scots-irish|colonists?|colonial)\b/i;

const KNOWN_FILES = [
  "data/index.json",
  "data/catalog.json",
  "data/journeys.js",
  "data/flagship-books.js",
  "data/books.js",
  "data/shop.js"
];

export async function loadSisters() {
  fs.mkdirSync(cacheDir, { recursive: true });
  const sites = [];
  for (const source of SISTERS) {
    sites.push(await loadOne(source));
  }
  return sites;
}

async function loadOne(source) {
  const cachePath = path.join(cacheDir, `${source.id}.json`);
  try {
    const site = await fetchSite(source);
    fs.writeFileSync(cachePath, JSON.stringify(site, null, 2));
    return site;
  } catch (error) {
    if (fs.existsSync(cachePath)) {
      const cached = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      cached.stale = true;
      cached.staleReason = `Showing the last successful read because a fresh fetch failed (${error.message}).`;
      return cached;
    }
    if (source.id === "sauces") {
      throw new Error(`Flying Sauces catalog could not be read (${error.message}).`);
    }
    return comingSoon(source, "The public catalog could not be read, and there is no earlier copy.");
  }
}

function comingSoon(source, reason) {
  return {
    ...publicSource(source),
    status: "coming-soon",
    reason,
    fetchedAt: new Date().toISOString(),
    stale: false,
    files: [],
    count: 0,
    items: [],
    journeys: [],
    books: [],
    passages: [],
    shop: null
  };
}

function publicSource(source) {
  return {
    id: source.id,
    name: source.name,
    subject: source.subject,
    dek: source.dek,
    pages: source.pages,
    repo: source.repo,
    repoUrl: source.repoUrl
  };
}

async function fetchSite(source) {
  const files = await listDataFiles(source);
  const texts = new Map();
  for (const file of files) {
    try {
      texts.set(file, await getText(rawUrl(source, file)));
    } catch {
      // A listed file can 404 if the tree and the branch disagree. Skip it.
    }
  }
  if (!texts.size) {
    for (const file of KNOWN_FILES) {
      const fromRepo = await tryText(rawUrl(source, file));
      const fromPages = fromRepo || await tryText(new URL(file, source.pages).href);
      if (fromPages) texts.set(file, fromPages);
    }
  }
  if (!texts.size) {
    return comingSoon(source, `${source.name} has not published a field-guide catalog yet. This section fills in on the next rebuild after it does.`);
  }

  const indexText = texts.get("data/index.json") || texts.get("data/catalog.json") || "";
  const items = indexText ? itemsFromIndex(indexText, source) : [];
  attachCoordinates(items, texts);
  const bySlug = new Map(items.map((item) => [item.slug, item]));

  const journeyMod = texts.has("data/journeys.js") ? loadExports(texts.get("data/journeys.js"), ["JOURNEYS", "VEHICLES"]) : {};
  const flagshipMod = texts.has("data/flagship-books.js") ? loadExports(texts.get("data/flagship-books.js"), ["FLAGSHIP_BOOKS"]) : {};
  const booksMod = texts.has("data/books.js") ? loadExports(texts.get("data/books.js"), ["BOOKS"]) : {};
  const shopMod = texts.has("data/shop.js") ? loadExports(texts.get("data/shop.js"), ["SHOP"]) : {};

  const labels = { ...VEHICLE_LABELS, ...(journeyMod.VEHICLES || {}) };
  const shop = shopMod.SHOP || null;
  const seenBooks = new Set();
  const books = [];
  for (const raw of [...(flagshipMod.FLAGSHIP_BOOKS || []), ...(booksMod.BOOKS || [])]) {
    const book = normalizeBook(raw, source, bySlug, shop);
    if (!book || seenBooks.has(book.slug)) continue;
    seenBooks.add(book.slug);
    books.push(book);
  }
  const booksBySlug = new Map(books.map((book) => [book.slug, book]));
  const journeys = [];
  for (const raw of journeyMod.JOURNEYS || []) {
    const journey = normalizeJourney(raw, source, bySlug, labels, booksBySlug);
    if (journey) journeys.push(journey);
  }
  const passages = collectPassages(source, books, bySlug, texts);

  const live = items.length > 0 || journeys.length > 0 || books.length > 0;
  if (!live) {
    return comingSoon(source, `${source.name} published data files, and they did not contain entries, journeys, or books.`);
  }

  return {
    ...publicSource(source),
    status: "live",
    reason: "",
    fetchedAt: new Date().toISOString(),
    stale: false,
    files: [...texts.keys()].sort(),
    count: items.length,
    items,
    journeys,
    books,
    passages,
    shop: shop ? {
      openingSoon: shop.openingSoon !== false,
      pricesAreFinal: shop.pricesAreFinal === true,
      boxSetDiscount: Number(shop.boxSetDiscount ?? 0.3),
      defaultPrice: shop.defaultPrice ?? null
    } : null
  };
}

async function listDataFiles(source) {
  try {
    const response = await fetch(`https://api.github.com/repos/${source.repo}/git/trees/main?recursive=1`, {
      headers: {
        "User-Agent": "flying-kitchen-build",
        Accept: "application/vnd.github+json"
      }
    });
    if (!response.ok) return [];
    const body = await response.json();
    return (body.tree || [])
      .filter((item) => item.type === "blob")
      .filter((item) => item.path.startsWith("data/") && /\.(json|js|mjs)$/.test(item.path))
      .filter((item) => !item.size || item.size < 900000)
      .map((item) => item.path);
  } catch {
    return [];
  }
}

function rawUrl(source, file) {
  return `https://raw.githubusercontent.com/${source.repo}/main/${file}`;
}

async function getText(url) {
  const response = await fetch(url, { headers: { "User-Agent": "flying-kitchen-build" } });
  if (!response.ok) {
    const error = new Error(`${response.status} ${url}`);
    error.status = response.status;
    throw error;
  }
  return response.text();
}

async function tryText(url) {
  try {
    return await getText(url);
  } catch {
    return "";
  }
}

function loadExports(source, names) {
  const cleaned = source
    .replace(/^\s*import[\s\S]*?;\s*$/gm, "")
    .replace(/export\s+const\s+/g, "const ")
    .replace(/export\s+function\s+/g, "function ")
    .replace(/export\s+\{[^}]*\};?/g, "");
  const body = `${cleaned}\nreturn { ${names.map((name) => `${name}: (typeof ${name} === "undefined" ? undefined : ${name})`).join(", ")} };`;
  return new Function(body)();
}

function itemsFromIndex(text, source) {
  const json = JSON.parse(text);
  let list = [];
  if (Array.isArray(json)) list = json;
  else {
    const keys = ["items", "recipes", "sauces", "pancakes", "bbq", "entries", "catalog"];
    for (const key of keys) {
      if (Array.isArray(json[key])) {
        list = json[key];
        break;
      }
    }
    if (!list.length) {
      for (const value of Object.values(json)) {
        if (Array.isArray(value) && value.some((item) => item && item.slug && (item.name || item.title))) {
          list = value;
          break;
        }
      }
    }
  }
  const items = [];
  const seen = new Set();
  for (const raw of list) {
    const item = normalizeItem(raw, source);
    if (!item || seen.has(item.slug)) continue;
    seen.add(item.slug);
    items.push(item);
  }
  return items;
}

function normalizeItem(raw, source) {
  const slug = String(raw?.slug || "").trim();
  const name = String(raw?.name || raw?.title || "").trim();
  if (!slug || !name) return null;
  return {
    slug,
    name,
    country: String(raw.country || ""),
    countryCode: String(raw.countryCode || ""),
    region: String(raw.region || ""),
    flavor: String(raw.flavor || raw.dek || ""),
    baseType: String(raw.baseType || ""),
    heat: String(raw.heat || ""),
    uses: Array.isArray(raw.uses) ? raw.uses.map(String) : [],
    diets: Array.isArray(raw.diets) ? raw.diets.map(String) : [],
    url: itemUrl(raw, source, slug)
  };
}

function itemUrl(raw, source, slug) {
  const given = String(raw.url || raw.href || "");
  if (given.startsWith("https://")) return given;
  if (given.startsWith("/")) return new URL(given.slice(1), source.pages).href;
  return new URL(`${source.entryFolder}/${slug}/`, source.pages).href;
}

function normalizeBook(raw, source, bySlug, shop) {
  if (!raw?.slug || !raw?.title) return null;
  let members = [];
  if (Array.isArray(raw.slugs)) {
    members = raw.slugs.map((slug) => bySlug.get(slug)).filter(Boolean);
  } else if (typeof raw.match === "function" && bySlug.size) {
    members = [...bySlug.values()].filter((item) => {
      try {
        return Boolean(raw.match(item));
      } catch {
        return false;
      }
    });
  }
  const price = bookPrice(shop, raw.slug);
  return {
    slug: String(raw.slug),
    title: String(raw.title),
    dek: String(raw.dek || ""),
    tier: String(raw.tier || "booklet"),
    vehicle: String(raw.vehicle || ""),
    intro: Array.isArray(raw.intro) ? raw.intro.filter((part) => typeof part === "string") : [],
    route: cleanRoute(raw.route),
    members: members.map(compactItem),
    url: new URL(`${source.bookFolder}/${raw.slug}/`, source.pages).href,
    price
  };
}

function bookPrice(shop, slug) {
  if (!shop) return null;
  if (shop.prices && shop.prices[slug] != null && shop.prices[slug] !== "") return String(shop.prices[slug]);
  if (shop.defaultPrice != null && shop.defaultPrice !== "") return String(shop.defaultPrice);
  return null;
}

function normalizeJourney(raw, source, bySlug, labels, booksBySlug) {
  if (!raw?.slug || !raw?.title) return null;
  const fullStops = (raw.stops || []).map((slug) => bySlug.get(slug)).filter(Boolean);
  if (!fullStops.length) return null;
  const explicit = cleanRoute(raw.route);
  const route = explicit.length
    ? explicit
    : fullStops
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
      .map((item) => [item.lat, item.lng]);
  const stops = fullStops.map(compactItem);
  const book = booksBySlug.get(raw.slug);
  return {
    slug: String(raw.slug),
    title: String(raw.title),
    vehicle: String(raw.vehicle || ""),
    vehicleLabel: labels[raw.vehicle] || String(raw.vehicle || ""),
    dek: String(raw.dek || ""),
    intro: Array.isArray(raw.intro) ? raw.intro.filter((part) => typeof part === "string") : [],
    stops,
    route,
    outbound: book?.url || stops[0].url
  };
}

function attachCoordinates(items, texts) {
  const coords = new Map();
  const point = /lat:\s*(-?\d+(?:\.\d+)?)\s*,\s*lng:\s*(-?\d+(?:\.\d+)?)/g;
  for (const [file, sourceText] of texts) {
    if (!file.endsWith(".js")) continue;
    let match;
    while ((match = point.exec(sourceText))) {
      const before = sourceText.slice(Math.max(0, match.index - 900), match.index);
      const slug = [...before.matchAll(/slug:\s*"([^"]+)"/g)].pop()?.[1];
      if (!slug || coords.has(slug)) continue;
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) coords.set(slug, { lat, lng });
    }
    point.lastIndex = 0;
  }
  for (const item of items) {
    const found = coords.get(item.slug);
    if (!found) continue;
    item.lat = found.lat;
    item.lng = found.lng;
  }
}

function compactItem(item) {
  return {
    slug: item.slug,
    name: item.name,
    country: item.country,
    region: item.region,
    flavor: item.flavor,
    url: item.url
  };
}

function cleanRoute(route) {
  if (!Array.isArray(route)) return [];
  return route.filter((pair) => Array.isArray(pair) && Number.isFinite(Number(pair[0])) && Number.isFinite(Number(pair[1])))
    .map((pair) => [Number(pair[0]), Number(pair[1])]);
}

function collectPassages(source, books, bySlug, texts) {
  const passages = [];
  for (const book of books) {
    for (const text of book.intro) {
      if (!SETTLEMENT_RE.test(text)) continue;
      passages.push({
        site: source.id,
        siteName: source.name,
        title: book.title,
        url: book.url,
        text,
        label: "From the book",
        sourceFile: "data/flagship-books.js"
      });
    }
  }
  const field = /(?:history|whyItTastes):\s*"((?:\\.|[^"\\])*)"/g;
  const facts = /funFacts:\s*\[([\s\S]*?)\]/g;
  for (const [file, sourceText] of texts) {
    if (!file.endsWith(".js")) continue;
    const found = [];
    let match;
    const finder = new RegExp(field);
    while ((match = finder.exec(sourceText))) found.push([match.index, match[1]]);
    const factFinder = new RegExp(facts);
    while ((match = factFinder.exec(sourceText))) {
      const bits = match[1].match(/"((?:\\.|[^"\\])*)"/g) || [];
      for (const bit of bits) found.push([match.index, bit.slice(1, -1)]);
    }
    for (const [index, raw] of found) {
      let text = "";
      try {
        text = JSON.parse(`"${raw}"`);
      } catch {
        continue;
      }
      if (!SETTLEMENT_RE.test(text) || text.length < 40) continue;
      const before = sourceText.slice(Math.max(0, index - 1200), index);
      const slug = [...before.matchAll(/slug:\s*"([^"]+)"/g)].pop()?.[1] || "";
      const item = bySlug.get(slug);
      if (!item) continue;
      passages.push({
        site: source.id,
        siteName: source.name,
        title: item.name,
        url: item.url,
        text,
        label: "From the field guide",
        sourceFile: file
      });
    }
  }
  const seen = new Set();
  return passages.filter((passage) => {
    const key = passage.text;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
