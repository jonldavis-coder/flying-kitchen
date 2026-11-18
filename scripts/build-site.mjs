import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SITE_ORIGIN, BASE_PATH, GA_MEASUREMENT_ID, ADS, HELLO_EMAIL, home_hero_photo } from "../site.config.mjs";
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

const SHOP_LINE = `<p><a href="/shop/">The Kite Kitchen shop is coming soon.</a></p>`;

function ad(slot, kind, shopLine = false) {
  const side = kind === "sidebar";
  return `<aside class="kk-ad${side ? " kk-ad-sidebar" : " kk-ad-inline"}" data-ad-slot="${slot}" aria-label="Advertisement">
      <p class="kk-ad-label">Advertisement</p>
      <div class="kk-ad-frame">${shopLine ? SHOP_LINE : ""}</div>
    </aside>`;
}

function keepFirstShopLine(html) {
  let seen = false;
  return html.replace(/<p><a href="\/shop\/">The Kite Kitchen shop is coming soon\.<\/a><\/p>/g, (line) => {
    if (seen) return "";
    seen = true;
    return line;
  });
}

const consent = `<div id="kk-consent" class="kk-consent no-print" role="dialog" aria-labelledby="kk-consent-title" hidden>
    <p id="kk-consent-title">Cookies stay off in the EEA, the UK, and Switzerland until you accept. <a href="/privacy/">Privacy</a></p>
    <div class="kk-row">
      <button type="button" class="kk-button" data-consent="granted">Accept</button>
      <button type="button" class="kk-button quiet" data-consent="denied">Reject</button>
    </div>
  </div>`;

function headBits(title, description, url, jsonLd, robots, extraHead = "", image = "/assets/og/home.jpg") {
  const og = image.startsWith("http") ? image : `${SITE_ORIGIN}${image}`;
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
  <link rel="icon" href="/assets/brand/kite-mark.svg" type="image/svg+xml">
  <link rel="icon" href="/assets/brand/icon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/brand/apple-touch.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="KiteKitchen">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:image" content="${escapeHtml(og)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(og)}">
  <link rel="stylesheet" href="/assets/css/kite.css">
  ${extraHead}
  ${ld}
</head>`;
}

const NAV = [
  ["/recipes/", "Recipes", "recipes"],
  ["/map/", "World Map", "map"],
  ["/journeys/", "Journeys", "journeys"],
  ["/flying-sauces/", "Flying Sauces", "sauces"],
  ["/flying-pancakes/", "Flying Pancakes", "pancakes"],
  ["/flying-bbq/", "Flying BBQ", "bbq"],
  ["/shop/", "Shop", "shop"],
  ["/about/", "About", "about"]
];
const TAGLINE = "Flying around the world, one simple recipe at a time";
const KITE_MARK = `<svg class="kk-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path fill="#c6a15b" d="M32 3.5 57 30 32 51 7 30Z"/><path fill="#f6e7c1" d="M32 11 48.5 30 32 44.5 15.5 30Z"/><path fill="none" stroke="#5c3d12" stroke-width="1.15" d="M32 3.5V51M7 30h50"/><path fill="none" stroke="#5c3d12" stroke-width="1.35" stroke-linecap="round" d="M32 51c4 6 12 8 16 11"/><circle cx="32" cy="30" r="1.35" fill="#5c3d12"/></svg>`;
const SEARCH_ICON = `<span class="kk-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15 15.5 20 20.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>`;

function nav(current, cls) {
  return `<nav class="${cls}" aria-label="Primary">${NAV.map(([href, label, id]) => `<a href="${href}"${id === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
}

function brandLockup() {
  return `<a class="kk-brand" href="/">${KITE_MARK}<span class="kk-brand-text"><span class="kk-word">Kite Kitchen</span><span class="kk-tag kk-tag-long">${TAGLINE}</span><span class="kk-tag kk-tag-short">Around the world</span></span></a>`;
}

function header(current) {
  return `<a class="skip-link" href="#content">Skip to content</a>
<header class="kk-header">
  <div class="kk-header-inner">
    ${brandLockup()}
    ${nav(current, "kk-nav")}
    <details class="kk-menu">
      <summary>Menu</summary>
      ${nav(current, "kk-nav")}
    </details>
  </div>
</header>`;
}

function footInner() {
  return `<div class="kk-wrap kk-foot">
      <img class="kk-crest" src="/assets/brand/logo-240.webp" alt="" width="96" height="124">
      <div>
        <p class="kk-word">Kite Kitchen</p>
        <p class="kk-tag">${TAGLINE}</p>
        <img class="kk-compass" src="/assets/brand/compass.svg" alt="" width="28" height="28">
        <nav aria-label="Footer">
          <a href="/recipes/">Recipes</a>
          <a href="/flying-sauces/">Flying Sauces</a>
          <a href="/flying-pancakes/">Flying Pancakes</a>
          <a href="/flying-bbq/">Flying BBQ</a>
          <a href="/map/">World Map</a>
          <a href="/journeys/">Journeys</a>
          <a href="/books/">Cookbooks</a>
          <a href="/shop/">Shop</a>
          <a href="/about/">About</a>
          <a href="/credits/">Credits</a>
          <a href="/privacy/">Privacy</a>
          <a href="/terms/">Terms</a>
          <button type="button" class="quiet" data-consent-open>Cookie choices</button>
        </nav>
        <p class="kk-fine">Home cooking, not professional advice. The shop is coming soon, and no prices are listed.</p>
      </div>
    </div>`;
}

function footer() {
  return `<footer class="kk-footer">${footInner()}</footer>
  ${consent}
  <script src="/config.js"></script>
  <script src="/assets/js/consent.js" defer></script>`;
}

function stampOg(html, imagePath) {
  const abs = `${SITE_ORIGIN}${imagePath}`;
  if (/property="og:image"/.test(html)) html = html.replace(/<meta property="og:image" content="[^"]*">/g, `<meta property="og:image" content="${abs}">`);
  else html = html.replace("</head>", `  <meta property="og:image" content="${abs}">\n</head>`);
  if (/name="twitter:image"/.test(html)) html = html.replace(/<meta name="twitter:image" content="[^"]*">/g, `<meta name="twitter:image" content="${abs}">`);
  else html = html.replace("</head>", `  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:image" content="${abs}">\n</head>`);
  if (!/name="twitter:card"/.test(html)) html = html.replace("</head>", `  <meta name="twitter:card" content="summary_large_image">\n</head>`);
  return html;
}

function page({ title, description, path: pagePath, main, jsonLd, current = "", robots = "", scripts = "", extraHead = "", image = "/assets/og/home.jpg" }) {
  const url = `${SITE_ORIGIN}${pagePath}`;
  return `${headBits(title, description, url, jsonLd, robots, extraHead, image)}
<body>
  ${header(current)}
  <main id="content" tabindex="-1">
    ${main}
  </main>
  ${footer()}
  ${scripts}
</body>
</html>
`;
}

function crumbs(items) {
  const parts = items.map((item, index) => index === items.length - 1
    ? `<span aria-current="page">${escapeHtml(item[1])}</span>`
    : `<a href="${item[0]}">${escapeHtml(item[1])}</a>`);
  return `<nav class="kk-crumbs" aria-label="Breadcrumb">${parts.join("")}</nav>`;
}

function searchForm(id, placeholder, formId = "") {
  return `<form class="kk-search"${formId ? ` id="${formId}"` : ""} action="/search/" method="get">
      <label class="sr-only" for="${id}">Search recipes</label>
      ${SEARCH_ICON}
      <input id="${id}" name="q" type="search" placeholder="${escapeHtml(placeholder)}" autocomplete="off">
      <button class="kk-button" type="submit">Search</button>
    </form>`;
}

function orgLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KiteKitchen",
    url: `${SITE_ORIGIN}/`,
    logo: `${SITE_ORIGIN}/assets/brand/logo-480.png`,
    email: HELLO_EMAIL
  };
}

function dirs(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((name) => fs.existsSync(path.join(full, name, "index.html"))).sort();
}

function textOf(html, re) {
  const match = html.match(re);
  return match ? match[1].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim() : "";
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
  const current = NAV.find(([href]) => href === currentHref)?.[2] || "";
  return `<header class="kk-header" id="kk-bar">
  <div class="kk-header-inner">
    ${brandLockup()}
    <p class="kk-section-name">${escapeHtml(name)}</p>
    ${nav(current, "kk-nav")}
    <details class="kk-menu"><summary>Menu</summary>${nav(current, "kk-nav")}</details>
  </div>
</header>`;
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
      if (html.includes('<header class="kk-header" id="kk-bar">')) {
        html = html.replace(/<header class="kk-header" id="kk-bar">[\s\S]*?<\/header>/, bar);
      } else {
        html = html.replace(/<div class="kk-bar" id="kk-bar">[\s\S]*?<\/div>/, bar);
      }
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
      html = html.replace(/<\/head>/, `  <link rel="icon" href="/favicon.ico" sizes="any">\n  <link rel="icon" href="/assets/brand/kite-mark.svg" type="image/svg+xml">\n  <link rel="icon" href="/assets/brand/icon-192.png" type="image/png">\n</head>`);
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
    html = html.replace(/<div class="kk-ad-frame">[\s\S]*?Jonathan approves it\.<\/p>\s*<\/div>/g, `<div class="kk-ad-frame"><p><a href="/shop/">The Kite Kitchen shop is coming soon.</a></p></div>`);
    html = html.replace(/<div id="kk-consent"[\s\S]*?(?=<script src="\/config\.js">)/, `${consent}\n`);
    if (html.includes("kk-sitefoot")) {
      html = html.replace(/<footer class="kk-footer kk-sitefoot">[\s\S]*?<\/footer>/, `<footer class="kk-footer kk-sitefoot">${footInner()}</footer>`);
    } else {
      html = html.replace(/<\/body>/, `<footer class="kk-footer kk-sitefoot">${footInner()}</footer>\n</body>`);
    }
    if (/data-page="(sauce|pancake|dish)"/.test(html)) {
      html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (full, raw) => {
        let data;
        try { data = JSON.parse(raw); } catch { return full; }
        const list = Array.isArray(data) ? data : [data];
        let changed = false;
        for (const node of list) {
          if (!node || node["@type"] !== "Recipe") continue;
          if (!node.author) {
            node.author = { "@type": "Organization", name: "Kite Kitchen" };
            changed = true;
          }
          if (!node.publisher) {
            node.publisher = { "@type": "Organization", name: "Kite Kitchen", url: `${SITE_ORIGIN}/` };
            changed = true;
          }
          if (!node.mainEntityOfPage && node.url) {
            node.mainEntityOfPage = node.url;
            changed = true;
          }
        }
        if (!changed) return full;
        return `<script type="application/ld+json">${JSON.stringify(Array.isArray(data) ? list : list[0]).replace(/</g, "\\u003c")}</script>`;
      });
    }
    if (/data-page="(sauce|pancake|dish)"/.test(html)) {
      html = html.replace(/<p class="kk-place-links">[\s\S]*?<\/p>\s*/g, "");
      const iso = (html.match(/country=([A-Z]{2})/) || [])[1];
      const region = textOf(html, /<dt>Region<\/dt>\s*<dd>([\s\S]*?)<\/dd>/);
      const countryName = textOf(html, /<dt>Country<\/dt>\s*<dd>([^<]+)/);
      if (iso && countryName) {
        const regionLink = region ? ` · <a href="/regions/${regionSlug(region)}/">${escapeHtml(region)}</a>` : "";
        const links = `<p class="kk-place-links"><a href="/map/#${iso}">${escapeHtml(countryName)} on the world map</a>${regionLink}</p>`;
        if (html.includes("kk-origin")) html = html.replace(/(<p class="kk-origin">[\s\S]*?<\/p>)/, `$1\n${links}`);
        else html = html.replace(/<\/h1>/, `</h1>\n${links}`);
      }
    }
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
        html = html.replace(/<p class="dek">[\s\S]*?<\/p>/, (m) => `${m}\n${ad("after-intro", "inline", true)}`);
        html = html.replace(/<aside class="ad-slot"[\s\S]*?<\/aside>/, ad("before-recipe", "inline"));
        html = html.replace(/<aside class="rail">/, `${ad("sidebar", "sidebar")}\n<aside class="rail">`);
      } else if (html.includes('class="ad-slot"')) {
        html = html.replace(/<aside class="ad-slot"[\s\S]*?<\/aside>/, ad("section-slot", "inline", true));
      }
    }
    html = html.replace(/<aside class="ad-slot"[\s\S]*?<\/aside>/g, "");
    html = keepFirstShopLine(html);
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
    countries.push({ iso, name, rings, outline: best, lon: lon / best.length, lat: lat / best.length });
  }
  return countries;
}

function ringPath(ring, w, h, digits) {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const x = ((ring[i][0] + 180) / 360) * w;
    const y = ((90 - ring[i][1]) / 180) * h;
    d += `${i ? "L" : "M"}${x.toFixed(digits)} ${y.toFixed(digits)}`;
  }
  return `${d}Z`;
}

function worldSvg(countries, w, h, hrefFor, simple = false) {
  const lines = [];
  for (let lon = -150; lon <= 150; lon += 30) {
    const x = ((lon + 180) / 360) * w;
    lines.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${h}"/>`);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * h;
    lines.push(`<line x1="0" y1="${y.toFixed(1)}" x2="${w}" y2="${y.toFixed(1)}"/>`);
  }
  const digits = simple ? 0 : 1;
  const lands = countries.map((country) => {
    const rings = simple ? [country.outline || country.rings[0]] : country.rings;
    const d = rings.map((ring) => ringPath(ring, w, h, digits)).join("");
    const tier = country.count >= 12 ? "has has-3" : country.count >= 4 ? "has has-2" : country.count ? "has has-1" : "";
    const title = `<title>${escapeHtml(country.name)}${country.count ? `, ${country.count} recipes` : ""}</title>`;
    const pathEl = `<path class="${tier}" d="${d}">${title}</path>`;
    const x = ((country.lon + 180) / 360) * w;
    const y = ((90 - country.lat) / 180) * h;
    const dot = country.count ? `<circle class="kk-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5"/>` : "";
    if (country.count && hrefFor) {
      return `<a href="${hrefFor(country.iso)}" data-place="${escapeHtml(country.name)}" data-count="${country.count}">${pathEl}${dot}</a>`;
    }
    return `${pathEl}${dot}`;
  }).join("");
  return `<svg class="kk-map" viewBox="0 0 ${w} ${h}" role="img" aria-label="World map. Countries with recipes can be opened.">
    <rect class="kk-map-ocean" width="${w}" height="${h}"/>
    <g class="kk-graticule">${lines.join("")}</g>
    <g class="kk-lands">${lands}</g>
  </svg>`;
}

function regionSlug(name) {
  return String(name || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function coordLabel(lat, lon) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(Math.round(lat))}° ${ns}, ${Math.abs(Math.round(lon))}° ${ew}`;
}

function locatorCard(svg, countryName, lat, lon) {
  const place = escapeHtml(countryName || "Origin");
  const coord = Number.isFinite(lat) && Number.isFinite(lon) ? coordLabel(lat, lon) : "";
  return `<figure class="kk-atlas-card" data-kk-locator>
      <div class="kk-atlas-card-map">${svg}</div>
      <figcaption>
        <p class="kk-kicker">Locator</p>
        <p class="kk-atlas-place">${place}</p>
        ${coord ? `<p class="kk-atlas-coord">${coord}</p>` : ""}
        <p class="kk-caption">No photograph of this dish is on this page.</p>
      </figcaption>
    </figure>`;
}

function locatorFigure(iso, countryName) {
  const place = byIso[iso];
  const name = countryName || "Origin";
  if (!place || !place.outline) {
    return locatorCard(`<svg viewBox="0 0 320 180" role="img" aria-label="Map"><rect width="320" height="180" fill="#f4f0e8"/></svg>`, name, place?.lat, place?.lon);
  }
  let minX = 180;
  let maxX = -180;
  let minY = 90;
  let maxY = -90;
  for (const pt of place.outline) {
    minX = Math.min(minX, pt[0]);
    maxX = Math.max(maxX, pt[0]);
    minY = Math.min(minY, pt[1]);
    maxY = Math.max(maxY, pt[1]);
  }
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  if (spanX > 80 || spanY > 50) {
    const svg = pinSvg(place.lat, place.lon).replace('aria-hidden="true"', `role="img" aria-label="World map marking ${escapeHtml(name)}"`);
    return locatorCard(svg, name, place.lat, place.lon);
  }
  const w = 320;
  const h = 180;
  const pad = 18;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const scaleX = Math.max(spanX, 6);
  const scaleY = Math.max(spanY, 4);
  const project = (lon, lat) => {
    const x = ((lon - midX) / scaleX + 0.5) * (w - pad * 2) + pad;
    const y = ((midY - lat) / scaleY + 0.5) * (h - pad * 2) + pad;
    return [x, y];
  };
  const d = place.outline.map((pt, index) => {
    const [x, y] = project(pt[0], pt[1]);
    return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join("") + "Z";
  const [cx, cy] = project(place.lon, place.lat);
  const svg = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Map of ${escapeHtml(name)}"><rect width="${w}" height="${h}" fill="#f4f0e8"/><path d="M0 ${h / 2}H${w}M${w / 2} 0V${h}" stroke="#e4ddd2" stroke-width="0.6"/><path d="${d}" fill="#ead7ae" stroke="#1a1a1a" stroke-width="1.2"/><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="6.5" fill="#e2b007" stroke="#fffdfb" stroke-width="1.6"/><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="6.5" fill="none" stroke="#1a1a1a" stroke-width="0.7"/></svg>`;
  return locatorCard(svg, name, place.lat, place.lon);
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
# After AdSense provides a publisher line, replace this comment with the
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

const CONTINENT = {
  "North America": "Americas",
  "Mexico & Central America": "Americas",
  "Caribbean": "Americas",
  "South America": "Americas",
  "Western Europe": "Europe",
  "Southern Europe": "Europe",
  "Northern Europe": "Europe",
  "Eastern Europe": "Europe",
  "Southeast Asia": "Asia",
  "East Asia": "Asia",
  "South Asia": "Asia",
  "Central Asia": "Asia",
  "Middle East": "Asia",
  "Caucasus": "Asia",
  "East Africa": "Africa",
  "West Africa": "Africa",
  "Southern Africa": "Africa",
  "North Africa": "Africa",
  "Central Africa": "Africa",
  "Oceania": "Oceania"
};

function collectEntries(dir, folder, section) {
  const items = [];
  for (const slug of dirs(`${dir}/${folder}`)) {
    const html = fs.readFileSync(path.join(root, dir, folder, slug, "index.html"), "utf8");
    const iso = (html.match(/country=([A-Z]{2})/) || [])[1] || "";
    const meta = textOf(html, /<p class="meta recipe-meta">([\s\S]*?)<\/p>/);
    const bits = meta.split("·").map((part) => part.trim()).filter(Boolean);
    const region = textOf(html, /<dt>Region<\/dt>\s*<dd>([\s\S]*?)<\/dd>/);
    items.push({
      title: textOf(html, /<h1[^>]*>([\s\S]*?)<\/h1>/) || slug,
      href: `/${dir}/${folder}/${slug}/`,
      section,
      iso,
      country: textOf(html, /<dt>Country<\/dt>\s*<dd>([^<]+)/),
      region,
      continent: CONTINENT[region] || "",
      text: textOf(html, /<p class="dek">([\s\S]*?)<\/p>/),
      time: bits.filter((part) => /min|hr/i.test(part)).join(" · "),
      serves: bits.find((part) => /Serves/i.test(part)) || ""
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
const MINI_LANDS = `<path d="M5.3 11.1 12.9 8.9 23.1 8.9 33.3 7.1 40.9 7.6 48.9 9.8 55.1 16.4 50.7 20.4 46.7 24.4 44 28.9 40 32.9 36.9 32.9 32.9 30.2 30.2 28.4 28 25.8 24.9 22.2 24.4 18.2 19.6 14.7 12.4 13.8 6.2 13.3Z"/><path d="M44.4 35.6 48.9 34.7 53.3 36.4 57.8 39.1 64.4 42.2 62.7 49.8 58.7 52.4 52.4 63.1 48 63.1 46.2 57.8 44.4 43.6 45.3 37.3Z"/><path d="M75.6 24 76 20.9 76.4 14.2 80 12.4 83.6 11.6 88.9 8.9 92.4 8.4 94.2 13.3 92.4 19.6 88 22.2 83.6 23.6 77.8 24Z"/><path d="M72.4 30.7 72.9 27.6 74.7 24.4 80 23.6 84.4 23.6 91.1 25.8 94.2 26.2 99.1 34.7 102.7 35.1 98.7 47.1 95.6 51.6 88.9 55.6 85.3 48 83.6 38.2 77.3 37.8 73.8 33.8Z"/><path d="M97.8 15.6 101.3 8.9 115.6 7.1 133.3 7.6 151.1 9.8 159.1 10.7 154.7 13.3 148.9 17.8 143.1 21.3 137.8 25.8 134.2 30.2 128.4 36.4 126.2 39.6 122.2 32.9 115.6 37.3 110.2 29.8 106.7 28.4 101.3 22.2 98.7 17.8Z"/><path d="M130.7 49.8 136.9 45.8 143.1 44.9 144.9 48 148 51.6 146.7 56.9 140.4 55.6 135.1 54.7 130.7 55.1 130.2 51.6Z"/>`;

function coverSvg(book) {
  const words = book.title.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > 18 && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, 6);
  const size = shown.some((item) => item.length > 16) ? 30 : 36;
  const title = shown.map((item, index) => `<text x="46" y="${268 + index * (size + 8)}" fill="#1a1a1a" font-family="Georgia, 'Times New Roman', serif" font-size="${size}">${escapeHtml(item)}</text>`).join("");
  let hash = 0;
  for (const ch of book.slug) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
  const pinX = 70 + (hash % 420);
  const pinY = 560 + ((hash >> 8) % 70);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" role="img">
  <rect width="600" height="800" fill="#f6f1e6"/>
  <rect x="18" y="18" width="564" height="764" fill="none" stroke="#c6a15b" stroke-width="3"/>
  <rect x="28" y="28" width="544" height="744" fill="none" stroke="#c6a15b" stroke-width="0.7"/>
  <text x="46" y="88" fill="#8a6a32" font-family="Georgia, serif" font-size="15" letter-spacing="3">${escapeHtml(book.section.toUpperCase())}</text>
  <path d="M46 108 H210" stroke="#c6a15b" stroke-width="1.4"/>
  <g transform="translate(46, 132) scale(1.7)" fill="#ead7ae" stroke="#1a1a1a" stroke-width="0.5">${MINI_LANDS}</g>
  ${title}
  <g fill="none" stroke="#c6a15b" stroke-width="0.6" opacity="0.8">
    <path d="M46 620 H554 M46 660 H554 M46 700 H554"/>
    <path d="M140 600 V720 M260 600 V720 M380 600 V720 M500 600 V720"/>
  </g>
  <circle cx="${pinX}" cy="${pinY}" r="7" fill="#e2b007" stroke="#1a1a1a" stroke-width="1"/>
  <g transform="translate(46, 724) scale(0.62)"><path fill="#c6a15b" d="M32 3.5 57 30 32 51 7 30Z"/><path fill="#f6e7c1" d="M32 11 48.5 30 32 44.5 15.5 30Z"/><path fill="none" stroke="#5c3d12" stroke-width="1.15" d="M32 3.5V51M7 30h50"/></g>
  <text x="96" y="752" fill="#1a1a1a" font-family="Georgia, serif" font-size="16">Kite Kitchen</text>
</svg>`;
}

function routeSvg(points) {
  const w = 640;
  const h = 320;
  const coords = points.map((point) => {
    const x = ((point.lon + 180) / 360) * w;
    const y = ((90 - point.lat) / 180) * h;
    return [x, y];
  });
  const path = coords.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const dots = coords.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="#e2b007" stroke="#fffdfb" stroke-width="2.2"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>`).join("");
  return `<svg class="kk-route" viewBox="0 0 ${w} ${h}" role="img" aria-label="World map with a gold route between the stops"><rect width="${w}" height="${h}" fill="#f4f0e8"/><g transform="scale(4)" fill="#ead7ae" stroke="#1a1a1a" stroke-width="0.45">${MINI_LANDS}</g><path d="${path}" fill="none" stroke="#c6a15b" stroke-width="2.6" stroke-dasharray="2 5" stroke-linecap="round"/>${dots}</svg>`;
}

function pinSvg(lat, lon) {
  const x = ((lon + 180) / 360) * 160;
  const y = ((90 - lat) / 180) * 80;
  return `<svg class="kk-pin" viewBox="0 0 160 80" width="156" height="78" aria-hidden="true"><rect width="160" height="80" fill="#f4f0e8"/><path d="M0 40H160M40 0V80M80 0V80M120 0V80" stroke="#e4ddd2" stroke-width="0.45"/><g fill="#ead7ae" stroke="#1a1a1a" stroke-width="0.6">${MINI_LANDS}</g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.4" fill="#e2b007" stroke="#fffdfb" stroke-width="1.7"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.4" fill="none" stroke="#1a1a1a" stroke-width="0.6"/></svg>`;
}
const EDITORIAL = {
  hero: { id: "hero", widths: [768, 1280, 1920], w: 16, h: 9, alt: "Dried chiles and spices hanging in a market stall at the Spice Bazaar in Istanbul", caption: "Dried chiles at the Spice Bazaar, Istanbul.", artist: "Rachel Dalby", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Dried_chillies_in_Spice_Bazaar_Istanbul.jpg" },
  pesto: { id: "pesto", widths: [480, 800], w: 4, h: 3, alt: "Pesto alla Genovese in a marble mortar", caption: "Pesto alla Genovese.", artist: "AlfonsoLucifredi", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Pesto_alla_genovese.jpg" },
  crepes: { id: "crepes", widths: [480], w: 4, h: 3, alt: "Crêpes Suzette on a plate", caption: "Crêpes Suzette.", artist: "Ka23 13", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:CrepeSuzette_20220506_202934.jpg" },
  asado: { id: "asado", widths: [480, 800], w: 4, h: 3, alt: "Argentine asado, meat cooked over a fire", caption: "Argentine asado.", artist: "Robertaleotta2020", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Asado_(argentine_meat)_2019.jpg" },
  mole: { id: "mole", widths: [480, 800, 1200], w: 4, h: 3, alt: "Mole poblano with sesame seeds, served with rice and pasta", caption: "Mole poblano.", artist: "Pabliotecario", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Mole_poblano_de_fiesta.jpg" },
  appam: { id: "appam", widths: [480], w: 4, h: 3, alt: "Palappam, a lacy fermented rice hopper, with chicken curry", caption: "Palappam, the bowl-shaped appam.", artist: "Haneyljacob", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Palappam_and_Chicken_curry_in_Kerala.jpg" },
  hog: { id: "hog", widths: [480, 800, 1100], w: 4, h: 3, alt: "A whole hog on a barbecue grate", caption: "Whole hog barbecue.", artist: "IReallyLikeYorhshirePuddding", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Whole_Hog_BBQ.jpg" },
  chimichurri: { id: "chimichurri", widths: [480, 800, 1200], w: 4, h: 3, alt: "Chimichurri in a white bowl", caption: "Chimichurri.", artist: "Dominic Lockyer", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Chimichurri_Sauce_Recipe_(13294290615).jpg" },
  bechamel: { id: "bechamel", widths: [640, 1100], w: 16, h: 9, alt: "Béchamel sauce in a saucepan", caption: "Béchamel.", artist: "Saintfevrier", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:B%C3%A9chamel_in_saucepan.jpg" },
  bearnaise: { id: "bearnaise", widths: [640, 1100], w: 16, h: 9, alt: "Béarnaise sauce with tarragon", caption: "Béarnaise.", artist: "Alexander Guy", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:B%C3%A9arnaise_sauce_with_Tarragon_garnish.jpeg" },
  arrabbiata: { id: "arrabbiata", widths: [640, 1100], w: 16, h: 9, alt: "Penne with arrabbiata sauce", caption: "Penne all'arrabbiata.", artist: "Leonhard Lenz", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", sourceUrl: "https://commons.wikimedia.org/wiki/File:Penne_on_plate_with_Arrabbiata_2025-02-12_04.jpg" },
  adjika: { id: "adjika", widths: [640, 1100], w: 16, h: 9, alt: "Adjika, a red pepper paste, in a bowl", caption: "Adjika.", artist: "Moonsun1981", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Adjika_e-citizen.jpg" },
  avgolemono: { id: "avgolemono", widths: [640], w: 16, h: 9, alt: "Avgolemono, a lemon and egg soup", caption: "Avgolemono.", artist: "Missvain", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Avgolemono_-_Sarah_Stierch.jpg" },
  chirmol: { id: "chirmol", widths: [480], w: 16, h: 9, alt: "Chirmol, a fresh tomato and onion salsa", caption: "Chirmol.", artist: "Arsongt", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Chirmol.jpg" },
  guacamole: { id: "guacamole", widths: [640], w: 16, h: 9, alt: "Guacamole with avocado and lime", caption: "Guacamole.", artist: "Nikodem Nijaki", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Guacamole_IMGP1256.jpg" },
  haydari: { id: "haydari", widths: [640], w: 16, h: 9, alt: "Haydari, a yogurt and herb meze", caption: "Haydari.", artist: "E4024", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Haydari_(Turkish_meze).jpg" },
  "burro-e-salvia": { id: "burro-e-salvia", widths: [480], w: 16, h: 9, alt: "Gnocchi with butter and sage", caption: "Gnocchi with burro e salvia.", artist: "Paoletta S.", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Gnocchi_di_ricotta_burro_e_salvia.jpg" },
  "cocktail-sauce": { id: "cocktail-sauce", widths: [640], w: 16, h: 9, alt: "Cocktail sauce with shrimp", caption: "Cocktail sauce.", artist: "jeffreyw", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Ice_cold_shrimp_and_cocktail_sauce_(4847681860).jpg" },
  "caramel-sauce": { id: "caramel-sauce", widths: [640], w: 16, h: 9, alt: "Caramel sauce with Bavarian cream and strawberries", caption: "Caramel sauce.", artist: "SKopp", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Bavarian_cream,_strawberries,_caramel_sauce,_spoon.jpg" },
  "ata-din-din": { id: "ata-din-din", widths: [640], w: 16, h: 9, alt: "Ata din din, a red pepper sauce, on ekuru", caption: "Ata din din.", artist: "Atimukoh", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Ekuru_and_ata_din_din.jpg" },
  injera: { id: "injera", widths: [640], w: 16, h: 9, alt: "Injera, a spongy flatbread, on a griddle", caption: "Injera.", artist: "Natnael Tadele", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Fresh_Injera.JPG" },
  "masala-dosa": { id: "masala-dosa", widths: [640], w: 16, h: 9, alt: "Masala dosa with chutney and sambar", caption: "Masala dosa.", artist: "Avee12Wiki", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Delicious_Masala_Dosa.jpg" },
  poffertjes: { id: "poffertjes", widths: [640], w: 16, h: 9, alt: "Poffertjes cooking in a dimpled pan", caption: "Poffertjes.", artist: "Elmschrat", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:1-Poffertjes-pan.JPG" },
  "potato-latkes": { id: "potato-latkes", widths: [640], w: 16, h: 9, alt: "Potato latkes on a plate", caption: "Potato latkes.", artist: "J Doll", license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Potato_Latkes_(140491619).jpeg" },
  pupusas: { id: "pupusas", widths: [640], w: 16, h: 9, alt: "Two pupusas on a plate", caption: "Pupusas.", artist: "Jess Lander", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Plain_pupusas_revueltas.jpg" },
  syrniki: { id: "syrniki", widths: [640], w: 16, h: 9, alt: "Syrniki, fried cheese pancakes, on a red plate", caption: "Syrniki.", artist: "Juerg Vollmer", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Syrniki.jpg" },
  "osaka-okonomiyaki": { id: "osaka-okonomiyaki", widths: [640], w: 16, h: 9, alt: "Okonomiyaki topped with bonito flakes", caption: "Okonomiyaki.", artist: "ノボホショコロトソ", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Hand-made_Okonomiyaki_02.jpg" },
  "arepa-boyacense": { id: "arepa-boyacense", widths: [640], w: 16, h: 9, alt: "Arepas boyacenses on a griddle", caption: "Arepa boyacense.", artist: "Neoredacturus", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Arepa_Boyacense.jpg" },
  "colombian-arepas": { id: "colombian-arepas", widths: [640], w: 16, h: 9, alt: "Colombian arepas on a griddle and stacked above it", caption: "Colombian arepas.", artist: "Edgar Zuniga Jr.", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Colombian_Arepas,_Boyac%C3%A1,_Colombia.jpg" },
  "jamaican-festival": { id: "jamaican-festival", widths: [640], w: 16, h: 9, alt: "Jamaican festival, fried dumplings", caption: "Jamaican festival.", artist: "999real", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", sourceUrl: "https://commons.wikimedia.org/wiki/File:FOOD_Jamaican_festival_Trinidad.jpg" },
  choripan: { id: "choripan", widths: [640], w: 16, h: 9, alt: "Choripán, sausage in a split roll", caption: "Choripán.", artist: "Horacio Cambeiro", license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Argentine_Chorip%C3%A1n.jpg" },
  "kalua-pig": { id: "kalua-pig", widths: [640], w: 16, h: 9, alt: "Kalua pig, shredded roasted pork", caption: "Kalua pig.", artist: "Pacamah", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Homemade_Kalua_Pig.jpg" },
  "argentine-vacio": { id: "argentine-vacio", widths: [640], w: 16, h: 9, alt: "Argentine vacío grilling over coals with sausage and bread", caption: "Argentine vacío.", artist: "Horacio Cambeiro", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Grilled_Argentine_vac%C3%ADo_beef,_parrillero_chorizo_and_mignon_bread_on_a_traditional_chulengo_barbecue.jpg" },
  "tandoori-chicken": { id: "tandoori-chicken", widths: [640], w: 16, h: 9, alt: "Tandoori chicken with lime", caption: "Tandoori chicken.", artist: "Saimmx", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", sourceUrl: "https://commons.wikimedia.org/wiki/File:20251121_133209_Tandoori_chicken.jpg" },
  "kansas-city-burnt-ends": { id: "kansas-city-burnt-ends", widths: [640], w: 16, h: 9, alt: "Burnt ends, cubed brisket with a dark crust", caption: "Burnt ends.", artist: "Gatorfan252525", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Beef_brisket_burnt_ends.jpg" },
  "greek-souvlaki": { id: "greek-souvlaki", widths: [640], w: 16, h: 9, alt: "Souvlaki, grilled pork skewers with onion and pepper", caption: "Souvlaki.", artist: "Kolforn", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:2017-04-17_Souvlaki_(Barbequed_Pork_belly_kebab),_Trimingham.JPG" },
  "japanese-yakitori": { id: "japanese-yakitori", widths: [640], w: 16, h: 9, alt: "Yakitori, grilled chicken on a skewer", caption: "Yakitori.", artist: "Leandro Kibisz", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Argentina_-_Misiones_-_Ober%C3%A1_-_Fiesta_del_Inmigrante_2014_-_Gastronom%C3%ADa_-_Colectividad_japonesa_-_Yakitori_y_Tonyaki_con_Kare_Rice.JPG" },
  "paper-dosa": { id: "paper-dosa", widths: [640], w: 16, h: 9, alt: "A large paper dosa rolled on a restaurant table", caption: "Paper dosa.", artist: "Karol Gajda", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Massive_50_Rupee_Paper_Dosa_(4437743263).jpg" },
  "malaysian-satay-ayam": { id: "malaysian-satay-ayam", widths: [640], w: 16, h: 9, alt: "Chicken satay on skewers with peanut sauce", caption: "Chicken satay.", artist: "Elly Suhailee", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:CHICKEN_SATAY.jpg" },
  "roti-canai": { id: "roti-canai", widths: [640], w: 16, h: 9, alt: "Roti canai, a flaky flatbread, on a metal plate", caption: "Roti canai.", artist: "Alpha", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Fluffy_close-up_-_Roti_Canai_-_Mega_Curry_House_MYR1.30_(4573123653).jpg" },
  "korean-bulgogi": { id: "bulgogi", widths: [640], w: 16, h: 9, alt: "Bulgogi, marinated beef with sesame, served with rice", caption: "Bulgogi.", artist: "Andy Li", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", sourceUrl: "https://commons.wikimedia.org/wiki/File:Bulgogi_(Marinated_beef._Served_with_rice)_-_Kogi_2023-09-11.jpg" },
  "jamaican-jerk-chicken": { id: "jerk", widths: [640], w: 16, h: 9, alt: "Jerk chicken with rice and cabbage", caption: "Jerk chicken.", artist: "naotakem", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Jerk_Chicken_Plate.jpg" },
  "tianjin-jianbing": { id: "tianjin-jianbing", widths: [640], w: 16, h: 9, alt: "Jianbing cooking on a round griddle", caption: "Jianbing.", artist: "Jmps2016", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Jianbing.jpg" },
  "nigerian-suya": { id: "nigerian-suya", widths: [640], w: 16, h: 9, alt: "Suya, spiced beef, grilling over coals", caption: "Suya.", artist: "Ewatomi1", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:An_Hausa_man_producing_suya_at_suya_production_site_in_Nigeria_06.jpg" },
  "kenyan-nyama-choma": { id: "kenyan-nyama-choma", widths: [480], w: 16, h: 9, alt: "Nyama choma, grilled meat on skewers", caption: "Nyama choma.", artist: "Zizounyc", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Nyama_Choma_at_Coco_Beach..jpg" },
  "moroccan-baghrir": { id: "moroccan-baghrir", widths: [640], w: 16, h: 9, alt: "Baghrir, spongy semolina pancakes", caption: "Baghrir.", artist: "Sabah HAANA", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Baghrir_1.jpg" },
  "south-african-boerewors": { id: "south-african-boerewors", widths: [640], w: 16, h: 9, alt: "Boerewors coils on a grill over coals", caption: "Boerewors.", artist: "Ossewa", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Boerewors_braai.jpg" },
  "australian-pancakes": { id: "australian-pancakes", widths: [640], w: 16, h: 9, alt: "A folded pancake with strawberries and cream", caption: "Australian pancakes.", artist: "Earlyspatz", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Wikipedia_for_Peace_Berlin_Australian_Pancakes.jpg" },
  "singapore-hawker-satay": { id: "malaysian-satay-ayam", widths: [640], w: 16, h: 9, alt: "Chicken satay on skewers with peanut sauce", caption: "Chicken satay.", artist: "Elly Suhailee", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:CHICKEN_SATAY.jpg" }
};
const DISH_PHOTO = Object.fromEntries([
  "bechamel", "bearnaise", "arrabbiata", "adjika", "avgolemono", "chirmol", "guacamole", "haydari", "burro-e-salvia", "cocktail-sauce", "caramel-sauce", "ata-din-din",
  "injera", "masala-dosa", "poffertjes", "potato-latkes", "pupusas", "syrniki", "osaka-okonomiyaki", "arepa-boyacense", "colombian-arepas", "jamaican-festival",
  "choripan", "kalua-pig", "argentine-vacio", "tandoori-chicken", "kansas-city-burnt-ends", "greek-souvlaki", "japanese-yakitori",
  "paper-dosa", "malaysian-satay-ayam", "roti-canai", "korean-bulgogi", "jamaican-jerk-chicken", "chimichurri",
  "tianjin-jianbing", "nigerian-suya", "kenyan-nyama-choma", "moroccan-baghrir", "south-african-boerewors", "australian-pancakes", "singapore-hawker-satay"
].map((slug) => [slug, EDITORIAL[slug]]));
const CARD_PHOTO = {
  "/flying-sauces/sauces/pesto-alla-genovese/": EDITORIAL.pesto,
  "/flying-pancakes/pancakes/crepes-suzette/": EDITORIAL.crepes,
  "/flying-bbq/dishes/argentine-asado/": EDITORIAL.asado,
  "/flying-sauces/sauces/mole-poblano/": EDITORIAL.mole,
  "/flying-pancakes/pancakes/appam/": EDITORIAL.appam,
  "/flying-bbq/dishes/eastern-nc-whole-hog/": EDITORIAL.hog
};

function photoSrcset(photo, ext) {
  return photo.widths.map((width) => `/assets/photos/editorial/${photo.id}-${width}.${ext} ${width}w`).join(", ");
}
function photoFigure(photo, { eager = false, sizes = "100vw", frame = "kk-shot" } = {}) {
  const biggest = photo.widths[photo.widths.length - 1];
  const height = Math.round(biggest * photo.h / photo.w);
  const priority = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<figure class="${frame}">
      <picture>
        <source type="image/avif" srcset="${photoSrcset(photo, "avif")}" sizes="${sizes}">
        <source type="image/webp" srcset="${photoSrcset(photo, "webp")}" sizes="${sizes}">
        <img src="/assets/photos/editorial/${photo.id}-${biggest}.jpg" srcset="${photoSrcset(photo, "jpg")}" sizes="${sizes}" width="${biggest}" height="${height}" alt="${escapeHtml(photo.alt)}" ${priority} decoding="async">
      </picture>
      <figcaption class="kk-caption">${escapeHtml(photo.caption)} Photograph by ${escapeHtml(photo.artist)}. <a href="${escapeHtml(photo.licenseUrl)}">${escapeHtml(photo.license)}</a>. <a href="${escapeHtml(photo.sourceUrl)}">Wikimedia Commons</a>.</figcaption>
    </figure>`;
}

function recipeCard(item, compact = false) {
  const place = !compact && item.iso && byIso[item.iso];
  const pin = place ? pinSvg(place.lat, place.lon) : `<span class="kk-band" aria-hidden="true"></span>`;
  const photo = !compact ? CARD_PHOTO[item.href] : null;
  const facts = [item.time, item.serves].filter(Boolean).join(" · ");
  return `<article class="kk-rcard" data-continent="${escapeHtml(item.continent)}" data-region="${escapeHtml(item.region)}">
      ${photo ? photoFigure(photo, { sizes: "(min-width: 1100px) 22rem, (min-width: 700px) 46vw, 92vw" }) : ""}
      <div class="kk-rcard-top">${pin}<div><p class="kk-kicker">${escapeHtml(item.country || item.section)}</p><p class="kk-region">${escapeHtml(item.region || item.section)}</p></div></div>
      <h3><a href="${item.href}">${escapeHtml(item.title)}</a></h3>
      <p>${escapeHtml(item.text)}</p>
      <p class="kk-meta">${escapeHtml(facts)}</p>
    </article>`;
}
function legend() {
  return `<ul class="kk-legend"><li><i class="swatch-0"></i> No recipes</li><li><i class="swatch-1"></i> 1–3</li><li><i class="swatch-2"></i> 4–11</li><li><i class="swatch-3"></i> 12 or more</li></ul>`;
}
function plate(svg, caption) {
  return `<figure class="kk-plate"><figcaption>${escapeHtml(caption)}</figcaption><div class="kk-atlas">${svg}</div>${legend()}</figure>`;
}
function countsFor(section) {
  const map = new Map();
  for (const item of catalog) {
    if (item.section !== section || !item.iso) continue;
    map.set(item.iso, (map.get(item.iso) || 0) + 1);
  }
  return Object.values(byIso).filter((country) => map.get(country.iso)).map((country) => ({
    ...country,
    rings: [country.outline],
    count: map.get(country.iso)
  }));
}
function dotMap(section) {
  const places = countsFor(section);
  const w = 480;
  const h = 240;
  const lines = [];
  for (let lon = -120; lon <= 150; lon += 60) lines.push(`<line x1="${((lon + 180) / 360) * w}" y1="0" x2="${((lon + 180) / 360) * w}" y2="${h}"/>`);
  for (let lat = -60; lat <= 60; lat += 30) lines.push(`<line x1="0" y1="${((90 - lat) / 180) * h}" x2="${w}" y2="${((90 - lat) / 180) * h}"/>`);
  const dots = places.map((country) => {
    const x = ((country.lon + 180) / 360) * w;
    const y = ((90 - country.lat) / 180) * h;
    const r = country.count >= 12 ? 5 : country.count >= 4 ? 3.5 : 2.5;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r}"/>`;
  }).join("");
  return `<svg class="kk-map kk-dots" viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect class="kk-map-ocean" width="${w}" height="${h}"/><g class="kk-graticule">${lines.join("")}</g>${dots}</svg>`;
}
function guideCard(href, title, count, section, blurb, photo) {
  return `<article class="kk-guide">
      <a href="${href}">${photoFigure(photo, { sizes: "(min-width: 900px) 28vw, 92vw", frame: "kk-shot kk-shot-plain" }).replace(/<figcaption[\s\S]*?<\/figcaption>/, "")}
        <p class="kk-kicker">Guide</p><h3>${escapeHtml(title)}</h3><p>${count} recipes</p><p class="kk-meta">${escapeHtml(blurb)}</p>
      </a>
      <p class="kk-caption">${escapeHtml(photo.caption)} Photograph by ${escapeHtml(photo.artist)}. <a href="${escapeHtml(photo.licenseUrl)}">${escapeHtml(photo.license)}</a>.</p>
    </article>`;
}
function browseBlock(items) {
  const regions = [...new Set(items.map((item) => item.region).filter(Boolean))].sort();
  const continents = ["Africa", "Americas", "Asia", "Europe", "Oceania"].filter((name) => items.some((item) => item.continent === name));
  return `<section id="kk-browse" class="kk-browse" data-kk-filter>
      <h2>Browse by place</h2>
      <div class="kk-filters">
        <div class="kk-chips" role="group" aria-label="Continent">
          <button type="button" class="is-on" data-continent-value="all" aria-pressed="true">All</button>
          ${continents.map((name) => `<button type="button" data-continent-value="${name}" aria-pressed="false">${name}</button>`).join("")}
        </div>
        <label>Region <select aria-label="Region"><option value="all">All regions</option>${regions.map((region) => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`).join("")}</select></label>
        <p class="kk-meta" data-kk-count>${items.length} recipes</p>
      </div>
      <div class="kk-rcards">${items.map((item) => recipeCard(item, true)).join("")}</div>
    </section>
    <script src="/assets/js/filter.js" defer></script>`;
}
const homeMap = worldSvg(countries, 960, 480, (iso) => `/map/#${iso}`, true);
const atlasMap = worldSvg(countries, 960, 480, (iso) => `#${iso}`);
const DAY_JOURNEYS = [
  { slug: "day-france-italy-argentina", title: "Breakfast in France, lunch in Italy, dinner in Argentina", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/crepes-suzette/" },
    { meal: "Lunch", href: "/flying-sauces/sauces/arrabbiata/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/argentine-asado/" },
    { meal: "At the table", href: "/flying-sauces/sauces/chimichurri/" }
  ]},
  { slug: "day-india-malaysia-korea", title: "Breakfast in India, lunch in Malaysia, dinner in Korea", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/masala-dosa/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/malaysian-satay-ayam/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/korean-bulgogi/" }
  ]},
  { slug: "day-china-greece-carolina", title: "Breakfast in China, lunch in Greece, dinner in North Carolina", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/tianjin-jianbing/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/greek-souvlaki/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/eastern-nc-whole-hog/" }
  ]},
  { slug: "day-ethiopia-singapore-mexico", title: "Breakfast in Ethiopia, lunch in Singapore, dinner in Mexico", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/injera/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/singapore-hawker-satay/" },
    { meal: "Dinner", href: "/flying-sauces/sauces/mole-poblano/" }
  ]},
  { slug: "day-netherlands-japan-india", title: "Breakfast in the Netherlands, lunch in Japan, dinner in India", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/poffertjes/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/japanese-yakitori/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/tandoori-chicken/" }
  ]},
  { slug: "day-russia-elsalvador-argentina", title: "Breakfast in Russia, lunch in El Salvador, dinner in Argentina", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/syrniki/" },
    { meal: "Lunch", href: "/flying-pancakes/pancakes/pupusas/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/argentine-vacio/" }
  ]},
  { slug: "day-malaysia-italy-jamaica", title: "Breakfast in Malaysia, lunch in Italy, dinner in Jamaica", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/roti-canai/" },
    { meal: "Lunch", href: "/flying-sauces/sauces/burro-e-salvia/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/jamaican-jerk-chicken/" }
  ]},
  { slug: "day-poland-japan-kansas", title: "Breakfast in Poland, lunch in Japan, dinner in Kansas City", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/potato-latkes/" },
    { meal: "Lunch", href: "/flying-pancakes/pancakes/osaka-okonomiyaki/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/kansas-city-burnt-ends/" }
  ]},
  { slug: "day-kerala-colombia-argentina", title: "Breakfast in Kerala, lunch in Colombia, dinner in Argentina", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/appam/" },
    { meal: "Lunch", href: "/flying-pancakes/pancakes/colombian-arepas/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/choripan/" }
  ]},
  { slug: "day-colombia-india-hawaii", title: "Breakfast in Colombia, lunch in India, dinner in Hawaii", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/arepa-boyacense/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/seekh-kebab/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/kalua-pig/" }
  ]},
  { slug: "day-china-elsalvador-mexico", title: "Breakfast in China, lunch in El Salvador, dinner in Mexico", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/shandong-jianbing/" },
    { meal: "Lunch", href: "/flying-pancakes/pancakes/pupusas/" },
    { meal: "Dinner", href: "/flying-sauces/sauces/mole-poblano/" }
  ]},
  { slug: "day-in-india", title: "A day in India", lede: "Breakfast, lunch, and dinner from Indian recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/paper-dosa/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/seekh-kebab/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/tandoori-chicken/" }
  ]},
  { slug: "day-in-australia", title: "A day in Australia", lede: "Breakfast, lunch, and dinner from Australian recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/australian-pancakes/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/australian-prawns/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/australian-lamb-chops/" }
  ]},
  { slug: "day-samoa-australia-newzealand", title: "Breakfast in Samoa, lunch in Australia, dinner in New Zealand", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/samoan-panikeke/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/australian-barramundi/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/maori-hangi/" }
  ]},
  { slug: "day-newzealand-fiji", title: "Breakfast in New Zealand, dinner in Fiji", lede: "A sweet breakfast and a coconut dinner from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/new-zealand-pikelets/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/fijian-lovo/" }
  ]},
  { slug: "day-ghana-nigeria-ethiopia", title: "Breakfast in Ghana, lunch in Nigeria, dinner in Ethiopia", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/ghanaian-tatale/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/nigerian-suya/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/ethiopian-tibs/" }
  ]},
  { slug: "day-in-morocco", title: "A day in Morocco", lede: "Breakfast, lunch, and dinner from Moroccan recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/moroccan-baghrir/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/moroccan-kefta-brochettes/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/moroccan-mechoui/" }
  ]},
  { slug: "day-in-south-africa", title: "A day in South Africa", lede: "Breakfast, lunch, and dinner from South African recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/south-african-pannekoek/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/cape-malay-sosaties/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/south-african-boerewors/" }
  ]},
  { slug: "day-kenya-tanzania", title: "Breakfast in Kenya, lunch in Tanzania, dinner in Kenya", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/kenyan-chapati/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/tanzanian-mishkaki/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/kenyan-nyama-choma/" }
  ]},
  { slug: "day-morocco-mali-senegal", title: "Breakfast in Morocco, lunch in Mali, dinner in Senegal", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/msemen/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/mali-lamb-brochettes/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/senegalese-dibi/" }
  ]},
  { slug: "day-egypt-mozambique", title: "Lunch in Egypt, dinner in Mozambique", lede: "A grilled lunch and a charcoal dinner from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Lunch", href: "/flying-bbq/dishes/egyptian-kofta/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/mozambican-peri-peri-chicken/" }
  ]},
  { slug: "day-zambia-ghana-zimbabwe", title: "Breakfast in Zambia, lunch in Ghana, dinner in Zimbabwe", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/zambian-vitumbuwa/" },
    { meal: "Lunch", href: "/flying-bbq/dishes/ghanaian-kyinkyinga/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/zimbabwean-braai-chicken/" }
  ]},
  { slug: "day-jamaica-france-mexico", title: "Breakfast in Jamaica, lunch in France, dinner in Mexico", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/jamaican-festival/" },
    { meal: "Lunch", href: "/flying-pancakes/pancakes/crepes-suzette/" },
    { meal: "Dinner", href: "/flying-sauces/sauces/mole-poblano/" }
  ]},
  { slug: "day-samoa-tonga", title: "Breakfast in Samoa, dinner in Tonga", lede: "A fried breakfast and a steamed dinner from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/samoan-panikeke/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/tongan-umu/" }
  ]},
  { slug: "day-poland-italy-argentina", title: "Breakfast in Poland, lunch in Italy, dinner in Argentina", lede: "Three meals from recipes already on this site. The note under each stop is that recipe’s own description.", stops: [
    { meal: "Breakfast", href: "/flying-pancakes/pancakes/potato-latkes/" },
    { meal: "Lunch", href: "/flying-sauces/sauces/arrabbiata/" },
    { meal: "Dinner", href: "/flying-bbq/dishes/argentine-vacio/" }
  ]}
];
const JOURNEYS = [
  ...DAY_JOURNEYS,
  {
    slug: "street-food-asia",
    title: "A week of street food in Asia",
    lede: "Seven recipes already filed in Asia. The note under each title is the description on that recipe page.",
    stops: [
      "/flying-bbq/dishes/malaysian-satay-ayam/",
      "/flying-pancakes/pancakes/roti-canai/",
      "/flying-bbq/dishes/singapore-hawker-satay/",
      "/flying-pancakes/pancakes/tianjin-jianbing/",
      "/flying-pancakes/pancakes/osaka-okonomiyaki/",
      "/flying-bbq/dishes/japanese-yakitori/",
      "/flying-pancakes/pancakes/masala-dosa/"
    ]
  },
  {
    slug: "fire-in-the-americas",
    title: "Fire in the Americas",
    lede: "Six recipes already filed in the Americas. The note under each title is the description on that recipe page.",
    stops: [
      "/flying-bbq/dishes/argentine-asado/",
      "/flying-bbq/dishes/choripan/",
      "/flying-bbq/dishes/argentine-vacio/",
      "/flying-bbq/dishes/kansas-city-burnt-ends/",
      "/flying-bbq/dishes/eastern-nc-whole-hog/",
      "/flying-bbq/dishes/jamaican-jerk-chicken/"
    ]
  },
  {
    slug: "seven-batters",
    title: "Seven batters",
    lede: "Seven pancake recipes from seven places already on this site. The note under each title is the description on that recipe page.",
    stops: [
      "/flying-pancakes/pancakes/injera/",
      "/flying-pancakes/pancakes/appam/",
      "/flying-pancakes/pancakes/crepes-suzette/",
      "/flying-pancakes/pancakes/poffertjes/",
      "/flying-pancakes/pancakes/potato-latkes/",
      "/flying-pancakes/pancakes/pupusas/",
      "/flying-pancakes/pancakes/syrniki/"
    ]
  }
];

const featuredItems = [
  "/flying-sauces/sauces/pesto-alla-genovese/",
  "/flying-pancakes/pancakes/crepes-suzette/",
  "/flying-bbq/dishes/argentine-asado/",
  "/flying-sauces/sauces/mole-poblano/",
  "/flying-pancakes/pancakes/appam/",
  "/flying-bbq/dishes/eastern-nc-whole-hog/"
].map((href) => catalog.find((item) => item.href === href)).filter(Boolean);
const weekRecipe = featuredItems[Math.floor(Date.now() / 604800000) % featuredItems.length];
const featuredDay = DAY_JOURNEYS[0];
const cookbookPicks = guideBooks.filter((book) => /top-100|flagship|american-bbq-belt|crepes-of-france|top 100/i.test(`${book.slug} ${book.title}`)).slice(0, 6);

write("index.html", page({
  title: "Kite Kitchen · Flying around the world recipes",
  description: "Kite Kitchen means flying around the world, one simple recipe at a time. Sauces, pancakes, and barbecue, with a world map.",
  path: "/",
  image: "/assets/og/home.jpg",
  current: "home",
  jsonLd: homeLd,
  scripts: `<script src="/assets/js/atlas.js" defer></script>`,
  extraHead: home_hero_photo ? `<link rel="preload" as="image" type="image/avif" href="/assets/photos/editorial/hero-1280.avif" imagesrcset="/assets/photos/editorial/hero-768.avif 768w, /assets/photos/editorial/hero-1280.avif 1280w, /assets/photos/editorial/hero-1920.avif 1920w" imagesizes="100vw">` : "",
  main: `<section class="kk-hero">
      <div class="kk-hero-inner">
        <p class="kk-kicker">World recipes</p>
        <h1>Kite Kitchen</h1>
        <p class="kk-lede">${TAGLINE}.</p>
        ${searchForm("home-q", "Pesto, dosa, asado")}
        ${home_hero_photo ? photoFigure(EDITORIAL.hero, { eager: true, sizes: "100vw", frame: "kk-shot kk-hero-shot" }) : ""}
      </div>
    </section>
    <div class="kk-wrap kk-home">
      <h2>Recipe of the week</h2>
      <article class="kk-week">
        ${(() => {
          const photo = CARD_PHOTO[weekRecipe.href] || DISH_PHOTO[weekRecipe.href.split("/").filter(Boolean).at(-1)];
          return photo ? photoFigure(photo, { eager: true, sizes: "(min-width: 800px) 34rem, 92vw", frame: "kk-shot" }) : "";
        })()}
        <div>
          <p class="kk-kicker">${escapeHtml(weekRecipe.country || weekRecipe.section)}</p>
          <h3><a href="${weekRecipe.href}">${escapeHtml(weekRecipe.title)}</a></h3>
          <p>${escapeHtml(weekRecipe.text)}</p>
          <p class="kk-meta">${escapeHtml([weekRecipe.region, weekRecipe.section].filter(Boolean).join(" · "))}</p>
        </div>
      </article>
      <h2>A day around the world</h2>
      <article class="kk-day-home">
        <p class="kk-kicker">Journey</p>
        <h3><a href="/journeys/${featuredDay.slug}/">${escapeHtml(featuredDay.title)}</a></h3>
        <p>${escapeHtml(featuredDay.lede)}</p>
        ${routeSvg(featuredDay.stops.map((stop) => catalog.find((entry) => entry.href === stop.href)).map((item) => byIso[item.iso]).filter(Boolean))}
        <p class="kk-meta"><a href="/journeys/">All journeys</a></p>
      </article>
      <h2>Featured recipes</h2>
      <div class="kk-rcards">${featuredItems.map((item) => recipeCard(item)).join("")}</div>
      <h2>Browse by continent</h2>
      <div class="kk-continents">${["Africa", "Americas", "Asia", "Europe", "Oceania"].map((name) => {
        const items = catalog.filter((item) => item.continent === name);
        const regions = new Set(items.map((item) => item.region).filter(Boolean));
        return `<a class="kk-continent" href="/recipes/?continent=${encodeURIComponent(name)}"><span class="kk-kicker">${name}</span><strong>${regions.size} ${regions.size === 1 ? "region" : "regions"}</strong><span>${items.length} recipes</span></a>`;
      }).join("")}</div>
      ${ad("home", "inline")}
      <p class="kk-shop-strip"><a href="/shop/">The Kite Kitchen shop is coming soon.</a></p>
      <h2>The guides</h2>
      <div class="kk-guides">
        ${guideCard("/flying-sauces/", "Flying Sauces", sauceCount, "Flying Sauces", "Sauces from the table, the mortar, and the market.", EDITORIAL.chimichurri)}
        ${guideCard("/flying-pancakes/", "Flying Pancakes", pancakeCount, "Flying Pancakes", "Batters, griddles, and the pancakes that travel with them.", EDITORIAL.crepes)}
        ${guideCard("/flying-bbq/", "Flying BBQ", bbqCount, "Flying BBQ", "Fire, smoke, and the dishes cooked over them.", EDITORIAL.hog)}
      </div>
      <h2>Journeys</h2>
      <p class="kk-meta">Reading orders made from recipes already on this site. Each note is the description on that recipe.</p>
      <div class="kk-rcards">${JOURNEYS.map((journey) => `<article class="kk-rcard"><p class="kk-kicker">${journey.stops.length} recipes</p><h3><a href="/journeys/${journey.slug}/">${escapeHtml(journey.title)}</a></h3><p>${escapeHtml(journey.lede)}</p></article>`).join("")}</div>
      <h2>World map</h2>
      <p class="kk-meta">Shaded countries have recipes. Open one to see what is cooked there.</p>
      ${plate(homeMap, "Atlas plate")}
      <p class="kk-meta"><a href="/map/">Open the full world map</a></p>
      <h2>Recipe cookbooks</h2>
      <div class="kk-rcards">${cookbookPicks.map((book) => `<article class="kk-rcard"><p class="kk-kicker">${escapeHtml(book.section)}</p><h3><a href="${book.href}">${escapeHtml(book.title)}</a></h3><p class="kk-meta">Coming soon</p></article>`).join("")}</div>
      <p class="kk-meta"><a href="/books/">All cookbooks</a></p>
    </div>`
}));

write("recipes/index.html", page({
  title: "Recipes · Kite Kitchen",
  description: "Browse Flying Sauces, Flying Pancakes, and Flying BBQ by continent and region.",
  path: "/recipes/",
  image: "/assets/og/recipes.jpg",
  current: "recipes",
  main: `<div class="kk-wrap">
    ${crumbs([["/", "Kite Kitchen"], ["/recipes/", "Recipes"]])}
    <h1>Recipes</h1>
    <p class="kk-lede">${TAGLINE}.</p>
    ${searchForm("recipes-q", "Name or place")}
    ${ad("recipes-top", "inline", true)}
    ${browseBlock(catalog)}
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
  image: "/assets/og/shop.jpg",
  current: "shop",
  main: `<div class="kk-wrap">
      ${crumbs([["/", "Kite Kitchen"], ["/shop/", "Shop"]])}
      <p class="kk-pill">Coming soon</p>
      <h1>The Kite Kitchen shop</h1>
      <p class="kk-lede">The Kite Kitchen shop is coming soon. These are mockups and book titles. There is no checkout and no prices.</p>
      ${ad("shop", "inline")}
      <form class="kk-notify" action="mailto:${HELLO_EMAIL}" method="post" enctype="text/plain">
        <label for="notify">What should the note say?</label>
        <input id="notify" name="note" type="text" value="Please tell me when the KiteKitchen shop opens.">
        <button type="submit">Email ${HELLO_EMAIL}</button>
      </form>
      <p class="kk-note">The form opens your email app and writes to ${HELLO_EMAIL}.</p>
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
        <p>The picture is an original mockup drawn for this shop. It is not a photograph of a finished product. No price is listed.</p>
        ${ad("product", "inline", true)}
        <p class="kk-row"><a class="kk-button" href="mailto:${HELLO_EMAIL}?subject=${encodeURIComponent(item.title)}">Email about this item</a><a class="kk-button quiet" href="/shop/">All shop items</a></p>
      </article>`
  }));
}
writeMoved("shop/kite-festival-cookbook/index.html", "/books/");

for (const book of guideBooks) {
  const prefix = book.section === "Flying Sauces" ? "sauces" : book.section === "Flying Pancakes" ? "pancakes" : "bbq";
  const rel = `assets/brand/covers/${prefix}-${book.slug}.svg`;
  write(rel, coverSvg(book));
  book.cover = `/${rel}`;
  const pagePath = path.join(root, book.href.slice(1), "index.html");
  if (fs.existsSync(pagePath)) {
    const html = fs.readFileSync(pagePath, "utf8").replace(/<img class="cover"[^>]*>/, `<img class="cover kk-cover" src="${book.cover}" alt="Original cover design for ${escapeHtml(book.title)}" width="600" height="800">`);
    fs.writeFileSync(pagePath, html);
  }
}

write("books/index.html", page({
  title: "Books · KiteKitchen",
  description: "Cookbooks from Flying Sauces, Flying Pancakes, and Flying BBQ. Coming soon, with no prices.",
  path: "/books/",
  image: "/assets/og/books.jpg",
  current: "",
  scripts: `<script src="/assets/js/filter.js" defer></script>`,
  main: `<div class="kk-wrap">${crumbs([["/", "Kite Kitchen"], ["/books/", "Cookbooks"]])}
    <h1>Recipe cookbooks</h1>
    <p class="kk-lede">Titles imported with Flying Sauces, Flying Pancakes, and Flying BBQ. Coming soon. Nothing here has a price.</p>
    <section data-kk-filter data-kk-noun="title">
      <div class="kk-filters">
        <div class="kk-chips" role="group" aria-label="Guide">
          <button type="button" class="is-on" data-continent-value="all" aria-pressed="true">All</button>
          <button type="button" data-continent-value="Flying Sauces" aria-pressed="false">Flying Sauces</button>
          <button type="button" data-continent-value="Flying Pancakes" aria-pressed="false">Flying Pancakes</button>
          <button type="button" data-continent-value="Flying BBQ" aria-pressed="false">Flying BBQ</button>
        </div>
        <p class="kk-meta" data-kk-count>${guideBooks.length} titles</p>
      </div>
      <div class="kk-grid kk-books">${guideBooks.map((book) => `<article class="kk-card kk-book" data-continent="${escapeHtml(book.section)}"><a href="${book.href}"><img class="kk-cover" src="${book.cover}" alt="Original cover design for ${escapeHtml(book.title)}" width="300" height="400"></a><p class="kk-kicker">${escapeHtml(book.section)}</p><h2><a href="${book.href}">${escapeHtml(book.title)}</a></h2><p class="kk-pill">Coming soon</p></article>`).join("")}</div>
    </section>
  </div>`
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
    <h2>Photographs on the home page</h2>
    <ul class="kk-sources">${Object.values(EDITORIAL).map((photo) => `<li>${escapeHtml(photo.caption)} Photograph by ${escapeHtml(photo.artist)}. <a href="${escapeHtml(photo.licenseUrl)}">${escapeHtml(photo.license)}</a>. <a href="${escapeHtml(photo.sourceUrl)}">Wikimedia Commons</a>.</li>`).join("")}</ul>
    <p>The crest, the cookbook covers, and the small compass are original artwork for this site. Recipe photographs are credited above.</p>
  </div>`
}));

write("about/index.html", page({
  title: "About · KiteKitchen",
  description: "Kite Kitchen means flying around the world and tasting different foods, one simple recipe at a time.",
  path: "/about/",
  image: "/assets/og/about.jpg",
  main: `<article class="kk-wrap">${crumbs([["/", "Kite Kitchen"], ["/about/", "About"]])}
    <figure class="kk-about-crest"><img src="/assets/brand/logo-full.webp" alt="The full Kite Kitchen crest: a gold kite inside an ornamental frame, with the name Kite Kitchen" width="360" height="467"></figure>
    <h1>About Kite Kitchen</h1>
    <p>The name Kite Kitchen means flying around the world and tasting different foods. ${TAGLINE}.</p>
    <p>Three guides keep their own names here: Flying Sauces, Flying Pancakes, and Flying BBQ. A recipe stays with the guide and the place it was already filed under. The world map, the region pages, and the continent list are ways to move between those recipes.</p>
    <p>The crest is the gold kite in its frame. This page shows the full crest. The header uses the kite with the wordmark.</p>
    <p>The public address is <a href="${SITE_ORIGIN}/">kitekitchen.com</a>. Counts on the site are the entries imported from the three guides. This site does not add reviews or star ratings.</p>
    <p>The Kite Kitchen shop is coming soon. Nothing here is priced or for sale.</p>
    <p>Write to <a href="mailto:${HELLO_EMAIL}">${HELLO_EMAIL}</a>.</p>
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
    <p class="kk-note">Write to ${HELLO_EMAIL}.</p>
  </article>`
}));

write("affiliate/index.html", page({
  title: "Affiliate disclosure · KiteKitchen",
  description: "Kite Kitchen has no affiliate links yet. This page is the disclosure text if an affiliate program is added later.",
  path: "/affiliate/",
  main: `<article class="kk-wrap"><h1>Affiliate disclosure</h1>
    <p>KiteKitchen does not use affiliate links today. No product link on this site is paid, and none is an Amazon Associates link.</p>
    <p>If that changes, pages with a paid link will say so near the link. A purchase through an affiliate link can earn this site a commission at no extra cost to you. That commission would not change the recipes, the sources, or the decision to show a product. The shop is coming soon, and nothing is for sale now.</p>
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
    <p>The shop is coming soon. A “Coming soon” label is not an offer to sell. No prices are listed. Do not send payment.</p>
    <p>Flying Sauces, Flying Pancakes, and Flying BBQ keep the text imported from those guides.</p>
    <p>Contact <a href="mailto:${HELLO_EMAIL}">${HELLO_EMAIL}</a>.</p>
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

function regionIntro(region, items) {
  const counts = new Map();
  for (const item of items) counts.set(item.section, (counts.get(item.section) || 0) + 1);
  const parts = [...counts.entries()].map(([section, count]) => `${count} from ${section}`);
  const countries = [...new Set(items.map((item) => item.country).filter(Boolean))].sort();
  return `${items.length} recipes are filed under ${region}: ${parts.join(", ")}. Countries named on those pages: ${countries.join(", ")}.`;
}

const byRegion = new Map();
for (const item of catalog) {
  if (!item.region) continue;
  if (!byRegion.has(item.region)) byRegion.set(item.region, []);
  byRegion.get(item.region).push(item);
}
const regionLinks = [...byRegion.keys()].sort().map((region) => `<li><a href="/regions/${regionSlug(region)}/">${escapeHtml(region)}</a> <span class="kk-meta">${byRegion.get(region).length}</span></li>`).join("");
for (const [region, items] of byRegion) {
  const slug = regionSlug(region);
  const continent = CONTINENT[region] || "";
  write(`regions/${slug}/index.html`, page({
    title: `${region} · Kite Kitchen`,
    description: `${items.length} recipes filed under ${region}${continent ? `, ${continent}` : ""}.`,
    path: `/regions/${slug}/`,
    current: "map",
    scripts: `<script src="/assets/js/atlas.js" defer></script>`,
    main: `<div class="kk-wrap">
      ${crumbs([["/", "Kite Kitchen"], ["/map/", "World map"], [`/regions/${slug}/`, region]])}
      <p class="kk-kicker">${escapeHtml(continent || "Recipes")}</p>
      <h1>${escapeHtml(region)}</h1>
      <p class="kk-lede">${regionIntro(region, items)}</p>
      ${plate(worldSvg(Object.values(byIso).map((country) => ({ ...country, count: items.some((item) => item.iso === country.iso) ? items.filter((item) => item.iso === country.iso).length : 0 })), 640, 320, (iso) => `/map/#${iso}`, true), `${region} on the world map`)}
      <p class="kk-meta"><a href="/map/">Back to the world map</a></p>
      <ul class="kk-recipe-list">${items.map((item) => `<li><a href="${item.href}">${escapeHtml(item.title)}</a> <span class="kk-meta">${escapeHtml(item.country || item.section)}</span></li>`).join("")}</ul>
    </div>`
  }));
}
const countryBlocks = [...byCountry.entries()].sort((a, b) => byIso[a[0]].name.localeCompare(byIso[b[0]].name)).map(([iso, items]) => {
  const place = byIso[iso];
  const ns = place.lat >= 0 ? "N" : "S";
  const ew = place.lon >= 0 ? "E" : "W";
  const label = `${Math.abs(Math.round(place.lat))}° ${ns}, ${Math.abs(Math.round(place.lon))}° ${ew}`;
  const regions = [...new Set(items.map((item) => item.region).filter(Boolean))];
  const regionHtml = regions.map((region) => `<a href="/regions/${regionSlug(region)}/">${escapeHtml(region)}</a>`).join(", ");
  return `<section id="${iso}" class="kk-country"><h2>${escapeHtml(place.name)}</h2><p class="kk-meta">${label}${regionHtml ? ` · ${regionHtml}` : ""}</p><ul class="kk-recipe-list">${items.map((item) => `<li><a href="${item.href}">${escapeHtml(item.title)}</a> <span class="kk-meta">${escapeHtml(item.section)}</span></li>`).join("")}</ul></section>`;
}).join("");
write("map/index.html", page({
  title: "World map · Kite Kitchen",
  description: "A simple world map of Flying Sauces, Flying Pancakes, and Flying BBQ. Choose a country to see its recipes.",
  path: "/map/",
  image: "/assets/og/map.jpg",
  current: "map",
  scripts: `<script src="/assets/js/atlas.js" defer></script>`,
  main: `<div class="kk-wrap">${crumbs([["/", "Kite Kitchen"], ["/map/", "World map"]])}
    <h1>World map</h1>
    <p class="kk-lede">Flying around the world, one recipe at a time. Shaded countries have recipes. The shapes are a simplified public-domain country map.</p>
    ${ad("map", "inline", true)}
    ${plate(atlasMap, "Atlas plate")}
    <h2>Regions</h2>
    <ul class="kk-recipe-list">${regionLinks}</ul>
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
  description: "That page is not on Kite Kitchen.",
  path: "/404.html",
  image: "/assets/og/lost.jpg",
  robots: "noindex",
  main: `<article class="kk-wrap kk-missing">
    <img class="kk-compass-lg" src="/assets/brand/compass.svg" alt="" width="96" height="96">
    <p class="kk-kicker">Off the map</p>
    <h1>That page is not here</h1>
    <p class="kk-lede">The route does not match a recipe on Kite Kitchen.</p>
    ${searchForm("missing-q", "Pesto, dosa, asado")}
    <p class="kk-row"><a class="kk-button" href="/">Back to Kite Kitchen</a><a class="kk-button quiet" href="/map/">World map</a><a class="kk-button quiet" href="/recipes/">Recipes</a></p>
  </article>`
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

function journeyStops(journey) {
  return journey.stops.map((stop, index) => {
    const href = typeof stop === "string" ? stop : stop.href;
    const meal = typeof stop === "string" ? `Recipe ${index + 1}` : stop.meal;
    const item = catalog.find((entry) => entry.href === href);
    if (!item) throw new Error(`Missing journey recipe ${href}`);
    return { ...item, meal };
  });
}
function stopFigure(item) {
  const slug = item.href.split("/").filter(Boolean).at(-1);
  const photo = DISH_PHOTO[slug] || CARD_PHOTO[item.href];
  if (photo) return photoFigure(photo, { sizes: "(min-width: 800px) 18rem, 92vw", frame: "kk-shot" });
  return locatorFigure(item.iso, item.country);
}
for (const journey of JOURNEYS) {
  const stops = journeyStops(journey);
  const places = stops.map((item) => byIso[item.iso]).filter((place) => place && Number.isFinite(place.lat));
  const route = places.length >= 2 ? routeSvg(places) : "";
  const list = stops.map((item) => `<li class="kk-stop kk-day-stop"><div class="kk-day-media">${stopFigure(item)}</div><div><p class="kk-kicker">${escapeHtml(item.meal)} · ${escapeHtml(item.country || item.section)}</p><h2><a href="${item.href}">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.text)}</p><p class="kk-meta">${escapeHtml([item.region, item.section].filter(Boolean).join(" · "))}</p></div></li>`).join("");
  write(`journeys/${journey.slug}/index.html`, page({
    title: `${journey.title} · Kite Kitchen`,
    description: journey.lede,
    path: `/journeys/${journey.slug}/`,
    image: "/assets/og/journeys.jpg",
    current: "journeys",
    main: `<article class="kk-wrap">${crumbs([["/", "Kite Kitchen"], ["/journeys/", "Journeys"], [`/journeys/${journey.slug}/`, journey.title]])}
      <p class="kk-kicker">Journey</p>
      <h1>${escapeHtml(journey.title)}</h1>
      <p class="kk-lede">${escapeHtml(journey.lede)}</p>
      ${route}
      <ol class="kk-stops">${list}</ol>
    </article>`
  }));
}
function dayContinents(journey) {
  const names = new Set();
  for (const stop of journey.stops) {
    const href = typeof stop === "string" ? stop : stop.href;
    const item = catalog.find((entry) => entry.href === href);
    if (item && item.continent) names.add(item.continent);
  }
  return [...names];
}
const dayCards = DAY_JOURNEYS.map((journey) => {
  const continents = dayContinents(journey);
  return `<article class="kk-rcard" data-day data-continents="${escapeHtml(continents.join(" "))}"><p class="kk-kicker">${escapeHtml(continents.join(" · "))}</p><h3><a href="/journeys/${journey.slug}/">${escapeHtml(journey.title)}</a></h3><p>${escapeHtml(journey.lede)}</p></article>`;
}).join("");
const routeCards = JOURNEYS.filter((journey) => !DAY_JOURNEYS.includes(journey)).map((journey) => `<article class="kk-rcard"><p class="kk-kicker">${journey.stops.length} recipes</p><h3><a href="/journeys/${journey.slug}/">${escapeHtml(journey.title)}</a></h3><p>${escapeHtml(journey.lede)}</p></article>`).join("");
write("journeys/index.html", page({
  title: "Journeys · Kite Kitchen",
  description: "A day around the world, and longer reading orders, from recipes already on Kite Kitchen.",
  path: "/journeys/",
  image: "/assets/og/journeys.jpg",
  current: "journeys",
  main: `<div class="kk-wrap">${crumbs([["/", "Kite Kitchen"], ["/journeys/", "Journeys"]])}
    <p class="kk-kicker">Itineraries</p>
    <h1>Journeys</h1>
    <p class="kk-lede">A day is breakfast, lunch, and dinner from recipes already published here. The note under each stop is that recipe’s own description.</p>
    <h2>A day around the world</h2>
    <div class="kk-filters">
      <div class="kk-chips" role="group" aria-label="Continent">
        ${["All", "Africa", "Americas", "Asia", "Europe", "Oceania"].map((name, index) => `<button type="button"${index === 0 ? ' class="is-on"' : ""} data-day-continent="${name === "All" ? "all" : name}" aria-pressed="${index === 0 ? "true" : "false"}">${name}</button>`).join("")}
      </div>
      <button type="button" class="kk-button" data-surprise>Surprise me</button>
      <p class="kk-meta" data-day-count></p>
    </div>
    <div class="kk-rcards" id="kk-days">${dayCards}</div>
    <script src="/assets/js/days.js" defer></script>
    <h2>Longer routes</h2>
    <div class="kk-rcards">${routeCards}</div>
  </div>`
}));
writeMoved("cookbooks/index.html", "/books/");

const searchItems = catalog.map((item) => {
  const slug = item.href.split("/").filter(Boolean).at(-1);
  const photo = DISH_PHOTO[slug] || CARD_PHOTO[item.href];
  const place = byIso[item.iso];
  const width = photo ? photo.widths[photo.widths.length - 1] : 0;
  return {
    title: item.title,
    href: item.href,
    section: item.section,
    text: item.text,
    country: item.country || "",
    region: item.region || "",
    thumb: photo ? `/assets/photos/editorial/${photo.id}-${width}.jpg` : "",
    lat: place ? place.lat : null,
    lon: place ? place.lon : null
  };
});
write("assets/search-index.json", JSON.stringify(searchItems));
write("search/index.html", page({
  title: "Search · KiteKitchen",
  description: "Search Flying Sauces, Flying Pancakes, and Flying BBQ by dish, country, or guide.",
  path: "/search/",
  image: "/assets/og/search.jpg",
  current: "",
  main: `<div class="kk-wrap">${crumbs([["/", "Kite Kitchen"], ["/search/", "Search"]])}
    <h1>Search</h1>
    <p class="kk-lede">Type a dish, a country, or a guide. Results stay in the browser.</p>
    ${searchForm("q", "Pesto, dosa, asado", "search-form")}
    <p id="search-status" class="kk-meta" role="status" aria-live="polite"></p>
    <p id="search-empty" class="kk-empty" hidden>Nothing matches that search. Try a dish, a country, or a guide.</p>
    <div id="results" class="kk-results"></div>
    <svg id="kk-land" hidden><rect width="160" height="80" fill="#f4f0e8"/><path d="M0 40H160M40 0V80M80 0V80M120 0V80" stroke="#e4ddd2" stroke-width="0.45"/><g fill="#ead7ae" stroke="#1a1a1a" stroke-width="0.6">${MINI_LANDS}</g></svg>
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

function prioritySlugs() {
  const picked = new Set([
    "pesto-alla-genovese", "mole-poblano", "crepes-suzette", "appam", "argentine-asado", "eastern-nc-whole-hog"
  ]);
  const files = [
    ["flying-sauces/data/index.json", "sauces"],
    ["flying-pancakes/data/index.json", "pancakes"],
    ["flying-bbq/data/index.json", "dishes"]
  ];
  for (const [file, key] of files) {
    const data = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
    for (const item of (data[key] || []).slice(0, 30)) picked.add(item.slug);
  }
  return picked;
}

function polishRecipes() {
  const priority = prioritySlugs();
  const sections = [["flying-sauces", "sauces", "Flying Sauces"], ["flying-pancakes", "pancakes", "Flying Pancakes"], ["flying-bbq", "dishes", "Flying BBQ"]];
  for (const [dir, folder, name] of sections) {
    for (const slug of dirs(`${dir}/${folder}`)) {
      const file = path.join(root, dir, folder, slug, "index.html");
      let html = fs.readFileSync(file, "utf8");
      if (!html.includes("kk-crumbs")) {
        const title = textOf(html, /<h1[^>]*>([\s\S]*?)<\/h1>/);
        const crumb = `<nav class="kk-crumbs" aria-label="Breadcrumb"><a href="/">Kite Kitchen</a><a href="/${dir}/">${escapeHtml(name)}</a><span aria-current="page">${escapeHtml(title)}</span></nav>`;
        html = html.replace(/<p class="eyebrow">/, `${crumb}\n        <p class="eyebrow">`);
      }
      if (!html.includes("kk-info")) {
        html = html.replace(/<p class="meta recipe-meta">([^<]*)<\/p>/, (_, text) => {
          const parts = text.split("·").map((part) => part.trim()).filter(Boolean);
          if (!parts.length) return _;
          return `<ul class="kk-info" aria-label="Time and servings">${parts.map((part) => `<li>${escapeHtml(part)}</li>`).join("")}</ul>`;
        });
      }
      if (!html.includes("kk-method")) {
        html = html.replace(/(<h2[^>]*>\s*Ingredients\s*<\/h2>\s*<ul class="ingredients">[\s\S]*?<\/ul>\s*<h2 class="steps-heading">[\s\S]*?<\/h2>\s*<ol class="steps">[\s\S]*?<\/ol>)/, `<div class="kk-method">$1</div>`);
      }
      if (DISH_PHOTO[slug]) {
        const figure = photoFigure(DISH_PHOTO[slug], { eager: true, sizes: "(min-width: 900px) 68vw, 100vw", frame: "kk-shot kk-hero-shot" }).replace("<figure ", `<figure data-photo="${slug}" `);
        const replaced = html.replace(/<figure\b[^>]*class="(?:photo-hero|pancake-hero|stop-hero|kk-locator-fallback|kk-shot)[^"]*"[^>]*>[\s\S]*?<\/figure>/, figure);
        if (replaced !== html) html = replaced;
      }
      const notDish = /not the (?:sauce|dish|pancake)|not a photograph of the dish|Place, not the dish|shows the (?:region|place), not/i;
      const hero = html.match(/<figure class="(?:photo-hero|pancake-hero|stop-hero)[^"]*"[\s\S]*?<\/figure>/);
      if (!html.includes("data-photo=") && (html.includes("data-kk-locator") || (hero && notDish.test(hero[0])))) {
        const iso = (html.match(/country=([A-Z]{2})/) || [])[1];
        const countryName = textOf(html, /<dt>Country<\/dt>\s*<dd>([^<]+)/) || textOf(html, /<p class="meta">([^·<]+)/);
        const figure = locatorFigure(iso, countryName);
        const replaced = html.includes("data-kk-locator")
          ? html.replace(/<figure class="kk-(?:locator-fallback|atlas-card)"[\s\S]*?<\/figure>/, figure)
          : html.replace(/<figure class="(?:photo-hero|pancake-hero|stop-hero)[^"]*"[\s\S]*?<\/figure>/, figure);
        if (replaced !== html) html = replaced;
      }
      if (html.includes('class="kk-method"') && !html.includes('id="kk-method"')) {
        html = html.replace('class="kk-method"', 'class="kk-method" id="kk-method"');
      }
      html = html.replace(/<p class="kk-tools[\s\S]*?<\/p>\s*/g, "");
      if (html.includes("kk-mast")) {
        html = html.replace(/(<div class="kk-mast">[\s\S]*?<\/div>)/, `$1\n<p class="kk-tools no-print"><a class="kk-button" href="#kk-method">Jump to recipe</a> <button type="button" class="kk-button quiet" data-print>Print</button></p>`);
      }
      html = html.replace(/<section class="kk-related">[\s\S]*?<\/section>\s*/g, "");
      const selfHref = `/${dir}/${folder}/${slug}/`;
      const self = catalog.find((item) => item.href === selfHref);
      if (self && self.region) {
        const related = catalog.filter((item) => item.region === self.region && item.href !== selfHref).slice(0, 4);
        if (related.length) {
          const block = `<section class="kk-related"><h2>From ${escapeHtml(self.region)}</h2><ul class="kk-recipe-list">${related.map((item) => `<li><a href="${item.href}">${escapeHtml(item.title)}</a> <span class="kk-meta">${escapeHtml(item.country || item.section)}</span></li>`).join("")}</ul></section>\n`;
          html = html.replace(/<\/article>/, `${block}</article>`);
        }
      }
      if (!html.includes("/assets/js/recipe.js")) {
        html = html.replace("</body>", `<script src="/assets/js/recipe.js" defer></script>\n</body>`);
      }
      if (slug === "mole-poblano" && !html.includes('data-photo="mole"')) {
        html = html.replace(/<figure class="photo-hero">[\s\S]*?<\/figure>/, photoFigure(EDITORIAL.mole, { eager: true, sizes: "(min-width: 900px) 68vw, 100vw", frame: "kk-shot kk-hero-shot" }).replace("<figure ", '<figure data-photo="mole" '));
      }
      if (slug === "appam" && !html.includes('data-photo="appam"')) {
        html = html.replace(/<figure class="pancake-hero[\s\S]*?<\/figure>/, photoFigure(EDITORIAL.appam, { eager: true, sizes: "(min-width: 900px) 68vw, 100vw", frame: "kk-shot kk-hero-shot" }).replace("<figure ", '<figure data-photo="appam" '));
      }
      if (!html.includes("kk-mast")) {
        const dek = html.match(/<p class="dek">[\s\S]*?<\/p>/);
        const info = html.match(/<ul class="kk-info"[\s\S]*?<\/ul>/);
        if (dek && info) {
          html = html.replace(dek[0], "").replace(info[0], "");
          html = html.replace(/<\/h1>/, `</h1>\n<div class="kk-mast">${dek[0]}\n${info[0]}</div>`);
        }
      }
      const kind = folder === "sauces" ? "sauces" : folder === "pancakes" ? "pancakes" : "bbq";
      html = html.replace(/<div class="kk-method" id="kk-method">([\s\S]*?)<\/div>/, (_, inner) => {
        const ads = [...inner.matchAll(/<aside class="kk-ad[\s\S]*?<\/aside>/g)].map((match) => match[0]);
        const clean = inner.replace(/<aside class="kk-ad[\s\S]*?<\/aside>/g, "");
        return `${ads.join("\n")}<div class="kk-method" id="kk-method">${clean}</div>`;
      });
      html = stampOg(html, `/assets/og/recipes/${kind}-${slug}.jpg`);
      fs.writeFileSync(file, html);
    }
  }
}

function mountBrowse(rel, items) {
  const file = path.join(root, rel);
  let html = fs.readFileSync(file, "utf8");
  const block = browseBlock(items);
  if (html.includes('id="kk-browse"')) {
    html = html.replace(/<section id="kk-browse"[\s\S]*?<\/section>\s*<script src="\/assets\/js\/filter.js" defer><\/script>/, block);
  } else {
    html = html.replace(/<\/main>/, `${block}\n</main>`);
  }
  fs.writeFileSync(file, html);
}

polishRecipes();
mountBrowse("flying-sauces/index.html", catalog.filter((item) => item.section === "Flying Sauces"));
mountBrowse("flying-pancakes/index.html", catalog.filter((item) => item.section === "Flying Pancakes"));
mountBrowse("flying-bbq/index.html", catalog.filter((item) => item.section === "Flying BBQ"));

function photoFile(photo) {
  if (!photo) return "";
  return `assets/photos/editorial/${photo.id}-${photo.widths[photo.widths.length - 1]}.jpg`;
}
const ogJobs = [
  { out: "assets/og/home.jpg", title: "Kite Kitchen", kicker: "World recipes", line: TAGLINE },
  { out: "assets/og/sauces.jpg", title: "Flying Sauces", kicker: "Kite Kitchen", line: "Sauces from the table, the mortar, and the market.", photo: photoFile(EDITORIAL.chimichurri) },
  { out: "assets/og/pancakes.jpg", title: "Flying Pancakes", kicker: "Kite Kitchen", line: "Batters, griddles, and the pancakes that travel with them.", photo: photoFile(EDITORIAL.crepes) },
  { out: "assets/og/bbq.jpg", title: "Flying BBQ", kicker: "Kite Kitchen", line: "Fire, smoke, and the dishes cooked over them.", photo: photoFile(EDITORIAL.hog) },
  { out: "assets/og/recipes.jpg", title: "Recipes", kicker: "Kite Kitchen", line: "Browse by continent and region." },
  { out: "assets/og/books.jpg", title: "Recipe cookbooks", kicker: "Kite Kitchen", line: "Original covers. Nothing here has a price." },
  { out: "assets/og/about.jpg", title: "About Kite Kitchen", kicker: "Kite Kitchen", line: TAGLINE },
  { out: "assets/og/map.jpg", title: "World map", kicker: "Kite Kitchen", line: "Shaded countries have recipes." },
  { out: "assets/og/shop.jpg", title: "The shop is coming soon", kicker: "Kite Kitchen", line: "No prices and no checkout." },
  { out: "assets/og/search.jpg", title: "Search", kicker: "Kite Kitchen", line: "A dish, a country, or a guide." },
  { out: "assets/og/journeys.jpg", title: "Journeys", kicker: "Kite Kitchen", line: "Reading orders through recipes already on this site." },
  { out: "assets/og/lost.jpg", title: "That page is not here", kicker: "Off the map", line: "The route does not match a recipe." }
];
for (const item of catalog) {
  const parts = item.href.split("/").filter(Boolean);
  const slug = parts.at(-1);
  const kind = parts[1] === "pancakes" ? "pancakes" : parts[1] === "dishes" ? "bbq" : "sauces";
  const photo = DISH_PHOTO[slug] || CARD_PHOTO[item.href];
  const place = byIso[item.iso];
  ogJobs.push({
    out: `assets/og/recipes/${kind}-${slug}.jpg`,
    title: item.title,
    kicker: item.section,
    line: [item.country, item.region].filter(Boolean).join(" · "),
    photo: photoFile(photo),
    lat: place ? place.lat : null,
    lon: place ? place.lon : null
  });
}
const ogManifest = "/tmp/kk-og-jobs.json";
fs.writeFileSync(ogManifest, JSON.stringify(ogJobs));
execFileSync("python3", ["scripts/og-cards.py", ogManifest], { cwd: root, stdio: "inherit" });
for (const [rel, image] of [["flying-sauces/index.html", "/assets/og/sauces.jpg"], ["flying-pancakes/index.html", "/assets/og/pancakes.jpg"], ["flying-bbq/index.html", "/assets/og/bbq.jpg"]]) {
  const file = path.join(root, rel);
  fs.writeFileSync(file, stampOg(fs.readFileSync(file, "utf8"), image));
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
