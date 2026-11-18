import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SITE_ORIGIN, BASE_PATH, GA_MEASUREMENT_ID, ADS, HELLO_EMAIL } from "../site.config.mjs";
import { escapeHtml, safeJsonLd } from "../assets/js/lib/escape.js";
import { traditions, recipes, products } from "../content/kite.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const photos = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(root, "data/kite-photos.json"), "utf8")).map((p) => [p.id, p]));
const recipeBySlug = Object.fromEntries(recipes.map((r) => [r.slug, r]));
const traditionBySlug = Object.fromEntries(traditions.map((t) => [t.slug, t]));

function write(rel, contents) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function photo(id) {
  const item = photos[id];
  if (!item) throw new Error(`Missing photo ${id}`);
  return item;
}

function figure(id, alt, note, cls = "kk-photo") {
  const item = photo(id);
  const src = `/${item.file800}`;
  return `<figure class="${cls}">
      <img src="${src}" srcset="${src} 800w, /${item.file1600} 1600w" sizes="(min-width: 900px) 70vw, 100vw" alt="${escapeHtml(alt)}" width="${item.width}" height="${item.height}"${cls === "kk-hero-photo" ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">
      <figcaption>${escapeHtml(note)} Photograph by ${escapeHtml(item.artist.replace(/\s*\(talk\)/, ""))}. ${escapeHtml(item.license)}. <a href="${escapeHtml(item.licenseUrl || item.sourceUrl)}">License</a>. <a href="${escapeHtml(item.sourceUrl)}">Wikimedia Commons</a>.</figcaption>
    </figure>`;
}

function ad(slot, kind) {
  const side = kind === "sidebar";
  return `<aside class="kk-ad${side ? " kk-ad-sidebar" : " kk-ad-inline"}" data-ad-slot="${slot}" aria-label="Advertisement">
      <p class="kk-ad-label">Advertisement</p>
      <div class="kk-ad-frame">
        <p class="kk-house-kicker">From Kite Kitchen</p>
        <p><a href="/shop/">The shop is coming soon</a>. <a href="mailto:${HELLO_EMAIL}?subject=KiteKitchen%20shop">Ask for a note</a> when Jonathan approves it.</p>
      </div>
    </aside>`;
}

const consent = `<div id="kk-consent" class="kk-consent no-print" role="dialog" aria-labelledby="kk-consent-title" hidden>
    <p id="kk-consent-title"><strong>Cookies.</strong> Kite Kitchen uses Google Analytics only after a choice where a choice is required. In the EEA, the UK, and Switzerland, analytics cookies stay off until you accept. Advertising cookies stay off until you accept, and no ad network is loaded while ads are turned off. <a href="/privacy/">Privacy</a></p>
    <div class="kk-row">
      <button type="button" class="kk-button" data-consent="granted">Accept</button>
      <button type="button" class="kk-button quiet" data-consent="denied">Reject</button>
    </div>
  </div>`;

function headBits(title, description, url, jsonLd, robots) {
  const ld = jsonLd ? `<script type="application/ld+json">${safeJsonLd(jsonLd)}</script>` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#141210">
  ${robots ? `<meta name="robots" content="${escapeHtml(robots)}">` : ""}
  <link rel="canonical" href="${escapeHtml(url)}">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/assets/brand/icon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/brand/apple-touch.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="KiteKitchen">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:image" content="${SITE_ORIGIN}/assets/brand/og.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${SITE_ORIGIN}/assets/brand/og.webp">
  <link rel="stylesheet" href="/assets/css/kite.css">
  ${ld}
</head>`;
}

const NAV = [
  ["/recipes/", "Recipes", "recipes"],
  ["/map/", "World Map", "map"],
  ["/flying-sauces/", "Flying Sauces", "sauces"],
  ["/flying-pancakes/", "Flying Pancakes", "pancakes"],
  ["/flying-bbq/", "Flying BBQ", "bbq"],
  ["/shop/", "Shop", "shop"],
  ["/about/", "About", "about"]
];
const TAGLINE = "Flying around the world, one simple recipe at a time";

function nav(current, cls) {
  return `<nav class="${cls}" aria-label="Primary">${NAV.map(([href, label, id]) => `<a href="${href}"${id === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
}

function header(current) {
  return `<a class="skip-link" href="#content">Skip to content</a>
<header class="kk-header">
  <div class="kk-header-inner">
    <a class="kk-brand" href="/">
      <img src="/assets/brand/kite-mark-128.webp" alt="" width="28" height="28">
      <span class="kk-brand-text"><span class="kk-word">Kite Kitchen</span><span class="kk-tag">${TAGLINE}</span></span>
    </a>
    ${nav(current, "kk-nav")}
    <details class="kk-menu">
      <summary>Menu</summary>
      ${nav(current, "kk-nav")}
    </details>
  </div>
</header>`;
}

function footer() {
  return `<footer class="kk-footer">
    <div class="kk-wrap">
      <p class="kk-word">Kite Kitchen</p>
      <nav aria-label="Footer">
        <a href="/recipes/">Recipes</a>
        <a href="/flying-sauces/">Flying Sauces</a>
        <a href="/flying-pancakes/">Flying Pancakes</a>
        <a href="/flying-bbq/">Flying BBQ</a>
        <a href="/map/">World Map</a>
        <a href="/shop/">Shop</a>
        <a href="/about/">About</a>
        <a href="/credits/">Credits</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
        <button type="button" class="quiet" data-consent-open>Cookie choices</button>
      </nav>
      <p class="kk-fine">Home cooking, not professional advice. The shop is coming soon, and no prices are listed.</p>
    </div>
  </footer>
  ${consent}
  <script src="/config.js"></script>
  <script src="/assets/js/consent.js" defer></script>`;
}

function page({ title, description, path: pagePath, main, jsonLd, current = "", robots = "" }) {
  const url = `${SITE_ORIGIN}${pagePath}`;
  return `${headBits(title, description, url, jsonLd, robots)}
<body>
  ${header(current)}
  <main id="content" tabindex="-1">
    ${main}
  </main>
  ${footer()}
</body>
</html>
`;
}

function orgLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KiteKitchen",
    url: `${SITE_ORIGIN}/`,
    logo: `${SITE_ORIGIN}/assets/brand/logo-480.png`,
    email: HELLO_EMAIL,
    founder: { "@type": "Person", name: "Jonathan Davis" }
  };
}

function dirs(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((name) => fs.existsSync(path.join(full, name, "index.html"))).sort();
}

function textOf(html, re) {
  const match = html.match(re);
  return match ? match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";
}

function ensureSisters() {
  for (const id of ["flying-sauces", "flying-pancakes", "flying-bbq"]) {
    if (fs.existsSync(path.join(root, id, "index.html"))) continue;
    const src = path.join("/tmp/sisters", id);
    if (!fs.existsSync(src)) throw new Error(`Missing ${src}. Clone jonldavis-coder/${id} before building.`);
    cpSync(src, path.join(root, id), {
        recursive: true,
        filter: (source) => !source.split(path.sep).some((part) => [".git", "node_modules", "test", "scripts", "supabase"].includes(part))
      });
  }
}

function sectionBar(name, currentHref) {
  return `<div class="kk-bar" id="kk-bar">
    <a class="kk-brand" href="/"><img src="/assets/brand/kite-mark-128.webp" alt="" width="28" height="28"><span class="kk-brand-text"><span class="kk-word">Kite Kitchen</span><span class="kk-tag">${TAGLINE}</span></span></a>
    <p class="kk-section-name">${escapeHtml(name)}</p>
    <nav aria-label="KiteKitchen">${NAV.map(([href, label]) => `<a href="${href}"${href === currentHref ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
  </div>`;
}

function transformSection(dir, name, originFrom) {
  const originTo = `${SITE_ORIGIN}/${dir}/`;
  const files = [];
  function walk(rel) {
    for (const entry of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const next = path.join(rel, entry.name);
      if (entry.isDirectory()) walk(next);
      else if (entry.name.endsWith(".html")) files.push(next);
      else if (entry.name.endsWith(".js")) {
        const file = path.join(root, next);
        let text = fs.readFileSync(file, "utf8");
        const nextText = text
          .replaceAll(originFrom, originTo.replace(/\/$/, ""))
          .replaceAll("https://jonldavis-coder.github.io", SITE_ORIGIN)
          .replace(/"pricePlaceholder":\s*"[^"]*"/g, '"pricePlaceholder": ""')
          .replace(/price:\s*\d+(?:\.\d+)?/g, "price: null");
        if (nextText !== text) fs.writeFileSync(file, nextText);
      }
    }
  }
  walk(dir);
  for (const rel of files) {
    let html = fs.readFileSync(path.join(root, rel), "utf8");
    const bar = sectionBar(name, `/${dir}/`);
    if (html.includes('id="kk-bar"')) {
      html = html.replace(/<div class="kk-bar" id="kk-bar">[\s\S]*?<\/div>/, bar);
    } else {
      html = html.replace(/<body([^>]*)>/, `<body$1>\n${bar}`);
    }
    if (!html.includes("/assets/css/kite.css")) {
      html = html.replace(/<\/head>/, `  <link rel="stylesheet" href="/assets/css/kite.css">\n</head>`);
    }
    html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/g, "");
    html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*/g, "");
    html = html.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*">\s*/g, "");
    html = html.replace(/\s*<link rel="icon"[^>]*>/g, "");
    html = html.replace(/\s*<link rel="apple-touch-icon"[^>]*>/g, "");
    if (!html.includes('href="/favicon.ico"')) {
      html = html.replace(/<\/head>/, `  <link rel="icon" href="/favicon.ico" sizes="any">\n  <link rel="icon" href="/assets/brand/icon-192.png" type="image/png">\n</head>`);
    }
    html = html.replace(/<meta name="theme-color" content="[^"]*">/, '<meta name="theme-color" content="#141210">');
    html = html.replaceAll(originFrom, originTo);
    html = html.replace(/<title>([^<]*)<\/title>/, (m, t) => t.includes("KiteKitchen") ? m : `<title>${t} · KiteKitchen</title>`);
    html = html.replace(/<p class="price">[\s\S]*?<\/p>/g, "");
    html = html.replace(/<p class="eyebrow">Placeholder price[^<]*<\/p>/g, "");
    html = html.replace(/ · Placeholder price \$[\d,.]+, not final/g, "");
    html = html.replace(/Placeholder price \$[\d,.]+, not final/g, "Coming soon");
    html = html.replace(/Prices are placeholders, not final\./g, "Coming soon. Prices are not listed.");
    html = html.replace(/Placeholder prices, not final\./g, "Coming soon. No price is listed.");
    html = html.replace(/Save 30%/g, "Coming soon");
    html = html.replace(/The price is 30% off the sum of the individual placeholder prices\./g, "Coming soon. No price is listed.");
    html = html.replace(/The discount is 30% off the sum of the individual placeholder prices\. It is computed from those prices, not typed in as a separate amount\./g, "Coming soon. No price or discount is listed.");
    html = html.replace(/<p[^>]*>[^<]*30%[^<]*<\/p>/g, "<p>This set is not for sale on KiteKitchen, and no price or discount is listed.</p>");
    html = html.replace(/href="privacy\/"/g, 'href="/privacy/"');
    html = html.replace(/href="terms\/"/g, 'href="/terms/"');
    html = html.replace(/href="affiliate\/"/g, 'href="/affiliate/"');
    html = html.replace(/href="guidelines\/"/g, 'href="/guidelines/"');
    if (/data-page="(sauce|pancake|dish)"/.test(html) && !html.includes("kk-origin")) {
      const iso = (html.match(/country=([A-Z]{2})/) || [])[1];
      const countryName = textOf(html, /<dt>Country<\/dt>\s*<dd>([^<]+)/);
      const place = iso && byIso[iso];
      if (countryName && place) {
        html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, (m) => `${m}\n${originMarkup(countryName, place.lat, place.lon)}`);
      }
    }
    if (!html.includes('data-ad-slot="after-intro"') && !html.includes('data-ad-slot="section-slot"')) {
      if (/data-page="(sauce|pancake|dish)"/.test(html)) {
        html = html.replace(/<p class="dek">[\s\S]*?<\/p>/, (m) => `${m}\n${ad("after-intro", "inline")}`);
        html = html.replace(/<aside class="ad-slot"[\s\S]*?<\/aside>/, ad("before-recipe", "inline"));
        html = html.replace(/<aside class="rail">/, `${ad("sidebar", "sidebar")}\n<aside class="rail">`);
      } else if (html.includes('class="ad-slot"')) {
        html = html.replace(/<aside class="ad-slot"[\s\S]*?<\/aside>/, ad("section-slot", "inline"));
      }
    }
    html = html.replace(/<aside class="ad-slot"[\s\S]*?<\/aside>/g, "");
    if (!html.includes('id="kk-consent"')) {
      html = html.replace(/<\/body>/, `${consent}\n<script src="/config.js"></script>\n<script src="/assets/js/consent.js" defer></script>\n</body>`);
    }
    if (!html.includes("kk-partof")) {
      html = html.replace(/<\/footer>/, `<p class="kk-partof">${escapeHtml(name)} is a section of <a href="/">Kite Kitchen</a>.</p></footer>`);
    }
    fs.writeFileSync(path.join(root, rel), html);
  }
}

function cleanOld() {
  for (const rel of ["notes", "journeys", "bbq", "sauces", "pancakes", "shop", "books", "map", "search", "settled", "about", "credits", "privacy", "terms", "affiliate", "guidelines", "sources", "friends", "recipes", "traditions", "advertise"]) {
    fs.rmSync(path.join(root, rel), { recursive: true, force: true });
  }
  for (const rel of ["index.html", "404.html", "login.html", "submit.html", "moderate.html", "sitemap.xml", "robots.txt"]) {
    fs.rmSync(path.join(root, rel), { force: true });
  }
}

function productSvg(title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 640" role="img">
  <rect width="800" height="640" fill="#f4ead6"/>
  <rect x="48" y="48" width="704" height="544" rx="28" fill="#141210"/>
  <path d="M400 120 L470 210 L400 280 L330 210 Z" fill="#e4c27a"/>
  <path d="M400 150 L450 210 L400 255 L350 210 Z" fill="#141210"/>
  <text x="400" y="360" text-anchor="middle" fill="#e4c27a" font-family="Georgia, serif" font-size="36">${escapeHtml(title)}</text>
  <text x="400" y="410" text-anchor="middle" fill="#f6e7b8" font-family="Georgia, serif" font-size="20">Original mockup · not a product photo</text>
</svg>`;
}

function prosePage(title, description, pagePath, body, current = "") {
  write(`${pagePath.replace(/^\//, "").replace(/\/$/, "")}/index.html`.replace(/^\/index.html$/, "index.html").replace(/^\//, ""), page({
    title, description, path: pagePath, current, main: `<article class="kk-wrap">${body}</article>`
  }));
}

function loadCountries() {
  const file = path.join(root, "flying-sauces/assets/maps/countries.geojson");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const countries = [];
  for (const feature of data.features) {
    const iso = feature.properties.iso;
    const name = feature.properties.name;
    if (!iso || !feature.geometry) continue;
    const polys = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    let best = null;
    const rings = [];
    for (const poly of polys) {
      const ring = poly[0];
      if (!ring || ring.length < 4) continue;
      rings.push(ring);
      if (!best || ring.length > best.length) best = ring;
    }
    if (!best) continue;
    let lon = 0;
    let lat = 0;
    for (const pt of best) { lon += pt[0]; lat += pt[1]; }
    countries.push({ iso, name, rings, lon: lon / best.length, lat: lat / best.length });
  }
  return countries;
}

function ringPath(ring, w, h) {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const x = ((ring[i][0] + 180) / 360) * w;
    const y = ((90 - ring[i][1]) / 180) * h;
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

function worldSvg(countries, w, h, hrefFor) {
  const lines = [];
  for (let lon = -150; lon <= 150; lon += 30) {
    const x = ((lon + 180) / 360) * w;
    lines.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${h}"/>`);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * h;
    lines.push(`<line x1="0" y1="${y.toFixed(1)}" x2="${w}" y2="${y.toFixed(1)}"/>`);
  }
  const lands = countries.map((country) => {
    const d = country.rings.map((ring) => ringPath(ring, w, h)).join("");
    const cls = country.count ? "has" : "";
    const title = `<title>${escapeHtml(country.name)}</title>`;
    const pathEl = `<path class="${cls}" d="${d}">${title}</path>`;
    return country.count ? `<a href="${hrefFor(country.iso)}">${pathEl}</a>` : pathEl;
  }).join("");
  return `<svg class="kk-map" viewBox="0 0 ${w} ${h}" role="img" aria-label="World map. Countries with recipes can be opened.">
    <rect class="kk-map-ocean" width="${w}" height="${h}"/>
    <g class="kk-graticule">${lines.join("")}</g>
    <g class="kk-lands">${lands}</g>
  </svg>`;
}

function originMarkup(countryName, lat, lon) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  const label = `${Math.abs(Math.round(lat))}° ${ns}, ${Math.abs(Math.round(lon))}° ${ew}`;
  const x = ((lon + 180) / 360) * 80;
  const y = ((90 - lat) / 180) * 40;
  return `<p class="kk-origin"><svg class="kk-locator" viewBox="0 0 80 40" width="80" height="40" aria-hidden="true"><rect width="80" height="40" fill="none" stroke="#c6a15b" stroke-width="0.8"/><path d="M0 20 H80 M40 0 V40" stroke="#e4ddd2" stroke-width="0.5"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="#1a1a1a"/></svg> <span>Origin: ${escapeHtml(countryName)} · ${label}</span></p>`;
}

function writeMoved(rel, target) {
  const absolute = `${SITE_ORIGIN}${target}`;
  write(rel, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page moved · Kite Kitchen</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${escapeHtml(absolute.split("#")[0])}">
  <meta http-equiv="refresh" content="0; url=${escapeHtml(target)}">
  <link rel="icon" href="/favicon.ico">
</head>
<body>
  <p>This page has moved. <a href="${escapeHtml(target)}">Continue</a>.</p>
</body>
</html>
`);
}

let byIso = {};

ensureSisters();
byIso = Object.fromEntries(loadCountries().map((country) => [country.iso, country]));
transformSection("flying-sauces", "Flying Sauces", "https://jonldavis-coder.github.io/flying-sauces/");
transformSection("flying-pancakes", "Flying Pancakes", "https://jonldavis-coder.github.io/flying-pancakes/");
transformSection("flying-bbq", "Flying BBQ", "https://jonldavis-coder.github.io/flying-bbq/");
cleanOld();

const sauceCount = dirs("flying-sauces/sauces").length;
const pancakeCount = dirs("flying-pancakes/pancakes").length;
const bbqCount = dirs("flying-bbq/dishes").length;
const sauceBooks = dirs("flying-sauces/books").map((slug) => ({
  slug,
  title: textOf(fs.readFileSync(path.join(root, "flying-sauces/books", slug, "index.html"), "utf8"), /<h1[^>]*>([\s\S]*?)<\/h1>/) || slug,
  href: `/flying-sauces/books/${slug}/`,
  section: "Flying Sauces"
}));
const pancakeBooks = dirs("flying-pancakes/books").map((slug) => ({
  slug,
  title: textOf(fs.readFileSync(path.join(root, "flying-pancakes/books", slug, "index.html"), "utf8"), /<h1[^>]*>([\s\S]*?)<\/h1>/) || slug,
  href: `/flying-pancakes/books/${slug}/`,
  section: "Flying Pancakes"
}));
const bbqBooks = dirs("flying-bbq/books").map((slug) => ({
  slug,
  title: textOf(fs.readFileSync(path.join(root, "flying-bbq/books", slug, "index.html"), "utf8"), /<h1[^>]*>([\s\S]*?)<\/h1>/) || slug,
  href: `/flying-bbq/books/${slug}/`,
  section: "Flying BBQ"
}));
const guideBooks = sauceBooks.concat(pancakeBooks, bbqBooks);

write("config.js", `// Generated from site.config.mjs. Change SITE_ORIGIN there, then rebuild.
window.KITE_KITCHEN = ${JSON.stringify({
  SITE_ORIGIN,
  BASE_PATH,
  GA_MEASUREMENT_ID,
  ADS,
  HELLO_EMAIL
}, null, 2)};
`);

write("ads.txt", `# KiteKitchen ads.txt placeholder.
# Ads are disabled. There is no AdSense publisher ID in this file.
# After AdSense approves kitekitchen.com, replace this comment with the
# single line Google gives you. Do not invent a pub- ID.
`);

write("CNAME", "kitekitchen.com");

write("site.webmanifest", JSON.stringify({
  name: "KiteKitchen",
  short_name: "KiteKitchen",
  start_url: "/",
  display: "standalone",
  background_color: "#141210",
  theme_color: "#141210",
  icons: [
    { src: "/assets/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/assets/brand/icon-512.png", sizes: "512x512", type: "image/png" }
  ]
}, null, 2));

const homeLd = [
  orgLd(),
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KiteKitchen",
    url: `${SITE_ORIGIN}/`,
    description: "Flying around the world, one simple recipe at a time. Sauces, pancakes, and barbecue.",
    publisher: { "@type": "Organization", name: "KiteKitchen", url: `${SITE_ORIGIN}/` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_ORIGIN}/search/?q={query}`,
      "query-input": "required name=query"
    }
  }
];

function entryLink(dir, folder, slug) {
  const file = path.join(root, dir, folder, slug, "index.html");
  if (!fs.existsSync(file)) return "";
  const title = textOf(fs.readFileSync(file, "utf8"), /<h1[^>]*>([\s\S]*?)<\/h1>/) || slug;
  return `<li><a href="/${dir}/${folder}/${slug}/">${escapeHtml(title)}</a></li>`;
}
function collectEntries(dir, folder, section) {
  const items = [];
  for (const slug of dirs(`${dir}/${folder}`)) {
    const html = fs.readFileSync(path.join(root, dir, folder, slug, "index.html"), "utf8");
    const iso = (html.match(/country=([A-Z]{2})/) || [])[1] || "";
    items.push({
      title: textOf(html, /<h1[^>]*>([\s\S]*?)<\/h1>/) || slug,
      href: `/${dir}/${folder}/${slug}/`,
      section,
      iso,
      text: textOf(html, /<p class="dek">([\s\S]*?)<\/p>/)
    });
  }
  return items;
}
const catalog = [
  ...collectEntries("flying-sauces", "sauces", "Flying Sauces"),
  ...collectEntries("flying-pancakes", "pancakes", "Flying Pancakes"),
  ...collectEntries("flying-bbq", "dishes", "Flying BBQ")
];
const byCountry = new Map();
for (const item of catalog) {
  if (!item.iso || !byIso[item.iso]) continue;
  if (!byCountry.has(item.iso)) byCountry.set(item.iso, []);
  byCountry.get(item.iso).push(item);
}
const countries = Object.values(byIso).map((country) => ({ ...country, count: (byCountry.get(country.iso) || []).length }));
const homeMap = worldSvg(countries, 960, 480, (iso) => `/map/#${iso}`);
const atlasMap = worldSvg(countries, 960, 480, (iso) => `#${iso}`);
const saucePicks = ["pesto-alla-genovese", "aioli", "romesco", "mole-poblano"].map((slug) => entryLink("flying-sauces", "sauces", slug)).join("");
const pancakePicks = ["crepes-suzette", "appam", "galette-complete", "aebleskiver"].map((slug) => entryLink("flying-pancakes", "pancakes", slug)).join("");
const bbqPicks = ["argentine-asado", "eastern-nc-whole-hog", "kalua-pig", "jamaican-jerk-chicken"].map((slug) => entryLink("flying-bbq", "dishes", slug)).join("");
const featured = [
  ["flying-sauces", "sauces", "pesto-alla-genovese"],
  ["flying-pancakes", "pancakes", "crepes-suzette"],
  ["flying-bbq", "dishes", "argentine-asado"],
  ["flying-sauces", "sauces", "mole-poblano"],
  ["flying-pancakes", "pancakes", "appam"],
  ["flying-bbq", "dishes", "eastern-nc-whole-hog"]
].map(([dir, folder, slug]) => entryLink(dir, folder, slug)).join("");
const cookbookPicks = guideBooks.filter((book) => /top-100|flagship|american-bbq-belt|crepes-of-france|top 100/i.test(`${book.slug} ${book.title}`)).slice(0, 6);

write("index.html", page({
  title: "Kite Kitchen · Flying around the world recipes",
  description: "Kite Kitchen means flying around the world, one simple recipe at a time. Sauces, pancakes, and barbecue, with a world map.",
  path: "/",
  current: "home",
  jsonLd: homeLd,
  main: `<div class="kk-wrap kk-home">
      <h1>Kite Kitchen</h1>
      <p class="kk-lede">${TAGLINE}.</p>
      <form class="kk-search" action="/search/" method="get">
        <label for="home-q">Search recipes</label>
        <input id="home-q" name="q" type="search" placeholder="Pesto, dosa, asado">
        <button class="kk-button" type="submit">Search</button>
      </form>
      ${ad("home", "inline")}
      <h2>Featured recipes</h2>
      <ul class="kk-recipe-list">${featured}</ul>
      <h2>World map</h2>
      <p class="kk-meta">Countries with recipes are marked. Open one to see what is cooked there.</p>
      <div class="kk-atlas">${homeMap}</div>
      <p class="kk-meta"><a href="/map/">Open the full world map</a></p>
      <h2>Flying Sauces</h2>
      <ul class="kk-recipe-list">${saucePicks}</ul>
      <p class="kk-meta"><a href="/flying-sauces/">All ${sauceCount} Flying Sauces</a></p>
      <h2>Flying Pancakes</h2>
      <ul class="kk-recipe-list">${pancakePicks}</ul>
      <p class="kk-meta"><a href="/flying-pancakes/">All ${pancakeCount} Flying Pancakes</a></p>
      <h2>Flying BBQ</h2>
      <ul class="kk-recipe-list">${bbqPicks}</ul>
      <p class="kk-meta"><a href="/flying-bbq/">All ${bbqCount} Flying BBQ recipes</a></p>
      <h2>Recipe cookbooks</h2>
      <ul class="kk-recipe-list">${cookbookPicks.map((book) => `<li><a href="${book.href}">${escapeHtml(book.title)}</a> <span class="kk-meta">${escapeHtml(book.section)} · Coming soon</span></li>`).join("")}</ul>
      <p class="kk-meta"><a href="/books/">All cookbooks</a></p>
      <p class="kk-shop-strip"><a href="/shop/">Shop</a> is coming soon.</p>
    </div>`
}));

write("recipes/index.html", page({
  title: "Recipes · Kite Kitchen",
  description: "Browse Flying Sauces, Flying Pancakes, and Flying BBQ. Simple recipes from around the world.",
  path: "/recipes/",
  current: "recipes",
  main: `<div class="kk-wrap"><h1>Recipes</h1>
    <p class="kk-lede">${TAGLINE}.</p>
    <form class="kk-search" action="/search/" method="get"><label for="recipes-q">Search recipes</label><input id="recipes-q" name="q" type="search" placeholder="Name or place"><button class="kk-button" type="submit">Search</button></form>
    ${ad("recipes-top", "inline")}
    <h2>Flying Sauces</h2>
    <ul class="kk-recipe-list">${saucePicks}</ul>
    <p><a href="/flying-sauces/">All Flying Sauces</a></p>
    <h2>Flying Pancakes</h2>
    <ul class="kk-recipe-list">${pancakePicks}</ul>
    <p><a href="/flying-pancakes/">All Flying Pancakes</a></p>
    <h2>Flying BBQ</h2>
    <ul class="kk-recipe-list">${bbqPicks}</ul>
    <p><a href="/flying-bbq/">All Flying BBQ</a></p>
    <p class="kk-meta"><a href="/map/">Or start from the world map</a></p>
  </div>`
}));

writeMoved("traditions/index.html", "/map/");
for (const item of traditions) writeMoved(`traditions/${item.slug}/index.html`, "/map/");
for (const recipe of recipes) writeMoved(`recipes/${recipe.slug}/index.html`, "/recipes/");
writeMoved("friends/index.html", "/flying-bbq/");

const shopCards = products.map(([id, title, summary]) => {
  const svg = productSvg(title);
  write(`assets/brand/products/${id}.svg`, svg);
  return { id, title, summary };
});

write("shop/index.html", page({
  title: "Shop · KiteKitchen",
  description: "KiteKitchen utensils, apron, tote, and cookbook, plus Flying Sauces and Flying Pancakes books. Coming soon. No prices and no checkout.",
  path: "/shop/",
  current: "shop",
  main: `<div class="kk-wrap">
      <p class="kk-pill">Coming soon</p>
      <h1>The KiteKitchen shop</h1>
      <p class="kk-lede">These are mockups and book titles. Jonathan Davis has to approve the products and any prices before something is sold. There is no checkout on this site.</p>
      ${ad("shop", "inline")}
      <form class="kk-notify" action="mailto:${HELLO_EMAIL}" method="post" enctype="text/plain">
        <label for="notify">What should the note say?</label>
        <input id="notify" name="note" type="text" value="Please tell me when the KiteKitchen shop opens.">
        <button type="submit">Email ${HELLO_EMAIL}</button>
      </form>
      <p class="kk-note">The form opens your email app. ${HELLO_EMAIL} is a placeholder until Jonathan confirms the mailbox.</p>
      <h2>Kitchen goods</h2>
      <div class="kk-products">${shopCards.map((item) => `<article class="kk-card">
          <img src="/assets/brand/products/${item.id}.svg" alt="Original mockup of the ${escapeHtml(item.title)}, a gold drawing on black, not a photograph of a finished product" width="800" height="640">
          <h3><a href="/shop/${item.id}/">${escapeHtml(item.title)}</a></h3>
          <p>${escapeHtml(item.summary)}</p>
          <p class="kk-pill">Coming soon</p>
        </article>`).join("")}</div>
      <h2 id="books">Books</h2>
      <p>These are the cookbooks from Flying Sauces, Flying Pancakes, and Flying BBQ. Coming soon. No prices are listed.</p>
      <div class="kk-grid">
        ${guideBooks.map((book) => `<article class="kk-card"><p class="kk-kicker">${escapeHtml(book.section)}</p><h3><a href="${book.href}">${escapeHtml(book.title)}</a></h3><p class="kk-pill">Coming soon</p></article>`).join("")}
      </div>
    </div>`
}));

for (const item of shopCards) {
  write(`shop/${item.id}/index.html`, page({
    title: `${item.title} · KiteKitchen shop`,
    description: `${item.title} is a KiteKitchen mockup. Coming soon. No price and no checkout.`,
    path: `/shop/${item.id}/`,
    current: "shop",
    main: `<article class="kk-wrap">
        <p class="kk-pill">Coming soon</p>
        <h1>${escapeHtml(item.title)}</h1>
        <img src="/assets/brand/products/${item.id}.svg" alt="Original mockup of the ${escapeHtml(item.title)}" width="800" height="640">
        <p class="kk-lede">${escapeHtml(item.summary)}</p>
        <p>The picture is an original mockup drawn for this shop. It is not a photograph of a finished product. No price is listed because none has been approved.</p>
        ${ad("product", "inline")}
        <p class="kk-row"><a class="kk-button" href="mailto:${HELLO_EMAIL}?subject=${encodeURIComponent(item.title)}">Email about this item</a><a class="kk-button quiet" href="/shop/">All shop items</a></p>
      </article>`
  }));
}
writeMoved("shop/kite-festival-cookbook/index.html", "/books/");

write("books/index.html", page({
  title: "Books · KiteKitchen",
  description: "Cookbooks from Flying Sauces, Flying Pancakes, and Flying BBQ. Coming soon, with no prices.",
  path: "/books/",
  current: "",
  main: `<div class="kk-wrap"><h1>Recipe cookbooks</h1><p>Titles from Flying Sauces, Flying Pancakes, and Flying BBQ. Coming soon. Nothing here has a price.</p><div class="kk-grid">${guideBooks.map((book) => `<article class="kk-card"><p class="kk-kicker">${escapeHtml(book.section)}</p><h2><a href="${book.href}">${escapeHtml(book.title)}</a></h2><p class="kk-pill">Coming soon</p></article>`).join("")}</div></div>`
}));

const creditItems = Object.values(photos);
write("credits/index.html", page({
  title: "Photo credits · Kite Kitchen",
  description: "Where the photographs on Kite Kitchen are credited.",
  path: "/credits/",
  main: `<div class="kk-wrap"><h1>Photo credits</h1>
    <p>Photographs in the three guides are stored with the pages and credited there.</p>
    <ul class="kk-sources">
      <li><a href="/flying-sauces/credits/">Flying Sauces credits</a></li>
      <li><a href="/flying-pancakes/credits/">Flying Pancakes credits</a></li>
      <li><a href="/flying-bbq/credits/">Flying BBQ credits</a></li>
    </ul>
    <p>The crest and the small compass are original artwork for this site. The crest was supplied by Jonathan Davis.</p>
  </div>`
}));

write("about/index.html", page({
  title: "About · KiteKitchen",
  description: "Kite Kitchen means flying around the world and tasting different foods, one simple recipe at a time.",
  path: "/about/",
  main: `<article class="kk-wrap"><h1>About Kite Kitchen</h1>
    <p>The name Kite Kitchen means flying around the world and tasting different foods. ${TAGLINE}.</p>
    <p>Jonathan Davis publishes three guides here, under their own names: Flying Sauces, Flying Pancakes, and Flying BBQ. The world map is a way to browse those recipes by country.</p>
    <p>The public address is <a href="${SITE_ORIGIN}/">kitekitchen.com</a>. That origin is the <code>SITE_ORIGIN</code> value in <span class="kk-note">site.config.mjs</span>.</p>
    <p>Counts are the number of entries imported from those guides. This site does not add reviews or star ratings.</p>
    <p><a href="mailto:${HELLO_EMAIL}">${HELLO_EMAIL}</a> is the contact address written into the pages. Jonathan still needs to confirm the mailbox.</p>
  </article>`
}));

writeMoved("sources/index.html", "/credits/");

write("advertise/index.html", page({
  title: "Advertise with KiteKitchen",
  description: "A page for brands that want to sponsor Kite Kitchen. No ad network is switched on, and there are no affiliate links yet.",
  path: "/advertise/",
  main: `<article class="kk-wrap"><h1>Advertise</h1>
    <p>Kite Kitchen will take a small number of sponsors. Slots are labeled Advertisement, kept out of ingredient lists and steps, hidden when a recipe is printed, and capped at about three a page.</p>
    <p>Google AdSense is not connected. The ads config ships with <code>enabled: false</code> and an empty publisher ID. A certified consent platform is required before personalized ads run in the EEA or the UK. The banner on this site is not that certified platform.</p>
    <p>Amazon Associates is not connected either. The <a href="/affiliate/">affiliate disclosure</a> is ready for the day a real link exists. There are no affiliate links now.</p>
    <p><a class="kk-button" href="mailto:${HELLO_EMAIL}?subject=Advertise%20on%20KiteKitchen">Email ${HELLO_EMAIL}</a></p>
    <p class="kk-note">That address is a placeholder until Jonathan confirms it.</p>
  </article>`
}));

write("affiliate/index.html", page({
  title: "Affiliate disclosure · KiteKitchen",
  description: "KiteKitchen has no affiliate links yet. This page is the disclosure text for when Jonathan joins a program such as Amazon Associates.",
  path: "/affiliate/",
  main: `<article class="kk-wrap"><h1>Affiliate disclosure</h1>
    <p>KiteKitchen does not use affiliate links today. No product link on this site is paid, and none is an Amazon Associates link.</p>
    <p>If that changes, pages with a paid link will say so near the link. A purchase through an affiliate link can earn this site a commission at no extra cost to you. That commission would not change the recipes, the sources, or the decision to show a product. Prices, if a shop ever opens, would still need Jonathan’s approval. Nothing is for sale now.</p>
    <p>Sponsored placements, if a brand buys one, will sit in a slot labeled Advertisement and will not be written as a review.</p>
  </article>`
}));

write("privacy/index.html", page({
  title: "Privacy · KiteKitchen",
  description: "How KiteKitchen handles pages, Google Analytics, advertising cookies, and affiliate links that are not live yet.",
  path: "/privacy/",
  main: `<article class="kk-wrap"><h1>Privacy</h1>
    <p>This is a plain-language notice, not a lawyer’s privacy policy.</p>
    <p>The pages are static files. A recipe does not ask you to make an account. The notify buttons open your own email app and send nothing to a KiteKitchen server, because there isn’t one.</p>
    <h2>Google Analytics</h2>
    <p>Kite Kitchen uses Google Analytics 4 with measurement ID ${GA_MEASUREMENT_ID}. The Analytics library is not requested until you press, type, or scroll, or until a short wait after the page loads, so it does not sit on the first paint.</p>
    <p>Before that library loads, the page sets Google Consent Mode defaults. In the EEA, the UK, and Switzerland, analytics cookies start denied and stay denied until you accept. Elsewhere, analytics storage starts granted unless you reject. If you reject, a later visit keeps analytics storage denied. If you accept, it is granted. The choice is stored in this browser under the key <code>kk-consent</code>.</p>
    <p>When storage is denied, Google’s tag can still receive a cookieless signal. That is how Consent Mode is built. Advertising storage stays denied until you accept, and the ad script is not loaded at all while ads are switched off.</p>
    <h2>Advertising</h2>
    <p>Ad slots are reserved and labeled. They show a KiteKitchen shop note while AdSense is disabled. No publisher ID is in the repository. If AdSense is turned on later, its script loads only after you accept. Google requires a certified consent platform for personalized ads in the EEA and the UK. This banner is not a certified platform.</p>
    <h2>Affiliates</h2>
    <p>There are no affiliate links. If some are added later, the merchant, such as Amazon, may set a cookie when you follow one. The <a href="/affiliate/">affiliate disclosure</a> will apply.</p>
    <p>Flying Sauces and Flying Pancakes pages can still store their own demo notes in this browser. Those notes are not a KiteKitchen account.</p>
    <p><button type="button" data-consent-open>Open cookie choices</button></p>
  </article>`
}));

write("terms/index.html", page({
  title: "Terms · KiteKitchen",
  description: "Terms for using KiteKitchen. Recipes are for home cooking. The shop is not a store.",
  path: "/terms/",
  main: `<article class="kk-wrap"><h1>Terms</h1>
    <p>KiteKitchen publishes recipes and guides for home cooks. They are not professional food-safety, medical, or dietary advice. Festival pages describe other people’s published sources and then give a home adaptation. Read the note on the recipe before you treat it as the traditional dish.</p>
    <p>The shop is a preview. A “Coming soon” label is not an offer to sell. There is no price because none has been approved. Do not send payment.</p>
    <p>Flying Sauces, Flying Pancakes, and Flying BBQ keep the text imported from those guides.</p>
    <p>Contact <a href="mailto:${HELLO_EMAIL}">${HELLO_EMAIL}</a>. That mailbox is a placeholder until Jonathan confirms it.</p>
  </article>`
}));

write("guidelines/index.html", page({
  title: "Guidelines · KiteKitchen",
  description: "How KiteKitchen handles recipe suggestions. No made-up reviews or ratings.",
  path: "/guidelines/",
  main: `<article class="kk-wrap"><h1>Guidelines</h1>
    <p>Suggest a correction or a recipe by emailing <a href="mailto:${HELLO_EMAIL}?subject=KiteKitchen%20suggestion">${HELLO_EMAIL}</a>. A suggestion is not published as a review. This site does not collect star ratings.</p>
    <p>Do not send anyone else’s private information.</p>
  </article>`
}));

const countryBlocks = [...byCountry.entries()].sort((a, b) => byIso[a[0]].name.localeCompare(byIso[b[0]].name)).map(([iso, items]) => {
  const place = byIso[iso];
  const ns = place.lat >= 0 ? "N" : "S";
  const ew = place.lon >= 0 ? "E" : "W";
  const label = `${Math.abs(Math.round(place.lat))}° ${ns}, ${Math.abs(Math.round(place.lon))}° ${ew}`;
  return `<section id="${iso}" class="kk-country"><h2>${escapeHtml(place.name)}</h2><p class="kk-meta">${label}</p><ul class="kk-recipe-list">${items.map((item) => `<li><a href="${item.href}">${escapeHtml(item.title)}</a> <span class="kk-meta">${escapeHtml(item.section)}</span></li>`).join("")}</ul></section>`;
}).join("");
write("map/index.html", page({
  title: "World map · Kite Kitchen",
  description: "A simple world map of Flying Sauces, Flying Pancakes, and Flying BBQ. Choose a country to see its recipes.",
  path: "/map/",
  current: "map",
  main: `<div class="kk-wrap"><h1><img class="kk-compass" src="/assets/brand/compass.svg" alt="" width="36" height="36"> World map</h1>
    <p class="kk-lede">Flying around the world, one recipe at a time. Marked countries have recipes. The shapes are a simplified public-domain country map.</p>
    ${ad("map", "inline")}
    <div class="kk-atlas">${atlasMap}</div>
    ${countryBlocks}
  </div>`
}));

write("settled/index.html", page({
  title: "Who settled the flavor · KiteKitchen",
  description: "Links to the Flying Sauces and Flying Pancakes pages about settlement and migration. KiteKitchen does not add a new history.",
  path: "/settled/",
  main: `<article class="kk-wrap"><h1>Who settled the flavor</h1>
    <p>Those essays stay in the sections that wrote them. This page does not add a story.</p>
    <p><a href="/flying-sauces/places/who-settled-the-flavor/">Flying Sauces</a></p>
    <p><a href="/flying-pancakes/journeys/who-settled-the-flavor/">Flying Pancakes</a></p>
  </article>`
}));

write("login.html", page({
  title: "Sign in · KiteKitchen",
  description: "KiteKitchen does not run a separate account. Flying Sauces and Flying Pancakes keep their own demo sign-in.",
  path: "/login.html",
  main: `<article class="kk-wrap"><h1>Sign in</h1><p>KiteKitchen does not keep accounts. The demo sign-in on the two guides is still there, stored in your browser only.</p><p><a href="/flying-sauces/login.html">Flying Sauces sign in</a></p><p><a href="/flying-pancakes/login.html">Flying Pancakes sign in</a></p></article>`
}));

write("submit.html", page({
  title: "Suggest a recipe · KiteKitchen",
  description: "Send Kite Kitchen a recipe idea or a correction by email.",
  path: "/submit.html",
  main: `<article class="kk-wrap"><h1>Suggest a recipe</h1><p><a class="kk-button" href="mailto:${HELLO_EMAIL}?subject=Recipe%20suggestion">Email a suggestion</a></p><p class="kk-note">Nothing you send is turned into a rating or a review.</p></article>`
}));

write("404.html", page({
  title: "Page not found · KiteKitchen",
  description: "That KiteKitchen page is not here.",
  path: "/404.html",
  robots: "noindex",
  main: `<article class="kk-wrap"><h1>That page is not here</h1><p><a href="/">Back to KiteKitchen</a></p></article>`
}));

const legacy = JSON.parse(fs.readFileSync(path.join(root, "data/legacy-paths.json"), "utf8"));
function legacyTarget(rel) {
  const parts = rel.replace(/index\.html$/, "").split("/").filter(Boolean);
  if (rel === "sauces/index.html") return "/flying-sauces/";
  if (rel === "pancakes/index.html") return "/flying-pancakes/";
  if (rel === "bbq/index.html") return "/flying-bbq/";
  if (rel === "moderate.html") return "/login.html";
  if (rel === "shop/ultimate-library/index.html") return "/shop/#books";
  if (rel === "shop/grill-tools/index.html") return "/shop/tongs/";
  if (rel === "shop/grill-gloves/index.html") return "/shop/oven-mitt/";
  if (["cutting-board", "skillet", "spice-tin", "thermometer", "branding-iron", "tumbler", "hat"].includes(parts[1]) && parts[0] === "shop" && parts.length === 2) return "/shop/";
  if (parts[0] === "notes" && parts[1] === "sauces") return `/flying-sauces/sauces/${parts[2]}/`;
  if (parts[0] === "notes" && parts[1] === "pancakes") return `/flying-pancakes/pancakes/${parts[2]}/`;
  if (parts[0] === "notes" && parts[1] === "bbq") return `/flying-bbq/dishes/${parts[2]}/`;
  if (parts[0] === "journeys" && parts[1] === "sauces") return `/flying-sauces/journeys/${parts[2]}/`;
  if (parts[0] === "journeys" && parts[1] === "pancakes") return `/flying-pancakes/journeys/${parts[2]}/`;
  if (parts[0] === "journeys" && parts[1] === "bbq") return `/flying-bbq/journeys/${parts[2]}/`;
  if (parts[0] === "shop" && parts[1] === "books" && parts[2] === "sauces") return `/flying-sauces/books/${parts[3]}/`;
  if (parts[0] === "shop" && parts[1] === "books" && parts[2] === "pancakes") return `/flying-pancakes/books/${parts[3]}/`;
  if (parts[0] === "shop" && parts[1] === "books" && parts[2] === "bbq") return `/flying-bbq/books/${parts[3]}/`;
  return null;
}
for (const rel of legacy) {
  const target = legacyTarget(rel);
  if (!target) continue;
  const file = path.join(root, rel);
  if (fs.existsSync(file)) continue;
  const absolute = target.startsWith("http") ? target : `${SITE_ORIGIN}${target.startsWith("/") ? target : `/${target}`}`;
  const canonical = absolute.split("#")[0];
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page moved · KiteKitchen</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta http-equiv="refresh" content="0; url=${escapeHtml(target)}">
  <link rel="icon" href="/favicon.ico">
</head>
<body>
  <p>This page has moved. <a href="${escapeHtml(target)}">Continue to KiteKitchen</a>.</p>
</body>
</html>
`;
  write(rel, html);
}

const searchItems = [];
for (const [dir, section, folder] of [["flying-sauces", "Flying Sauces", "sauces"], ["flying-pancakes", "Flying Pancakes", "pancakes"], ["flying-bbq", "Flying BBQ", "dishes"]]) {
  for (const slug of dirs(`${dir}/${folder}`)) {
    const html = fs.readFileSync(path.join(root, dir, folder, slug, "index.html"), "utf8");
    searchItems.push({
      title: textOf(html, /<h1[^>]*>([\s\S]*?)<\/h1>/) || slug,
      href: `/${dir}/${folder}/${slug}/`,
      section,
      text: textOf(html, /<p class="dek">([\s\S]*?)<\/p>/)
    });
  }
}
write("assets/search-index.json", JSON.stringify(searchItems));
write("search/index.html", page({
  title: "Search · KiteKitchen",
  description: "Search Flying Sauces, Flying Pancakes, and Flying BBQ.",
  path: "/search/",
  current: "",
  main: `<div class="kk-wrap"><h1>Search</h1>
    <form class="kk-search" id="search-form" action="/search/" method="get"><label for="q">Search</label><input id="q" name="q" type="search"><button class="kk-button" type="submit">Search</button></form>
    <p id="search-status" class="kk-meta"></p>
    <ul id="results" class="kk-results"></ul>
  </div>
  <script src="/assets/js/search.js" defer></script>`
}));

if (!fs.existsSync(path.join(root, "flying-sauces/explore/type/curry-paste/index.html"))) {
  write("flying-sauces/explore/type/curry-paste/index.html", page({
    title: "Curry paste · Flying Sauces · KiteKitchen",
    description: "Flying Sauces names curry paste as a type. This issue does not file a separate page of sauces under that type.",
    path: "/flying-sauces/explore/type/curry-paste/",
    main: `<article class="kk-wrap"><p class="kk-kicker">Flying Sauces</p><h1>Curry paste</h1><p>The Flying Sauces guide names curry paste as a type and, in this issue, files no sauce on a separate page for it. Sauces that are pastes may be listed under another type, such as <a href="/flying-sauces/explore/type/curry-sauce/">curry sauce</a>.</p><p><a href="/flying-sauces/explore/">Back to explore</a></p></article>`
  }));
}

function walkHtml(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, found);
    else if (entry.name.endsWith(".html")) found.push(full);
  }
  return found;
}
const urls = [];
for (const file of walkHtml(root)) {
  const html = fs.readFileSync(file, "utf8");
  if (html.includes('content="noindex"') || file.endsWith(`${path.sep}404.html`)) continue;
  let rel = path.relative(root, file).split(path.sep).join("/");
  if (rel === "index.html") rel = "";
  else if (rel.endsWith("/index.html")) rel = rel.slice(0, -"index.html".length);
  urls.push(`${SITE_ORIGIN}/${rel}`);
}
urls.sort();
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((loc) => `  <url><loc>${loc}</loc></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
write("data/build-summary.json", JSON.stringify({
  origin: SITE_ORIGIN,
  sauces: sauceCount,
  pancakes: pancakeCount,
  sauceBooks: sauceBooks.length,
  pancakeBooks: pancakeBooks.length,
  recipes: recipes.length,
  traditions: traditions.length,
  products: products.length,
  sitemap: urls.length
}, null, 2));
console.log(`KiteKitchen built. ${urls.length} sitemap URLs. ${sauceCount} sauces, ${pancakeCount} pancakes.`);
