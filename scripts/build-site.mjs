import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SITE_ORIGIN, BASE_PATH, GA_MEASUREMENT_ID, ADS, home_hero_photo } from "../site.config.mjs";
import { featureForDate, extendWeekSchedule, isoWeekSerial } from "./feature-calendar.mjs";
import { PANTRY_TERMS, pantrySlug } from "./pantry.mjs";
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

function menuControl(current) {
  return `<details class="kk-menu">
      <summary><span class="kk-menu-label">Menu</span><span class="kk-menu-close">Close</span></summary>
      <p class="kk-menu-kicker">${KITE_MARK}<span>Kite Kitchen</span></p>
      ${nav(current, "kk-nav")}
    </details>`;
}

function header(current) {
  return `<a class="skip-link" href="#content">Skip to content</a>
<header class="kk-header">
  <div class="kk-header-inner">
    ${brandLockup()}
    ${nav(current, "kk-nav")}
    <a class="kk-passport" href="/passport/"${current === "passport" ? ' aria-current="page"' : ""}>Passport</a>
    ${menuControl(current)}
  </div>
</header>`;
}

function contactLine() {
  return `<p class="kk-contact">Contact details coming soon.</p>`;
}

function footInner() {
  return `<div class="kk-wrap kk-foot">
      <img class="kk-crest" src="/assets/brand/logo-240.webp" alt="" width="96" height="124">
      <div>
        <p class="kk-word">Kite Kitchen</p>
        <p class="kk-tag">${TAGLINE}</p>
        <p class="kk-fine">The name means flying around the world and tasting different foods.</p>
        <nav aria-label="Footer">
          <a href="/recipes/">Recipes</a>
          <a href="/flying-sauces/">Flying Sauces</a>
          <a href="/flying-pancakes/">Flying Pancakes</a>
          <a href="/flying-bbq/">Flying BBQ</a>
          <a href="/map/">World Map</a>
          <a href="/journeys/">Journeys</a>
          <a href="/collections/">Collections</a>
          <a href="/passport/">Passport</a>
          <a href="/pantry/">Pantry</a>
          <a href="/books/">Cookbooks</a>
          <a href="/shop/">Shop</a>
          <a href="/about/">About</a>
          <a href="/credits/">Credits</a>
          <a href="/privacy/">Privacy</a>
          <a href="/terms/">Terms</a>
          <button type="button" class="quiet" data-consent-open>Cookie choices</button>
        </nav>
        ${contactLine()}
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
    logo: `${SITE_ORIGIN}/assets/brand/logo-480.png`
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
    ${menuControl(current)}
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
    html = html.replace(/<title>([^<]*)<\/title>/, (m, t) => {
      let title = t.includes("KiteKitchen") ? t : `${t} · KiteKitchen`;
      const kind = rel.includes("/books/") ? "Cookbook"
        : rel.includes("/journeys/") ? "Journey"
        : rel.includes("/learn/") ? "Essay"
        : rel.includes("/explore/") ? "Index"
        : rel.includes("/places/") ? "Places"
        : "";
      if (kind && !title.includes(` · ${kind} ·`)) title = title.replace(" · KiteKitchen", ` · ${kind} · KiteKitchen`);
      return `<title>${title}</title>`;
    });
    html = html.replace(/<p class="price">[\s\S]*?<\/p>/g, "");
    html = html.replace(/<p class="eyebrow">Placeholder price[^<]*<\/p>/g, "");
    html = html.replace(/ · Placeholder price \$[\d,.]+, not final/g, "");
    html = html.replace(/Placeholder price \$[\d,.]+, not final/g, "Coming soon");
    html = html.replace(/Prices are placeholders, not final\./g, "Coming soon. Prices are not listed.");
    html = html.replace(/Prices are placeholders\.?/g, "Prices are not listed.");
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
        const links = `<p class="kk-place-links"><a href="${countryPath(iso)}">${escapeHtml(countryName)}</a>${regionLink} · <a href="/map/#${iso}">World map</a></p>`;
        html = html.replace(`<p class="meta">${countryName} ·`, `<p class="meta"><a href="${countryPath(iso)}">${escapeHtml(countryName)}</a> ·`);
        html = html.replace(/<span>Origin: (?:<a href="[^"]*">)?([^<·]+)(?:<\/a>)? ·/, `<span>Origin: <a href="${countryPath(iso)}">$1</a> ·`);
        if (html.includes("kk-origin")) html = html.replace(/(<p class="kk-origin">[\s\S]*?<\/p>)/, `$1\n${links}`);
        else html = html.replace(/<\/h1>/, `</h1>\n${links}`);
      }
    }
    if (/data-page="(sauce|pancake|dish)"/.test(html) && !html.includes("kk-origin")) {
      const iso = (html.match(/country=([A-Z]{2})/) || [])[1];
      const countryName = textOf(html, /<dt>Country<\/dt>\s*<dd>([^<]+)/);
      const place = iso && byIso[iso];
      if (countryName && place) {
        html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, (m) => `${m}\n${originMarkup(countryName, place.lat, place.lon, countryPath(iso))}`);
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

function downsampleRing(ring, max = 72) {
  if (!ring || ring.length <= max) return ring || [];
  const last = ring.length - 1;
  const step = last / (max - 1);
  const out = [];
  for (let i = 0; i < max; i += 1) out.push(ring[Math.round(i * step)]);
  return out;
}

function ringPath(ring, w, h, digits, maxPoints = 0) {
  const source = maxPoints ? downsampleRing(ring, maxPoints) : ring;
  let d = "";
  for (let i = 0; i < source.length; i++) {
    const x = ((source[i][0] + 180) / 360) * w;
    const y = ((90 - source[i][1]) / 180) * h;
    d += `${i ? "L" : "M"}${x.toFixed(digits)} ${y.toFixed(digits)}`;
  }
  return `${d}Z`;
}

function worldSvg(countries, w, h, hrefFor, simple = false, maxPoints = 0) {
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
    const d = rings.map((ring) => ringPath(ring, w, h, digits, maxPoints)).join("");
    const tier = country.count >= 12 ? "has has-3" : country.count >= 4 ? "has has-2" : country.count ? "has has-1" : "";
    const title = `<title>${escapeHtml(country.name)}${country.count ? `, ${country.count} recipes` : ""}</title>`;
    const pathEl = `<path class="${tier}" d="${d}">${title}</path>`;
    const x = ((country.lon + 180) / 360) * w;
    const y = ((90 - country.lat) / 180) * h;
    const dot = country.count ? `<circle class="kk-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5"/>` : "";
    if (country.count && hrefFor) {
      const label = `${country.name}, ${country.count} ${country.count === 1 ? "recipe" : "recipes"}`;
      return `<a href="${hrefFor(country.iso)}" data-place="${escapeHtml(country.name)}" data-count="${country.count}" aria-label="${escapeHtml(label)}">${pathEl}${dot}</a>`;
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
  return String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function countryPath(iso) {
  const slug = slugByIso[iso];
  return slug ? `/countries/${slug}/` : `/map/#${iso}`;
}

function coordLabel(lat, lon) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(Math.round(lat))}° ${ns}, ${Math.abs(Math.round(lon))}° ${ew}`;
}

const PLATE_COMPASS = `<g class="kk-compass-mark" transform="translate(552 34) scale(0.7)" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="#f4f0e8" stroke="#1a1a1a" stroke-width="1.2"/><circle cx="32" cy="32" r="2" fill="#1a1a1a"/><path d="M32 6 L37 32 L32 26 L27 32 Z" fill="#c6a15b"/><path d="M32 58 L27 32 L32 38 L37 32 Z" fill="#1a1a1a"/><path d="M6 32 L32 27 L26 32 L32 37 Z" fill="#1a1a1a"/><path d="M58 32 L32 37 L38 32 L32 27 Z" fill="#1a1a1a"/></g>`;

function outlineSpan(place) {
  let minX = 180;
  let maxX = -180;
  let minY = 90;
  let maxY = -90;
  for (const pt of place?.outline || []) {
    minX = Math.min(minX, pt[0]);
    maxX = Math.max(maxX, pt[0]);
    minY = Math.min(minY, pt[1]);
    maxY = Math.max(maxY, pt[1]);
  }
  return { minX, maxX, minY, maxY, spanX: Math.max(maxX - minX, 4), spanY: Math.max(maxY - minY, 3) };
}

function fittedOutline(place) {
  const ring = downsampleRing(place?.outline, 80);
  if (!ring.length) return "";
  const { minX, maxX, minY, maxY, spanX, spanY } = outlineSpan(place);
  const box = { x: 64, y: 40, w: 460, h: 196 };
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const scale = Math.min(box.w / spanX, box.h / spanY) * 0.88;
  return `<path d="${ring.map((pt, index) => {
    const x = box.x + box.w / 2 + (pt[0] - midX) * scale;
    const y = box.y + box.h / 2 - (pt[1] - midY) * scale;
    return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join("")}Z" fill="#ead7ae" stroke="#1a1a1a" stroke-width="1.5"/>`;
}

function miniWorldMark(place) {
  const box = { x: 48, y: 36, w: 520, h: 200 };
  const scale = Math.min(box.w / 160, box.h / 80);
  const ox = box.x + (box.w - 160 * scale) / 2;
  const oy = box.y + (box.h - 80 * scale) / 2;
  const x = ox + ((place.lon + 180) / 360) * 160 * scale;
  const y = oy + ((90 - place.lat) / 180) * 80 * scale;
  return `<g transform="translate(${ox.toFixed(1)} ${oy.toFixed(1)}) scale(${scale.toFixed(3)})" fill="#ead7ae" stroke="#1a1a1a" stroke-width="0.45">${MINI_LANDS}</g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#e2b007" stroke="#fffdfb" stroke-width="1.6"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="none" stroke="#1a1a1a" stroke-width="1"/>`;
}

function plateLand(place) {
  if (!place?.outline) return "";
  const { spanX, spanY } = outlineSpan(place);
  if (spanX > 55 || spanY > 36) return miniWorldMark(place);
  return fittedOutline(place);
}

function plateLabel(title) {
  const text = String(title || "Atlas").replace(/\s+/g, " ").trim();
  if (text.length <= 22) return { text, size: 34 };
  if (text.length <= 36) return { text, size: 26 };
  const cut = text.slice(0, 34).replace(/\s+\S*$/, "");
  return { text: `${cut}…`, size: 24 };
}

function atlasSvg(place, title, coord, symbol = "") {
  const label = plateLabel(title);
  const name = escapeHtml(label.text);
  const where = escapeHtml(coord || "");
  const land = symbol ? `<use href="#kk-land-${symbol}"/>` : plateLand(place);
  return `<svg class="kk-plate-svg" viewBox="0 0 640 360" role="img" aria-label="${escapeHtml(title || "Atlas plate")}${where ? `, ${where}` : ""}">
    <rect width="640" height="360" fill="#f4f0e8"/>
    <g stroke="#e4ddd2" stroke-width="0.8"><path d="M40 88H600M40 156H600M40 224H600M150 28V248M320 28V248M490 28V248"/></g>
    <rect x="16" y="16" width="608" height="328" fill="none" stroke="#c6a15b" stroke-width="1.25"/>
    <rect x="24" y="24" width="592" height="312" fill="none" stroke="#c6a15b" stroke-width="0.6"/>
    ${land}
    ${PLATE_COMPASS}
    <text class="kk-plate-name" x="40" y="302" font-size="${label.size}">${name}</text>
    ${where ? `<text class="kk-plate-coord" x="40" y="330">${where}</text>` : ""}
  </svg>`;
}

function landDefs(items) {
  const seen = new Set();
  const parts = [];
  for (const item of items) {
    if (!item?.iso || seen.has(item.iso) || itemPhoto(item)) continue;
    const place = byIso[item.iso];
    if (!place?.outline) continue;
    seen.add(item.iso);
    parts.push(`<svg class="kk-land-def" width="0" height="0" aria-hidden="true" focusable="false"><symbol id="kk-land-${item.iso}" viewBox="0 0 640 360"><rect width="640" height="360" fill="#f4f0e8"/><g stroke="#e4ddd2" stroke-width="0.8"><path d="M40 88H600M40 156H600M40 224H600M150 28V248M320 28V248M490 28V248"/></g><rect x="16" y="16" width="608" height="328" fill="none" stroke="#c6a15b" stroke-width="1.25"/><rect x="24" y="24" width="592" height="312" fill="none" stroke="#c6a15b" stroke-width="0.6"/>${plateLand(place)}${PLATE_COMPASS}</symbol></svg>`);
  }
  return parts.join("");
}

function locatorFigure(iso, countryName, dish = "", { hero = true, symbol = false } = {}) {
  const place = iso ? byIso[iso] : null;
  const name = countryName || place?.name || "Origin";
  const coord = place && Number.isFinite(place.lat) && Number.isFinite(place.lon) ? coordLabel(place.lat, place.lon) : "";
  const title = dish || name;
  if (symbol && iso && !hero) {
    const label = plateLabel(title);
    const svg = `<svg class="kk-plate-svg" viewBox="0 0 640 360" role="img" aria-label="${escapeHtml(title)}${coord ? `, ${escapeHtml(coord)}` : ""}"><use href="#kk-land-${iso}"/><text class="kk-plate-name" x="40" y="302" font-size="${label.size}">${escapeHtml(label.text)}</text>${coord ? `<text class="kk-plate-coord" x="40" y="330">${escapeHtml(coord)}</text>` : ""}</svg>`;
    return `<figure class="kk-atlas-card" data-kk-locator>${svg}</figure>`;
  }
  const svg = atlasSvg(place, title, coord, "");
  const frame = hero ? "kk-atlas-card kk-hero-shot" : "kk-atlas-card";
  const caption = hero
    ? `<figcaption class="kk-caption"><span class="kk-cap-line">${escapeHtml(dish ? `${dish}.` : `${name}.`)}</span><span class="kk-credit">Atlas plate${coord ? ` · ${escapeHtml(coord)}` : ""}</span></figcaption>`
    : "";
  return `<figure class="${frame}" data-kk-locator>${svg}${caption}</figure>`;
}

function originMarkup(countryName, lat, lon, href) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  const label = `${Math.abs(Math.round(lat))}° ${ns}, ${Math.abs(Math.round(lon))}° ${ew}`;
  const x = ((lon + 180) / 360) * 80;
  const y = ((90 - lat) / 180) * 40;
  const name = href ? `<a href="${href}">${escapeHtml(countryName)}</a>` : escapeHtml(countryName);
  return `<p class="kk-origin"><svg class="kk-locator" viewBox="0 0 80 40" width="80" height="40" aria-hidden="true"><rect width="80" height="40" fill="none" stroke="#c6a15b" stroke-width="0.8"/><path d="M0 20 H80 M40 0 V40" stroke="#e4ddd2" stroke-width="0.5"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="#1a1a1a"/></svg> <span>Origin: ${name} · ${label}</span></p>`;
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
const slugByIso = {};

ensureSisters();
byIso = Object.fromEntries(loadCountries().map((country) => [country.iso, country]));
{
  const used = new Map();
  for (const iso of Object.keys(byIso)) {
    let slug = regionSlug(byIso[iso].name);
    if (!slug) slug = iso.toLowerCase();
    if (used.has(slug)) slug = `${slug}-${iso.toLowerCase()}`;
    used.set(slug, iso);
    slugByIso[iso] = slug;
  }
}
transformSection("flying-sauces", "Flying Sauces", "https://jonldavis-coder.github.io/flying-sauces/");
transformSection("flying-pancakes", "Flying Pancakes", "https://jonldavis-coder.github.io/flying-pancakes/");
transformSection("flying-bbq", "Flying BBQ", "https://jonldavis-coder.github.io/flying-bbq/");
cleanOld();

const sauceCount = dirs("flying-sauces/sauces").length;
const pancakeCount = dirs("flying-pancakes/pancakes").length;
const bbqCount = dirs("flying-bbq/dishes").length;
function readBook(dir, slug, section) {
  const html = fs.readFileSync(path.join(root, dir, "books", slug, "index.html"), "utf8");
  const contents = html.match(/<ol class="contents">([\s\S]*?)<\/ol>/);
  return {
    slug,
    title: textOf(html, /<h1[^>]*>([\s\S]*?)<\/h1>/) || slug,
    dek: textOf(html, /<p class="dek">([\s\S]*?)<\/p>/),
    count: contents ? (contents[1].match(/<li\b/g) || []).length : 0,
    href: `/${dir}/books/${slug}/`,
    section
  };
}
const sauceBooks = dirs("flying-sauces/books").map((slug) => readBook("flying-sauces", slug, "Flying Sauces"));
const pancakeBooks = dirs("flying-pancakes/books").map((slug) => readBook("flying-pancakes", slug, "Flying Pancakes"));
const bbqBooks = dirs("flying-bbq/books").map((slug) => readBook("flying-bbq", slug, "Flying BBQ"));
const guideBooks = sauceBooks.concat(pancakeBooks, bbqBooks);

write("config.js", `// Generated from site.config.mjs. Change SITE_ORIGIN there, then rebuild.
window.KITE_KITCHEN = ${JSON.stringify({
  SITE_ORIGIN,
  BASE_PATH,
  GA_MEASUREMENT_ID,
  ADS
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
    const info = html.match(/<ul class="kk-info"[^>]*>[\s\S]*?<\/ul>/);
    const infoBits = info ? [...info[0].matchAll(/<li>([^<]+)<\/li>/g)].map((match) => match[1].trim()) : [];
    const bits = infoBits.length ? infoBits : meta.split("·").map((part) => part.trim()).filter(Boolean);
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

function routeSvg(points, label = "Route between the stops on this journey") {
  const w = 640;
  const h = 360;
  const mapH = 320;
  const oy = 12;
  const coords = points.map((point) => {
    const x = ((point.lon + 180) / 360) * w;
    const y = oy + ((90 - point.lat) / 180) * mapH;
    return [x, y];
  });
  const path = coords.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const dots = coords.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="#e2b007" stroke="#fffdfb" stroke-width="2.2"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>`).join("");
  return `<svg class="kk-route" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeHtml(label)}"><rect width="${w}" height="${h}" fill="#f4f0e8"/><rect x="16" y="16" width="608" height="328" fill="none" stroke="#c6a15b" stroke-width="1.25"/><g transform="translate(0 ${oy}) scale(4)" fill="#ead7ae" stroke="#1a1a1a" stroke-width="0.45">${MINI_LANDS}</g><path d="${path}" fill="none" stroke="#c6a15b" stroke-width="2.6" stroke-dasharray="2 5" stroke-linecap="round"/>${dots}</svg>`;
}

function pinSvg(lat, lon) {
  const x = ((lon + 180) / 360) * 160;
  const y = ((90 - lat) / 180) * 80;
  return `<svg class="kk-pin" viewBox="0 0 160 80" width="156" height="78" aria-hidden="true"><rect width="160" height="80" fill="#f4f0e8"/><path d="M0 40H160M40 0V80M80 0V80M120 0V80" stroke="#e4ddd2" stroke-width="0.45"/><g fill="#ead7ae" stroke="#1a1a1a" stroke-width="0.6">${MINI_LANDS}</g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.4" fill="#e2b007" stroke="#fffdfb" stroke-width="1.7"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.4" fill="none" stroke="#1a1a1a" stroke-width="0.6"/></svg>`;
}
const dishPhotos = JSON.parse(fs.readFileSync(path.join(root, "data/dish-photos.json"), "utf8"));
const EDITORIAL = Object.fromEntries(dishPhotos.map((photo) => [photo.id, photo]));
const DISH_PHOTO = Object.fromEntries(dishPhotos.filter((photo) => photo.slug).map((photo) => [photo.slug, photo]));
const CARD_PHOTO = {
  "/flying-sauces/sauces/pesto-alla-genovese/": EDITORIAL.pesto,
  "/flying-pancakes/pancakes/crepes-suzette/": EDITORIAL.crepes,
  "/flying-bbq/dishes/argentine-asado/": EDITORIAL.asado,
  "/flying-sauces/sauces/mole-poblano/": EDITORIAL.mole,
  "/flying-pancakes/pancakes/appam/": EDITORIAL.appam,
  "/flying-bbq/dishes/eastern-nc-whole-hog/": EDITORIAL.hog
};

function photoFigure(photo, { eager = false, sizes = "100vw", frame = "kk-shot" } = {}) {
  const mast = frame.includes("hero");
  const width = mast ? photo.mastWidth : photo.cardWidth;
  const height = mast ? photo.mastHeight : photo.cardHeight;
  const kind = mast ? "mast" : "card";
  const src = `/assets/photos/editorial/${photo.id}-${kind}-${width}`;
  const priority = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  const source = photo.source || "Wikimedia Commons";
  return `<figure class="${frame}">
      <picture>
        <source type="image/avif" srcset="${src}.avif ${width}w" sizes="${sizes}">
        <source type="image/webp" srcset="${src}.webp ${width}w" sizes="${sizes}">
        <img src="${src}.jpg" width="${width}" height="${height}" alt="${escapeHtml(photo.alt)}" ${priority} decoding="async">
      </picture>
      <figcaption class="kk-caption"><span class="kk-cap-line">${escapeHtml(photo.caption)}</span><span class="kk-credit">Photograph by ${escapeHtml(photo.artist)}. <a href="${escapeHtml(photo.licenseUrl)}">${escapeHtml(photo.license)}</a>. <a href="${escapeHtml(photo.sourceUrl)}">${escapeHtml(source)}</a>.</span></figcaption>
    </figure>`;
}

function recipeCard(item, compact = false) {
  const place = !compact && item.iso && byIso[item.iso];
  const pin = place ? pinSvg(place.lat, place.lon) : `<span class="kk-band" aria-hidden="true"></span>`;
  const slug = item.href.split("/").filter(Boolean).at(-1);
  const photo = !compact ? (DISH_PHOTO[slug] || CARD_PHOTO[item.href] || null) : null;
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
const homeMap = worldSvg(countries, 960, 480, (iso) => countryPath(iso), true);
const atlasMap = worldSvg(countries, 960, 480, (iso) => countryPath(iso));
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

function recipeMinutes(item) {
  const parts = String(item?.time || "").split("·");
  let total = 0;
  let found = false;
  for (const part of parts) {
    const hours = part.match(/(\d+)\s*hr/i);
    const minutes = part.match(/(\d+)\s*min/i);
    if (!hours && !minutes) continue;
    found = true;
    total += (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  }
  return found ? total : null;
}

const HOME_FEATURE = featureForDate(new Date());
const COLLECTIONS = [
  {
    slug: "holiday-table",
    title: "Holiday table around the world",
    when: "Thanksgiving, November 26",
    lede: "A reading order for the week of Thanksgiving, November 26. Every recipe is already on this site. Each page already describes the dish as food for a holiday or a celebration. The note under each title is that recipe’s own description.",
    stops: [
      { href: "/flying-sauces/sauces/cranberry-sauce/", seat: "Thanksgiving table" },
      { href: "/flying-bbq/dishes/hickory-smoked-turkey/", seat: "Holiday roast" },
      { href: "/flying-sauces/sauces/bread-sauce/", seat: "Christmas and Sunday roast sauce" },
      { href: "/flying-bbq/dishes/norwegian-pinnekjott/", seat: "Christmas dish" },
      { href: "/flying-pancakes/pancakes/portuguese-rabanadas/", seat: "Christmas fried bread" },
      { href: "/flying-pancakes/pancakes/aebleskiver/", seat: "Advent and Christmas" },
      { href: "/flying-pancakes/pancakes/goan-alebele/", seat: "Served at Christmas" },
      { href: "/flying-sauces/sauces/satsivi/", seat: "New Year" },
      { href: "/flying-bbq/dishes/moroccan-mechoui/", seat: "Eid al-Adha" },
      { href: "/flying-bbq/dishes/omani-shuwa/", seat: "Cooked for Eid" },
      { href: "/flying-pancakes/pancakes/turnip-cake/", seat: "Lunar New Year" },
      { href: "/flying-pancakes/pancakes/persian-kuku-sabzi/", seat: "Nowruz" }
    ]
  },
  {
    slug: "weeknight",
    title: "Weeknight around the world",
    when: "30 minutes or less",
    maxMinutes: 30,
    lede: "Recipes already on this site whose pages list 30 minutes or less once prep and cook are added. The time under each title is that page’s own time.",
    stops: [
      { href: "/flying-sauces/sauces/carbonara/" },
      { href: "/flying-bbq/dishes/korean-samgyeopsal/" },
      { href: "/flying-pancakes/pancakes/cachapas/" },
      { href: "/flying-pancakes/pancakes/syrniki/" },
      { href: "/flying-bbq/dishes/australian-lamb-chops/" },
      { href: "/flying-bbq/dishes/japanese-sanma-shioyaki/" },
      { href: "/flying-bbq/dishes/cape-snoek-braai/" },
      { href: "/flying-bbq/dishes/elote/" },
      { href: "/flying-bbq/dishes/portuguese-sardines/" },
      { href: "/flying-sauces/sauces/hummus/" }
    ]
  },
  {
    slug: "breakfast",
    title: "Breakfast around the world",
    when: "Breakfast",
    lede: "Recipes already on this site whose pages call the dish breakfast. The note under each title is that recipe’s own description.",
    stops: [
      { href: "/flying-pancakes/pancakes/masala-dosa/", seat: "City breakfast" },
      { href: "/flying-pancakes/pancakes/tianjin-jianbing/", seat: "Street breakfast" },
      { href: "/flying-pancakes/pancakes/msemen/", seat: "Breakfast" },
      { href: "/flying-pancakes/pancakes/mexican-hotcakes/", seat: "City breakfast" },
      { href: "/flying-pancakes/pancakes/kenyan-chapati/", seat: "Breakfast with tea" },
      { href: "/flying-pancakes/pancakes/english-crumpets/", seat: "Breakfast or tea" },
      { href: "/flying-pancakes/pancakes/turkish-gozleme/", seat: "Savory breakfast" },
      { href: "/flying-pancakes/pancakes/lebanese-manakish/", seat: "Breakfast loaf" },
      { href: "/flying-pancakes/pancakes/nigerian-masa/", seat: "Breakfast and street food" },
      { href: "/flying-pancakes/pancakes/ethiopian-kita/", seat: "Breakfast" },
      { href: "/flying-pancakes/pancakes/australian-pancakes/", seat: "Home breakfast" },
      { href: "/flying-pancakes/pancakes/brazilian-beiju/", seat: "Breakfast" }
    ]
  },
  {
    slug: "street-food",
    title: "Street food of the world",
    when: "Street food",
    lede: "Recipes already on this site whose pages call the dish street food. The note under each title is that recipe’s own description.",
    stops: [
      { href: "/flying-pancakes/pancakes/takoyaki/", seat: "Street food" },
      { href: "/flying-pancakes/pancakes/banh-khot/", seat: "Street food" },
      { href: "/flying-bbq/dishes/thai-moo-ping/", seat: "Street food" },
      { href: "/flying-bbq/dishes/xinjiang-lamb-skewers/", seat: "Street food" },
      { href: "/flying-pancakes/pancakes/afghan-bolani/", seat: "Street food" },
      { href: "/flying-pancakes/pancakes/arepa-de-huevo/", seat: "Street food" },
      { href: "/flying-pancakes/pancakes/socca/", seat: "Street food" },
      { href: "/flying-bbq/dishes/ghanaian-kyinkyinga/", seat: "Street food" },
      { href: "/flying-bbq/dishes/peruvian-anticuchos/", seat: "Street food" },
      { href: "/flying-bbq/dishes/senegalese-dibi/", seat: "Street food" },
      { href: "/flying-bbq/dishes/portuguese-sardines/", seat: "Street food" },
      { href: "/flying-sauces/sauces/currywurst-sauce/", seat: "Street food" }
    ]
  },
  {
    slug: "winter-warmers",
    title: "Winter warmers",
    when: "Winter",
    lede: "Recipes already on this site whose pages place the dish in winter. The note under each title is that recipe’s own description.",
    stops: [
      { href: "/flying-sauces/sauces/bagna-cauda/", seat: "Autumn and winter" },
      { href: "/flying-sauces/sauces/romesco/", seat: "In winter" },
      { href: "/flying-pancakes/pancakes/chilean-sopaipillas/", seat: "Street food in winter" },
      { href: "/flying-pancakes/pancakes/hotteok/", seat: "Winter street sweet" },
      { href: "/flying-pancakes/pancakes/patishapta/", seat: "Winter crepe" },
      { href: "/flying-pancakes/pancakes/spekdik/", seat: "Winter food" },
      { href: "/flying-pancakes/pancakes/bangladeshi-chitoi-pitha/", seat: "Winter cakes" },
      { href: "/flying-pancakes/pancakes/filloas/", seat: "Late-winter" },
      { href: "/flying-bbq/dishes/norwegian-pinnekjott/", seat: "Dark winter" },
      { href: "/flying-bbq/dishes/spanish-calcots/", seat: "Late winter" }
    ]
  }
];

function collectionStops(collection) {
  return collection.stops.map((stop) => {
    const item = catalog.find((entry) => entry.href === stop.href);
    if (!item) throw new Error(`Missing collection recipe ${stop.href}`);
    const minutes = recipeMinutes(item);
    if (collection.maxMinutes != null && (minutes == null || minutes > collection.maxMinutes)) {
      throw new Error(`${item.title} is ${minutes == null ? "untimed" : `${minutes} min`}, past the ${collection.maxMinutes} minute line for ${collection.title}`);
    }
    const meal = stop.seat || (minutes != null ? `${minutes} min` : "");
    return { ...item, meal, minutes };
  });
}

function collectionPlate(stops) {
  const places = routePlaces(stops);
  const names = orderedCountries(stops);
  if (places.length < 2) return locatorFigure(stops[0]?.iso, names[0] || stops[0]?.country, "", { hero: true });
  return `<figure class="kk-shot kk-hero-shot kk-route-shot">${routeSvg(places, "Map of the countries in this collection")}<figcaption class="kk-caption"><span class="kk-cap-line">${escapeHtml(names.join(" · "))}.</span><span class="kk-credit">Map plate. The marks follow the reading order.</span></figcaption></figure>`;
}

function featureHome(collection) {
  const stops = collectionStops(collection);
  const places = routePlaces(stops);
  const names = orderedCountries(stops);
  const plate = places.length >= 2
    ? `<figure class="kk-shot kk-route-shot">${routeSvg(places, "Map of the countries in this collection")}<figcaption class="kk-caption"><span class="kk-cap-line">${escapeHtml(names.join(" · "))}.</span><span class="kk-credit">Map plate.</span></figcaption></figure>`
    : "";
  return `<section class="kk-feature" data-feature="${escapeHtml(collection.slug)}">
        <div>
          <p class="kk-kicker">Now</p>
          <h2><a href="/collections/${collection.slug}/">${escapeHtml(collection.title)}</a></h2>
          <p>${escapeHtml(collection.lede)}</p>
          <p class="kk-meta">${stops.length} recipes${collection.when ? ` · ${escapeHtml(collection.when)}` : ""}</p>
          <p class="kk-meta"><a href="/collections/">All collections</a></p>
        </div>
        ${plate}
      </section>`;
}

const featuredItems = [
  "/flying-sauces/sauces/pesto-alla-genovese/",
  "/flying-pancakes/pancakes/crepes-suzette/",
  "/flying-bbq/dishes/argentine-asado/",
  "/flying-sauces/sauces/mole-poblano/",
  "/flying-pancakes/pancakes/appam/",
  "/flying-bbq/dishes/eastern-nc-whole-hog/"
].map((href) => catalog.find((item) => item.href === href)).filter(Boolean);
const photoSlugs = catalog.filter((item) => {
  const slug = item.href.split("/").filter(Boolean).at(-1);
  return Boolean(DISH_PHOTO[slug] || CARD_PHOTO[item.href]);
}).map((item) => item.href.split("/").filter(Boolean).at(-1));
const schedulePath = path.join(root, "data/week-schedule.json");
const weekSchedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
const weekSerial = isoWeekSerial(new Date());
const extendedSchedule = extendWeekSchedule(weekSchedule, photoSlugs, weekSerial + 25);
if (JSON.stringify(extendedSchedule) !== JSON.stringify(weekSchedule)) {
  fs.writeFileSync(schedulePath, `${JSON.stringify(extendedSchedule, null, 2)}\n`);
}
const weekRow = extendedSchedule.find((row) => row.serial === weekSerial);
if (!weekRow) throw new Error(`No recipe of the week for ISO week serial ${weekSerial}`);
const weekRecipe = catalog.find((item) => item.href.split("/").filter(Boolean).at(-1) === weekRow.slug);
if (!weekRecipe) throw new Error(`Scheduled recipe ${weekRow.slug} is not in the catalog`);
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
  extraHead: home_hero_photo ? `<link rel="preload" as="image" type="image/avif" href="/assets/photos/editorial/hero-mast-${EDITORIAL.hero.mastWidth}.avif" imagesizes="100vw">` : "",
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
      ${featureHome(COLLECTIONS.find((item) => item.slug === HOME_FEATURE))}
      <h2>Featured recipes</h2>
      <div class="kk-rcards">${featuredItems.map((item) => recipeCard(item)).join("")}</div>
      <h2>A day around the world</h2>
      <article class="kk-day-home">
        <p class="kk-kicker">Journey</p>
        <h3><a href="/journeys/${featuredDay.slug}/">${escapeHtml(featuredDay.title)}</a></h3>
        <p>${escapeHtml(featuredDay.lede)}</p>
        ${routeSvg(featuredDay.stops.map((stop) => catalog.find((entry) => entry.href === stop.href)).map((item) => byIso[item.iso]).filter(Boolean))}
        <p class="kk-meta"><a href="/journeys/">All journeys</a></p>
      </article>
      <h2>Recipe of the week</h2>
      <article class="kk-week" data-week="${escapeHtml(weekRecipe.href)}">
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
      <h2>Browse by continent</h2>
      <div class="kk-continents">${["Africa", "Americas", "Asia", "Europe", "Oceania"].map((name) => {
        const items = catalog.filter((item) => item.continent === name);
        const regions = new Set(items.map((item) => item.region).filter(Boolean));
        return `<a class="kk-continent" href="/recipes/?continent=${encodeURIComponent(name)}"><span class="kk-kicker">${name}</span><strong>${regions.size} ${regions.size === 1 ? "region" : "regions"}</strong><span>${items.length} recipes</span></a>`;
      }).join("")}</div>
      <h2>The guides</h2>
      <div class="kk-guides">
        ${guideCard("/flying-sauces/", "Flying Sauces", sauceCount, "Flying Sauces", "Sauces from the table, the mortar, and the market.", EDITORIAL.chimichurri)}
        ${guideCard("/flying-pancakes/", "Flying Pancakes", pancakeCount, "Flying Pancakes", "Batters, griddles, and the pancakes that travel with them.", EDITORIAL.crepes)}
        ${guideCard("/flying-bbq/", "Flying BBQ", bbqCount, "Flying BBQ", "Fire, smoke, and the dishes cooked over them.", EDITORIAL.hog)}
      </div>
      <h2>Recipe cookbooks</h2>
      <div class="kk-grid kk-books">${cookbookPicks.slice(0, 3).map((book) => {
        const prefix = book.section === "Flying Sauces" ? "sauces" : book.section === "Flying Pancakes" ? "pancakes" : "bbq";
        const cover = `/assets/brand/covers/${prefix}-${book.slug}.svg`;
        return `<article class="kk-card kk-book"><a href="${book.href}"><img class="kk-cover" src="${cover}" alt="Original cover design for ${escapeHtml(book.title)}" width="300" height="400"></a><p class="kk-kicker">${escapeHtml(book.section)}</p><h3><a href="${book.href}">${escapeHtml(book.title)}</a></h3><p class="kk-pill">Coming soon</p></article>`;
      }).join("")}</div>
      <p class="kk-meta"><a href="/books/">All cookbooks</a> · <a href="/map/">World map</a></p>
      ${ad("home", "inline")}
      <p class="kk-shop-strip"><a href="/shop/">The Kite Kitchen shop is coming soon.</a></p>
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
      ${contactLine()}
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
        ${contactLine()}
        <p class="kk-row"><a class="kk-button quiet" href="/shop/">All shop items</a></p>
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
    <header class="kk-mast">
      <p class="kk-kicker">Catalog</p>
      <h1 class="kk-display">Recipe cookbooks</h1>
      <p class="dek">Titles from Flying Sauces, Flying Pancakes, and Flying BBQ. No prices are listed.</p>
    </header>
    ${SHOP_LINE}
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
      <div class="kk-catalog">${guideBooks.map((book) => `<article class="kk-book" data-continent="${escapeHtml(book.section)}"><a href="${book.href}"><img class="kk-cover" src="${book.cover}" alt="Original cover design for ${escapeHtml(book.title)}" width="300" height="400"></a><div><p class="kk-kicker">${escapeHtml(book.section)}</p><h2><a href="${book.href}">${escapeHtml(book.title)}</a></h2>${book.dek ? `<p class="dek">${escapeHtml(book.dek)}</p>` : ""}<p class="kk-meta">${book.count ? `${book.count} ${book.count === 1 ? "recipe" : "recipes"}` : "Contents on the title page"}</p></div></article>`).join("")}</div>
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
    <ul class="kk-sources">${dishPhotos.filter((photo, index, list) => list.findIndex((item) => item.sourceUrl === photo.sourceUrl) === index).map((photo) => `<li>${escapeHtml(photo.caption)} Photograph by ${escapeHtml(photo.artist)}. <a href="${escapeHtml(photo.licenseUrl)}">${escapeHtml(photo.license)}</a>. <a href="${escapeHtml(photo.sourceUrl)}">${escapeHtml(photo.source || "Wikimedia Commons")}</a>.</li>`).join("")}</ul>
    <p>The crest, the cookbook covers, and the small compass are original artwork for this site. Recipe photographs are credited above.</p>
  </div>`
}));

write("about/index.html", page({
  title: "About · KiteKitchen",
  description: "Kite Kitchen means flying around the world and tasting different foods, one simple recipe at a time.",
  path: "/about/",
  image: "/assets/og/about.jpg",
  main: `<article class="kk-wrap">${crumbs([["/", "Kite Kitchen"], ["/about/", "About"]])}
    <header class="kk-mast">
      <p class="kk-kicker">The name</p>
      <h1 class="kk-display">About Kite Kitchen</h1>
      <p class="dek">Kite Kitchen means flying around the world and tasting different foods.</p>
      <figure class="kk-about-crest">
        <img src="/assets/brand/logo-full.webp" alt="The full Kite Kitchen crest: a gold kite inside an ornamental frame, with the name Kite Kitchen" width="360" height="467">
        <figcaption class="kk-caption"><span class="kk-cap-line">The Kite Kitchen crest.</span><span class="kk-credit">Original artwork for this site.</span></figcaption>
      </figure>
    </header>
    <p>${TAGLINE}. Three guides keep their own names here: Flying Sauces, Flying Pancakes, and Flying BBQ. A recipe stays with the guide and the place it was already filed under.</p>
    <p>The crest is the gold kite in its frame. This page shows the full crest. The header uses the kite with the wordmark.</p>
    <p>The public address is <a href="${SITE_ORIGIN}/">kitekitchen.com</a>. This site does not add reviews or star ratings. The Kite Kitchen shop is coming soon.</p>
    ${contactLine()}
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
    ${contactLine()}
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
    <p>The pages are static files. A recipe does not ask you to make an account. Nothing on these pages sends a message to a KiteKitchen server, because there isn’t one.</p>
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
    ${contactLine()}
  </article>`
}));

write("guidelines/index.html", page({
  title: "Guidelines · KiteKitchen",
  description: "How KiteKitchen handles recipe suggestions. No made-up reviews or ratings.",
  path: "/guidelines/",
  main: `<article class="kk-wrap"><h1>Guidelines</h1>
    <p>Contact details coming soon. A suggestion is not published as a review. This site does not collect star ratings.</p>
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
  const named = [...new Set(items.map((item) => item.country).filter(Boolean))].sort();
  const description = `${items.length} recipes filed under ${region}${continent ? `, ${continent}` : ""}.`;
  write(`regions/${slug}/index.html`, page({
    title: `${region} · Kite Kitchen`,
    description,
    path: `/regions/${slug}/`,
    image: `/assets/og/regions/${slug}.jpg`,
    current: "map",
    jsonLd: withBreadcrumb(itemListLd(`${region} recipes`, items), [["/", "Home"], ...(continent ? [[`/recipes/?continent=${encodeURIComponent(continent)}`, continent]] : []), [`/regions/${slug}/`, region]]),
    scripts: `<script src="/assets/js/atlas.js" defer></script>`,
    main: `<article class="kk-wrap">
      ${crumbs([["/", "Home"], ...(continent ? [[`/recipes/?continent=${encodeURIComponent(continent)}`, continent]] : []), [`/regions/${slug}/`, region]])}
      <header class="kk-mast">
        <p class="kk-kicker">${escapeHtml(continent || "Recipes")}</p>
        <h1 class="kk-display">${escapeHtml(region)}</h1>
        <p class="dek">${escapeHtml(regionIntro(region, items))}</p>
        <figure class="kk-shot kk-hero-shot kk-route-shot">${worldSvg(Object.values(byIso).map((country) => ({ ...country, count: items.some((item) => item.iso === country.iso) ? items.filter((item) => item.iso === country.iso).length : 0 })), 640, 360, (iso) => countryPath(iso), true, 28)}<figcaption class="kk-caption"><span class="kk-cap-line">${escapeHtml(region)}.</span><span class="kk-credit">Atlas plate. Shaded countries have recipes filed here.</span></figcaption></figure>
        <ul class="kk-info" aria-label="This region"><li>${items.length} recipes</li><li>${named.length} ${named.length === 1 ? "country" : "countries"}</li>${continent ? `<li>${escapeHtml(continent)}</li>` : ""}</ul>
      </header>
      <p class="kk-meta"><a href="/map/">Back to the world map</a></p>
      <ul class="kk-recipe-list">${items.map((item) => `<li><a href="${item.href}">${escapeHtml(item.title)}</a> <span class="kk-meta">${item.iso ? `<a href="${countryPath(item.iso)}">${escapeHtml(item.country || item.section)}</a>` : escapeHtml(item.country || item.section)}</span></li>`).join("")}</ul>
    </article>`
  }));
}
const countryBlocks = [...byCountry.entries()].sort((a, b) => byIso[a[0]].name.localeCompare(byIso[b[0]].name)).map(([iso, items]) => {
  const place = byIso[iso];
  const ns = place.lat >= 0 ? "N" : "S";
  const ew = place.lon >= 0 ? "E" : "W";
  const label = `${Math.abs(Math.round(place.lat))}° ${ns}, ${Math.abs(Math.round(place.lon))}° ${ew}`;
  const regions = [...new Set(items.map((item) => item.region).filter(Boolean))];
  const regionHtml = regions.map((region) => `<a href="/regions/${regionSlug(region)}/">${escapeHtml(region)}</a>`).join(", ");
  return `<section id="${iso}" class="kk-country"><h2><a href="${countryPath(iso)}">${escapeHtml(place.name)}</a></h2><p class="kk-meta">${label}${regionHtml ? ` · ${regionHtml}` : ""}</p><ul class="kk-recipe-list">${items.map((item) => `<li><a href="${item.href}">${escapeHtml(item.title)}</a> <span class="kk-meta">${escapeHtml(item.section)}</span></li>`).join("")}</ul></section>`;
}).join("");
function breadcrumbLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item[1],
      item: `${SITE_ORIGIN}${item[0]}`
    }))
  };
}
function withBreadcrumb(jsonLd, items) {
  const crumb = breadcrumbLd(items);
  if (!jsonLd) return crumb;
  return Array.isArray(jsonLd) ? [...jsonLd, crumb] : [jsonLd, crumb];
}
function itemListLd(name, items) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: `${SITE_ORIGIN}${item.href}`
    }))
  };
}
function journeysThrough(iso) {
  return JOURNEYS.filter((journey) => journey.stops.some((stop) => {
    const href = typeof stop === "string" ? stop : stop.href;
    const item = catalog.find((entry) => entry.href === href);
    return item && item.iso === iso;
  }));
}
for (const [iso, items] of byCountry) {
  const place = byIso[iso];
  const slug = slugByIso[iso];
  const regions = [...new Set(items.map((item) => item.region).filter(Boolean))];
  const continent = items.find((item) => item.continent)?.continent || "";
  const guides = ["Flying Sauces", "Flying Pancakes", "Flying BBQ"].map((section) => ({
    section,
    items: items.filter((item) => item.section === section)
  })).filter((group) => group.items.length);
  const through = journeysThrough(iso);
  const counts = guides.map((group) => `${group.items.length} from ${group.section}`).join(", ");
  const description = `${items.length} recipes are filed under ${place.name}: ${counts}.`;
  const guideNames = guides.map((group) => group.section.replace("Flying ", "")).join(" · ");
  write(`countries/${slug}/index.html`, page({
    title: `${place.name} recipes · Kite Kitchen`,
    description,
    path: `/countries/${slug}/`,
    image: `/assets/og/places/${slug}.jpg`,
    current: "map",
    jsonLd: withBreadcrumb(itemListLd(`Recipes from ${place.name}`, items), [["/", "Home"], ...(continent ? [[`/recipes/?continent=${encodeURIComponent(continent)}`, continent]] : []), [`/countries/${slug}/`, place.name]]),
    main: `<article class="kk-wrap">
      ${crumbs([["/", "Home"], ...(continent ? [[`/recipes/?continent=${encodeURIComponent(continent)}`, continent]] : []), [`/countries/${slug}/`, place.name]])}
      <header class="kk-mast">
        <p class="kk-kicker">${escapeHtml(continent || "Country")}</p>
        <h1 class="kk-display">${escapeHtml(place.name)}</h1>
        <p class="dek">${escapeHtml(description)}</p>
        ${locatorFigure(iso, place.name, "", { hero: true })}
        <ul class="kk-info" aria-label="This country"><li>${items.length} ${items.length === 1 ? "recipe" : "recipes"}</li>${guideNames ? `<li>${escapeHtml(guideNames)}</li>` : ""}<li>${escapeHtml(coordLabel(place.lat, place.lon))}</li></ul>
      </header>
      <p class="kk-meta"><a href="/map/#${iso}">Open ${escapeHtml(place.name)} on the world map</a>${regions.length ? ` · ${regions.map((region) => `<a href="/regions/${regionSlug(region)}/">${escapeHtml(region)}</a>`).join(", ")}` : ""}</p>
      ${landDefs(items)}
      ${guides.map((group) => `<h2>${escapeHtml(group.section)}</h2><div class="kk-rcards">${group.items.map((item) => placeCard(item)).join("")}</div>`).join("")}
      ${through.length ? `<h2>Journeys through ${escapeHtml(place.name)}</h2><div class="kk-rcards">${through.map((journey) => `<article class="kk-rcard"><p class="kk-kicker">Journey</p><h3><a href="/journeys/${journey.slug}/">${escapeHtml(journey.title)}</a></h3><p>${escapeHtml(journey.lede)}</p></article>`).join("")}</div>` : ""}
    </article>`
  }));
}
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
  description: "How to suggest a recipe. Contact details are not published yet.",
  path: "/submit.html",
  main: `<article class="kk-wrap"><h1>Suggest a recipe</h1>${contactLine()}<p class="kk-note">Nothing you send is turned into a rating or a review.</p></article>`
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
function itemPhoto(item) {
  const slug = item.href.split("/").filter(Boolean).at(-1);
  return DISH_PHOTO[slug] || CARD_PHOTO[item.href] || null;
}
function placeCard(item, meal = "") {
  const photo = itemPhoto(item);
  const media = photo
    ? photoFigure(photo, { sizes: "(min-width: 1100px) 22rem, (min-width: 700px) 46vw, 92vw", frame: "kk-shot" }).replace(/<figcaption[\s\S]*?<\/figcaption>/, "")
    : locatorFigure(item.iso, item.country, item.title, { hero: false, symbol: true });
  const kicker = [meal, item.country || item.section].filter(Boolean).join(" · ");
  return `<article class="kk-rcard">${media}<p class="kk-kicker">${escapeHtml(kicker)}</p><h3><a href="${item.href}">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.text)}</p></article>`;
}
function orderedCountries(stops) {
  const names = [];
  for (const stop of stops) {
    if (stop.country && !names.includes(stop.country)) names.push(stop.country);
  }
  return names;
}
function listSentence(names) {
  if (names.length <= 1) return names[0] ? `${names[0]}.` : "";
  if (names.length === 2) return `${names[0]} and ${names[1]}.`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}.`;
}
function routeCaption(names) {
  if (names.length < 2) return names[0] ? `${names[0]}.` : "The route.";
  if (names.length === 2) return `From ${names[0]} to ${names[1]}.`;
  return `From ${names[0]}, through ${names.slice(1, -1).join(", ")}, to ${names.at(-1)}.`;
}
function routePlaces(stops) {
  const seen = new Set();
  const places = [];
  for (const stop of stops) {
    const place = byIso[stop.iso];
    if (!place || !Number.isFinite(place.lat)) continue;
    const key = `${place.lat.toFixed(2)},${place.lon.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    places.push(place);
  }
  return places;
}
for (const journey of JOURNEYS) {
  const stops = journeyStops(journey);
  const day = DAY_JOURNEYS.includes(journey);
  const names = orderedCountries(stops);
  const places = routePlaces(stops);
  const dishes = listSentence(stops.map((item) => item.title));
  const dek = day ? dishes : journey.lede;
  const hero = places.length >= 2
    ? `<figure class="kk-shot kk-hero-shot kk-route-shot">${routeSvg(places)}<figcaption class="kk-caption"><span class="kk-cap-line">${escapeHtml(routeCaption(names))}</span><span class="kk-credit">Route plate.</span></figcaption></figure>`
    : locatorFigure(stops[0]?.iso, names[0] || stops[0]?.country, "", { hero: true });
  const meals = stops.map((item) => item.meal).filter((meal) => meal && !/^Recipe \d+$/.test(meal));
  const facts = [
    `${stops.length} ${stops.length === 1 ? "stop" : "stops"}`,
    names.join(" · "),
    meals.length ? meals.join(" · ") : ""
  ].filter(Boolean);
  write(`journeys/${journey.slug}/index.html`, page({
    title: `${journey.title} · Kite Kitchen`,
    description: dek,
    path: `/journeys/${journey.slug}/`,
    image: `/assets/og/itineraries/${journey.slug}.jpg`,
    jsonLd: itemListLd(journey.title, stops),
    current: "journeys",
    main: `<article class="kk-wrap">${crumbs([["/", "Kite Kitchen"], ["/journeys/", "Journeys"], [`/journeys/${journey.slug}/`, journey.title]])}
      <header class="kk-mast">
        <p class="kk-kicker">${day ? "A day around the world" : "Journey"}</p>
        <h1 class="kk-display">${escapeHtml(journey.title)}</h1>
        <p class="dek">${escapeHtml(dek)}</p>
        ${hero}
        <ul class="kk-info" aria-label="This journey">${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>
      </header>
      ${landDefs(stops)}
      <div class="kk-rcards">${stops.map((item) => placeCard(item, item.meal)).join("")}</div>
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

for (const collection of COLLECTIONS) {
  const stops = collectionStops(collection);
  const names = orderedCountries(stops);
  const facts = [
    `${stops.length} recipes`,
    `${names.length} ${names.length === 1 ? "country" : "countries"}`,
    collection.when || ""
  ].filter(Boolean);
  write(`collections/${collection.slug}/index.html`, page({
    title: `${collection.title} · Kite Kitchen`,
    description: collection.lede,
    path: `/collections/${collection.slug}/`,
    image: `/assets/og/collections/${collection.slug}.jpg`,
    jsonLd: itemListLd(collection.title, stops),
    main: `<article class="kk-wrap">${crumbs([["/", "Kite Kitchen"], ["/collections/", "Collections"], [`/collections/${collection.slug}/`, collection.title]])}
      <header class="kk-mast">
        <p class="kk-kicker">Collection</p>
        <h1 class="kk-display">${escapeHtml(collection.title)}</h1>
        <p class="dek">${escapeHtml(collection.lede)}</p>
        ${collectionPlate(stops)}
        <ul class="kk-info" aria-label="This collection">${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>
      </header>
      ${landDefs(stops)}
      <div class="kk-rcards">${stops.map((item) => placeCard(item, item.meal)).join("")}</div>
      <p class="kk-meta"><a href="/collections/">All collections</a></p>
    </article>`
  }));
}
const featuredCollection = COLLECTIONS.find((item) => item.slug === HOME_FEATURE);
write("collections/index.html", page({
  title: "Collections · Kite Kitchen",
  description: "Reading orders through recipes already on Kite Kitchen. The home page features one collection for the date the site was built.",
  path: "/collections/",
  image: `/assets/og/collections/${featuredCollection.slug}.jpg`,
  main: `<div class="kk-wrap">${crumbs([["/", "Kite Kitchen"], ["/collections/", "Collections"]])}
    <header class="kk-mast">
      <p class="kk-kicker">Reading orders</p>
      <h1 class="kk-display">Collections</h1>
      <p class="dek">Recipes already on this site. The home page features one collection for the date the site was built: the holiday table through November 30, winter warmers from December through February, breakfast from March through May, street food from June through August, and the weeknight list from September through October.</p>
    </header>
    <div class="kk-catalog kk-collection-catalog">${COLLECTIONS.map((collection) => {
      const stops = collectionStops(collection);
      const names = orderedCountries(stops);
      const onHome = collection.slug === featuredCollection.slug;
      const plate = routeSvg(routePlaces(stops), `Map of ${collection.title}`);
      return `<article class="kk-book"><a class="kk-catalog-map" href="/collections/${collection.slug}/">${plate}</a><div><p class="kk-kicker">${escapeHtml(collection.when || "Collection")}${onHome ? " · On the home page" : ""}</p><h2><a href="/collections/${collection.slug}/">${escapeHtml(collection.title)}</a></h2><p class="dek">${escapeHtml(collection.lede)}</p><p class="kk-meta">${stops.length} recipes · ${names.length} ${names.length === 1 ? "country" : "countries"}</p></div></article>`;
    }).join("")}</div>
  </div>`
}));

const passportPlate = worldSvg(countries.map((country) => ({ ...country, count: 0 })), 640, 360, null, true, 14)
  .replace('aria-label="World map. Countries with recipes can be opened."', 'aria-label="Atlas plate for saved recipes"')
  .replace("</svg>", `<g id="kk-stamps"></g></svg>`);
write("assets/passport-index.json", JSON.stringify(catalog.map((item) => {
  const place = byIso[item.iso];
  return {
    href: item.href,
    title: item.title,
    country: item.country || "",
    section: item.section,
    lat: place ? place.lat : null,
    lon: place ? place.lon : null
  };
})));
write("passport/index.html", page({
  title: "My passport · Kite Kitchen",
  description: "Recipes saved in this browser, stamped on a world plate. Nothing is sent to a server.",
  path: "/passport/",
  image: "/assets/og/passport.jpg",
  current: "passport",
  scripts: `<script src="/assets/js/passport.js" defer></script>`,
  main: `<article class="kk-wrap">${crumbs([["/", "Kite Kitchen"], ["/passport/", "Passport"]])}
    <header class="kk-mast">
      <p class="kk-kicker">This browser</p>
      <h1 class="kk-display">My passport</h1>
      <p class="dek" data-passport-lede>Save a recipe and it earns a stamp. The list stays in this browser. Nothing is sent on.</p>
      <p class="kk-meta" data-passport-count hidden></p>
    </header>
    <figure class="kk-shot kk-hero-shot kk-passport-plate">${passportPlate}<figcaption class="kk-caption"><span class="kk-cap-line" data-passport-caption>No stamps yet.</span><span class="kk-credit">Atlas plate. A stamp marks a country with a saved recipe.</span></figcaption></figure>
    <p class="kk-passport-empty" data-passport-empty>Open a recipe and press Save. The stamp appears here.</p>
    <ul class="kk-recipe-list" data-passport-list hidden></ul>
  </article>`
}));

const MEAL_OF = {
  breakfast: "Breakfast",
  snack: "Snack",
  street: "Snack",
  dessert: "Dessert",
  feast: "Feast",
  holiday: "Feast",
  dipping: "At the table",
  accompaniment: "At the table"
};
function usesMap(file, key) {
  const data = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  const list = Array.isArray(data) ? data : data[key] || [];
  return list.map((item) => [item.slug, [...new Set((item.uses || []).map((use) => MEAL_OF[use]).filter(Boolean))]]);
}
const mealsBySlug = new Map([
  ...usesMap("flying-sauces/data/index.json", "sauces"),
  ...usesMap("flying-pancakes/data/index.json", "pancakes"),
  ...usesMap("flying-bbq/data/dishes/raw.json")
]);
const searchItems = catalog.map((item) => {
  const slug = item.href.split("/").filter(Boolean).at(-1);
  const photo = DISH_PHOTO[slug] || CARD_PHOTO[item.href];
  const place = byIso[item.iso];
  return {
    title: item.title,
    href: item.href,
    section: item.section,
    text: item.text,
    country: item.country || "",
    region: item.region || "",
    meals: mealsBySlug.get(slug) || [],
    thumb: photo ? `/assets/photos/editorial/${photo.id}-card-${photo.cardWidth}.jpg` : "",
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
    <header class="kk-mast">
      <p class="kk-kicker">Index</p>
      <h1 class="kk-display">Search</h1>
      <p class="dek">A dish, a country, or a guide. The list stays in the browser.</p>
    </header>
    ${searchForm("q", "Pesto, dosa, asado", "search-form")}
    <div class="kk-filters">
      <label>Country <select id="search-country" aria-label="Country"><option value="">All countries</option></select></label>
      <div class="kk-chips" role="group" aria-label="Meal">
        ${["All", "Breakfast", "Snack", "Dessert", "Feast", "At the table"].map((name, index) => `<button type="button"${index === 0 ? ' class="is-on"' : ""} data-meal="${name === "All" ? "all" : name}" aria-pressed="${index === 0 ? "true" : "false"}">${name}</button>`).join("")}
      </div>
    </div>
    <p id="search-status" class="kk-meta" role="status" aria-live="polite"></p>
    <p id="search-empty" class="kk-empty" hidden>Nothing on this route matches. Try another dish, or clear the country and the meal.</p>
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

function quantityValue(token) {
  const mixed = String(token).trim().match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = String(token).trim().match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

function normalizeIngredient(text) {
  return text.replace(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(tbsp|tsp|lbs?|oz)\b\.?/gi, (all, num, unit) => {
    const value = quantityValue(num);
    const one = value === 1;
    const key = unit.toLowerCase();
    const word = key === "tbsp" ? (one ? "tablespoon" : "tablespoons")
      : key === "tsp" ? (one ? "teaspoon" : "teaspoons")
      : key === "lb" || key === "lbs" ? (one ? "pound" : "pounds")
      : (one ? "ounce" : "ounces");
    return `${num} ${word}`;
  }).replace(/\s+/g, " ").trim();
}

function splitStep(text) {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z“"])/).map((part) => part.trim()).filter(Boolean);
  if (sentences.length <= 3) return [text];
  const chunks = [];
  for (let i = 0; i < sentences.length; i += 3) chunks.push(sentences.slice(i, i + 3).join(" "));
  return chunks;
}

function polishMethod(html) {
  html = html.replace(/<ul class="ingredients">([\s\S]*?)<\/ul>/, (_, inner) => {
    const items = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => `<li>${normalizeIngredient(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())}</li>`);
    return `<ul class="ingredients">${items.join("")}</ul>`;
  });
  html = html.replace(/<ol class="steps">([\s\S]*?)<\/ol>/, (_, inner) => {
    const next = [];
    for (const match of inner.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
      if (/<[a-z]/i.test(match[1])) {
        next.push(`<li>${match[1]}</li>`);
        continue;
      }
      const plain = match[1].replace(/\s+/g, " ").trim();
      for (const chunk of splitStep(plain)) next.push(`<li>${chunk}</li>`);
    }
    return `<ol class="steps">${next.join("")}</ol>`;
  });
  return html;
}

function durationFrom(label) {
  if (!label) return null;
  const hours = label.match(/(\d+)\s*hr/i);
  const minutes = label.match(/(\d+)\s*min/i);
  if (!hours && !minutes) return null;
  const h = hours ? Number(hours[1]) : 0;
  const m = minutes ? Number(minutes[1]) : 0;
  if (h && m) return `PT${h}H${m}M`;
  if (h) return `PT${h}H`;
  return `PT${m}M`;
}

function minutesFromDuration(value) {
  if (!value) return 0;
  const hours = value.match(/(\d+)H/);
  const minutes = value.match(/(\d+)M/);
  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}

function durationFromMinutes(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours && minutes) return `PT${hours}H${minutes}M`;
  if (hours) return `PT${hours}H`;
  return `PT${minutes}M`;
}

function syncRecipeLd(html) {
  const ingredientBlock = html.match(/<ul class="ingredients">([\s\S]*?)<\/ul>/);
  const ingredients = ingredientBlock ? [...ingredientBlock[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) : [];
  const stepBlock = html.match(/<ol class="steps">([\s\S]*?)<\/ol>/);
  const steps = stepBlock ? [...stepBlock[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) : [];
  const info = (html.match(/<ul class="kk-info"[\s\S]*?<\/ul>/) || [""])[0];
  const bits = [...info.matchAll(/<li>([^<]+)<\/li>/g)].map((match) => match[1].trim());
  const prep = bits.find((bit) => /prep/i.test(bit));
  const cook = bits.find((bit) => /cook/i.test(bit));
  const serves = (info.match(/Serves\s+(\d+)/i) || [])[1];
  const yieldItem = bits.find((bit) => !/prep|cook|serves/i.test(bit));
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (full, raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return full; }
    const list = Array.isArray(data) ? data : [data];
    let changed = false;
    for (const node of list) {
      if (!node || node["@type"] !== "Recipe") continue;
      if (ingredients.length) {
        node.recipeIngredient = ingredients;
        changed = true;
      }
      if (steps.length) {
        node.recipeInstructions = steps.map((text) => ({ "@type": "HowToStep", text }));
        changed = true;
      }
      node.author = { "@type": "Organization", name: "Kite Kitchen" };
      changed = true;
      const photoSlug = (html.match(/data-photo="([^"]+)"/) || [])[1];
      const dishPhoto = photoSlug ? DISH_PHOTO[photoSlug] : null;
      if (dishPhoto) node.image = `${SITE_ORIGIN}/assets/photos/editorial/${dishPhoto.id}-mast-${dishPhoto.mastWidth}.jpg`;
      else if (typeof node.image === "string" && node.image.includes("/assets/photos/editorial/")) delete node.image;
      else if (typeof node.image === "string" && node.image.startsWith("/")) node.image = `${SITE_ORIGIN}${node.image}`;
      delete node.datePublished;
      const prepTime = durationFrom(prep);
      const cookTime = durationFrom(cook);
      if (prepTime) node.prepTime = prepTime;
      if (cookTime) node.cookTime = cookTime;
      if (prepTime || cookTime) node.totalTime = durationFromMinutes(minutesFromDuration(prepTime) + minutesFromDuration(cookTime));
      if (serves && yieldItem) node.recipeYield = `${serves} servings (${yieldItem})`;
      else if (serves) node.recipeYield = `${serves} servings`;
      else if (yieldItem) node.recipeYield = yieldItem;
      if (prepTime || cookTime || serves || yieldItem) changed = true;
    }
    if (!changed) return full;
    return `<script type="application/ld+json">${JSON.stringify(Array.isArray(data) ? list : list[0]).replace(/</g, "\\u003c")}</script>`;
  });
}

let pantryPages = [];

function ingredientBlob(item) {
  const file = path.join(root, item.href.slice(1), "index.html");
  if (!fs.existsSync(file)) return "";
  const html = fs.readFileSync(file, "utf8");
  const block = html.match(/<ul class="ingredients">([\s\S]*?)<\/ul>/);
  return block ? block[1].replace(/<[^>]+>/g, " ") : "";
}

function buildPantry() {
  fs.rmSync(path.join(root, "pantry"), { recursive: true, force: true });
  const ranked = PANTRY_TERMS.map((term) => {
    const re = new RegExp(term.pattern, "i");
    const recipes = catalog.filter((item) => re.test(ingredientBlob(item)));
    return { ...term, slug: pantrySlug(term.name), recipes };
  }).filter((term) => term.recipes.length).sort((a, b) => b.recipes.length - a.recipes.length || a.name.localeCompare(b.name));
  pantryPages = ranked.slice(0, 60);
  const continents = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
  write("pantry/index.html", page({
    title: "Pantry atlas · Kite Kitchen",
    description: "The ingredients named most often in the recipes on Kite Kitchen, each with the recipes that list it.",
    path: "/pantry/",
    image: "/assets/og/pantry.jpg",
    jsonLd: breadcrumbLd([["/", "Home"], ["/pantry/", "Pantry"]]),
    main: `<div class="kk-wrap">${crumbs([["/", "Home"], ["/pantry/", "Pantry"]])}
      <header class="kk-mast">
        <p class="kk-kicker">From the ingredient lines</p>
        <h1 class="kk-display">Pantry atlas</h1>
        <p class="dek">The ${pantryPages.length} ingredients named most often in the recipes on this site. Each page lists those recipes, grouped by continent. The count is the number of recipes whose ingredient list matches.</p>
      </header>
      <ul class="kk-pantry-index">${pantryPages.map((term) => `<li><a href="/pantry/${term.slug}/">${escapeHtml(term.name)}</a><span class="kk-meta">${term.recipes.length} ${term.recipes.length === 1 ? "recipe" : "recipes"}</span></li>`).join("")}</ul>
    </div>`
  }));
  for (const term of pantryPages) {
    const counts = new Map();
    for (const item of term.recipes) if (item.iso) counts.set(item.iso, (counts.get(item.iso) || 0) + 1);
    const plate = worldSvg(Object.values(byIso).map((country) => ({ ...country, count: counts.get(country.iso) || 0 })), 640, 360, (iso) => countryPath(iso), true, 16);
    const countries = new Set(term.recipes.map((item) => item.country).filter(Boolean));
    const usedContinents = continents.filter((name) => term.recipes.some((item) => item.continent === name));
    const label = term.name.toLowerCase();
    const groups = usedContinents.map((name) => {
      const items = term.recipes.filter((item) => item.continent === name).slice().sort((a, b) => a.country.localeCompare(b.country) || a.title.localeCompare(b.title));
      return `<section class="kk-pantry-group"><h2>${escapeHtml(name)}</h2><ul class="kk-recipe-list">${items.map((item) => `<li><a href="${item.href}">${escapeHtml(item.title)}</a> <span class="kk-meta">${escapeHtml([item.country, item.section].filter(Boolean).join(" · "))}</span></li>`).join("")}</ul></section>`;
    }).join("");
    write(`pantry/${term.slug}/index.html`, page({
      title: `${term.name} · Pantry atlas`,
      description: `${term.recipes.length} recipes on Kite Kitchen list ${label}.`,
      path: `/pantry/${term.slug}/`,
      image: `/assets/og/pantry/${term.slug}.jpg`,
      jsonLd: breadcrumbLd([["/", "Home"], ["/pantry/", "Pantry"], [`/pantry/${term.slug}/`, term.name]]),
      main: `<article class="kk-wrap">${crumbs([["/", "Home"], ["/pantry/", "Pantry"], [`/pantry/${term.slug}/`, term.name]])}
        <header class="kk-mast">
          <p class="kk-kicker">Pantry</p>
          <h1 class="kk-display">${escapeHtml(term.name)}</h1>
          <p class="dek">${term.recipes.length} ${term.recipes.length === 1 ? "recipe lists" : "recipes list"} ${escapeHtml(label)}.</p>
          <figure class="kk-shot kk-pantry-plate">${plate}<figcaption class="kk-caption"><span class="kk-cap-line">${escapeHtml(term.name)}.</span><span class="kk-credit">Atlas plate. Shaded countries have a recipe that lists ${escapeHtml(label)}.</span></figcaption></figure>
          <ul class="kk-info" aria-label="This ingredient"><li>${term.recipes.length} ${term.recipes.length === 1 ? "recipe" : "recipes"}</li><li>${countries.size} ${countries.size === 1 ? "country" : "countries"}</li><li>${usedContinents.length} ${usedContinents.length === 1 ? "continent" : "continents"}</li></ul>
        </header>
        ${groups}
        <p class="kk-meta"><a href="/pantry/">All pantry ingredients</a></p>
      </article>`
    }));
  }
}

function linkableName(match, name) {
  const word = match.toLowerCase().replace(/[^a-z]+/g, " ").trim();
  const base = name.toLowerCase();
  if (word === base || word === `${base}s` || `${word}s` === base) return true;
  if (base.endsWith("ies") && word === `${base.slice(0, -3)}y`) return true;
  if (word.length >= 4 && (base.startsWith(word) || word.startsWith(base))) return true;
  const aliases = { chilies: ["chile", "chiles", "chili", "chilis", "chillies"], chickpeas: ["chickpea", "garbanzo"], yogurt: ["yoghurt"] };
  return (aliases[base] || []).includes(word);
}

function linkPantry(html) {
  if (!pantryPages.length || !html.includes('<ul class="ingredients">')) return html;
  const terms = pantryPages.slice().sort((a, b) => b.name.length - a.name.length);
  return html.replace(/<ul class="ingredients">([\s\S]*?)<\/ul>/, (full, inner) => {
    const linked = inner.replace(/<li>([\s\S]*?)<\/li>/g, (line, text) => {
      if (text.includes("kk-pantry")) return line;
      const hits = [];
      for (const term of terms) {
        const re = new RegExp(term.pattern, "gi");
        let match;
        while ((match = re.exec(text))) {
          if (!linkableName(match[0], term.name)) continue;
          hits.push({ start: match.index, end: match.index + match[0].length, slug: term.slug });
        }
      }
      hits.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start);
      const kept = [];
      for (const hit of hits) {
        if (kept.some((item) => hit.start < item.end && hit.end > item.start)) continue;
        kept.push(hit);
      }
      kept.sort((a, b) => b.start - a.start);
      let next = text;
      for (const hit of kept) {
        next = `${next.slice(0, hit.start)}<a class="kk-pantry" href="/pantry/${hit.slug}/">${next.slice(hit.start, hit.end)}</a>${next.slice(hit.end)}`;
      }
      return `<li>${next}</li>`;
    });
    return `<ul class="ingredients">${linked}</ul>`;
  });
}

function polishRecipes() {
  const priority = prioritySlugs();
  const sections = [["flying-sauces", "sauces", "Flying Sauces"], ["flying-pancakes", "pancakes", "Flying Pancakes"], ["flying-bbq", "dishes", "Flying BBQ"]];
  for (const [dir, folder, name] of sections) {
    for (const slug of dirs(`${dir}/${folder}`)) {
      const file = path.join(root, dir, folder, slug, "index.html");
      let html = fs.readFileSync(file, "utf8");
      const title = textOf(html, /<h1[^>]*>([\s\S]*?)<\/h1>/);
      const selfHref = `/${dir}/${folder}/${slug}/`;
      const selfEarly = catalog.find((item) => item.href === selfHref);
      const trail = [["/", "Home"]];
      if (selfEarly?.continent) trail.push([`/recipes/?continent=${encodeURIComponent(selfEarly.continent)}`, selfEarly.continent]);
      if (selfEarly?.iso && selfEarly.country) trail.push([countryPath(selfEarly.iso), selfEarly.country]);
      trail.push([selfHref, title]);
      const crumb = crumbs(trail);
      if (html.includes("kk-crumbs")) html = html.replace(/<nav class="kk-crumbs"[\s\S]*?<\/nav>/, crumb);
      else html = html.replace(/<p class="eyebrow">/, `${crumb}\n        <p class="eyebrow">`);
      html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (full, raw) => {
        let data;
        try { data = JSON.parse(raw); } catch { return full; }
        const list = Array.isArray(data) ? data : [data];
        if (!list.some((node) => node && (node["@type"] === "Recipe" || node["@type"] === "BreadcrumbList"))) return full;
        const rest = list.filter((node) => node && node["@type"] !== "BreadcrumbList");
        rest.push(breadcrumbLd(trail));
        return `<script type="application/ld+json">${JSON.stringify(rest).replace(/</g, "\\u003c")}</script>`;
      });
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
      } else if (html.includes("/assets/photos/editorial/")) {
        const iso = (html.match(/country=([A-Z]{2})/) || [])[1];
        const countryName = textOf(html, /<dt>Country<\/dt>\s*<dd>([^<]+)/) || textOf(html, /<p class="meta">([^·<]+)/);
        const dish = textOf(html, /<h1[^>]*>([\s\S]*?)<\/h1>/);
        html = html.replace(/<figure\b[^>]*>[\s\S]*?\/assets\/photos\/editorial\/[\s\S]*?<\/figure>/, locatorFigure(iso, countryName, dish));
      }
      const notDish = /not the (?:sauce|dish|pancake)|not a photograph of the dish|Place, not the dish|shows the (?:region|place), not/i;
      const hero = html.match(/<figure class="(?:photo-hero|pancake-hero|stop-hero)[^"]*"[\s\S]*?<\/figure>/);
      if (!html.includes("data-photo=") && (html.includes("data-kk-locator") || (hero && notDish.test(hero[0])))) {
        const iso = (html.match(/country=([A-Z]{2})/) || [])[1];
        const countryName = textOf(html, /<dt>Country<\/dt>\s*<dd>([^<]+)/) || textOf(html, /<p class="meta">([^·<]+)/);
        const dish = textOf(html, /<h1[^>]*>([\s\S]*?)<\/h1>/);
        const figure = locatorFigure(iso, countryName, dish);
        const replaced = html.includes("data-kk-locator")
          ? html.replace(/<figure class="kk-(?:locator-fallback|atlas-card)\b[^"]*"[\s\S]*?<\/figure>/, figure)
          : html.replace(/<figure class="(?:photo-hero|pancake-hero|stop-hero)[^"]*"[\s\S]*?<\/figure>/, figure);
        if (replaced !== html) html = replaced;
      }
      if (html.includes('class="kk-method"') && !html.includes('id="kk-method"')) {
        html = html.replace('class="kk-method"', 'class="kk-method" id="kk-method"');
      }
      html = html.replace(/<p class="kk-tools[\s\S]*?<\/p>\s*/g, "");
      if (html.includes("kk-mast")) {
        const tools = `<p class="kk-tools no-print"><a class="kk-button" href="#kk-method">Jump to recipe</a> <button type="button" class="kk-button quiet" data-save aria-pressed="false">Save</button> <button type="button" class="kk-button quiet" data-cook aria-pressed="false">Cook mode</button> <button type="button" class="kk-button quiet" data-print>Print</button></p>`;
        const start = html.indexOf('<div class="kk-mast">');
        let depth = 0;
        let end = -1;
        for (let i = start; i < html.length; i += 1) {
          if (html.startsWith("<div", i)) depth += 1;
          else if (html.startsWith("</div>", i)) {
            depth -= 1;
            if (depth === 0) {
              end = i + 6;
              break;
            }
          }
        }
        if (end > start) html = `${html.slice(0, end)}\n${tools}${html.slice(end)}`;
      }
      html = html.replace(/<div class="kk-more">[\s\S]*?<\/div>\s*/g, "");
      html = html.replace(/<section class="kk-related">[\s\S]*?<\/section>\s*/g, "");
      const self = selfEarly;
      const blocks = [];
      const tables = COLLECTIONS.flatMap((collection) => collection.stops.flatMap((stop) => {
        if (stop.href !== selfHref) return [];
        const label = stop.seat || collection.when || "";
        return [`<li><a href="/collections/${collection.slug}/">${escapeHtml(collection.title)}</a>${label ? ` <span class="kk-meta">${escapeHtml(label)}</span>` : ""}</li>`];
      }));
      if (tables.length) {
        blocks.push(`<section class="kk-also"><h2>In this collection</h2><ul class="kk-recipe-list">${tables.join("")}</ul></section>`);
      }
      const trips = JOURNEYS.flatMap((journey) => journey.stops.flatMap((stop) => {
        const href = typeof stop === "string" ? stop : stop.href;
        if (href !== selfHref) return [];
        const meal = typeof stop === "string" ? "" : stop.meal;
        return [`<li><a href="/journeys/${journey.slug}/">${escapeHtml(journey.title)}</a>${meal ? ` <span class="kk-meta">${escapeHtml(meal)}</span>` : ""}</li>`];
      }));
      if (trips.length) {
        blocks.push(`<section class="kk-also"><h2>From the journey</h2><ul class="kk-recipe-list">${trips.join("")}</ul></section>`);
      }
      if (self && (self.country || self.region)) {
        const recipeList = (items) => `<ul class="kk-recipe-list">${items.map((item) => `<li><a href="${item.href}">${escapeHtml(item.title)}</a> <span class="kk-meta">${escapeHtml(item.section)}</span></li>`).join("")}</ul>`;
        const sameCountry = self.country ? catalog.filter((item) => item.country === self.country && item.href !== selfHref) : [];
        const countryPicks = sameCountry.slice(0, 4);
        const regionPicks = [];
        if (countryPicks.length < 4 && self.region) {
          const used = new Set([selfHref, ...countryPicks.map((item) => item.href)]);
          for (const item of catalog) {
            if (regionPicks.length >= 4 - countryPicks.length) break;
            if (item.region !== self.region || used.has(item.href)) continue;
            regionPicks.push(item);
          }
        }
        if (countryPicks.length) {
          blocks.push(`<section class="kk-also"><h2>Also from ${escapeHtml(self.country)}</h2>${recipeList(countryPicks)}</section>`);
        }
        if (regionPicks.length) {
          blocks.push(`<section class="kk-also"><h2>Also from ${escapeHtml(self.region)}</h2>${recipeList(regionPicks)}</section>`);
        }
      }
      if (blocks.length) {
        html = html.replace(/<\/article>/, `<div class="kk-more">${blocks.join("")}</div>\n</article>`);
      }
      html = html.replace(/<figure\b[^>]*class="(?:photo-hero|pancake-hero|stop-hero)[^"]*"[\s\S]*?<\/figure>/g, (figure) => figure.replace(/<figcaption>([\s\S]*?)<\/figcaption>/, (_, inner) => {
        if (inner.includes("kk-cap-line")) return `<figcaption>${inner}</figcaption>`;
        const note = inner.match(/<span class="photo-note">([\s\S]*?)<\/span>/);
        const title = note ? note[1].trim() : "";
        const rest = inner.replace(/<span class="photo-note">[\s\S]*?<\/span>/, "").trim();
        return `<figcaption class="kk-caption">${title ? `<span class="kk-cap-line">${title}</span>` : ""}<span class="kk-credit">${rest}</span></figcaption>`;
      }));
      if (!html.includes("kk-servings")) {
        const serves = html.match(/<li>Serves\s+(\d+)/i);
        if (serves) {
          const count = Number(serves[1]);
          const label = `${count} ${count === 1 ? "serving" : "servings"}`;
          const control = `<p class="kk-servings no-print"><button type="button" class="kk-button quiet" data-serves="-1" aria-label="Fewer servings">−</button><span data-serves-count>${label}</span><button type="button" class="kk-button quiet" data-serves="1" aria-label="More servings">+</button></p>`;
          html = html.replace(/(<ul class="kk-info"[\s\S]*?<\/ul>)/, `$1\n${control}`);
        }
      }
      const heroFig = html.match(/<figure\b[^>]*class="(?:photo-hero|pancake-hero|stop-hero|kk-shot|kk-atlas-card|kk-locator-fallback)[^"]*"[\s\S]*?<\/figure>/);
      if (heroFig && html.includes('<p class="dek">')) {
        const figure = heroFig[0];
        html = html.replace(figure, "");
        html = html.replace(/(<p class="dek">[\s\S]*?<\/p>)\s*/, `$1\n${figure}\n`);
      }
      const printBrand = `<p class="print-only print-brand">${KITE_MARK}<span>Kite Kitchen</span></p>`;
      if (html.includes("print-brand")) html = html.replace(/<p class="print-only print-brand">[\s\S]*?<\/p>/, printBrand);
      else html = html.replace(/<h1\b/, `${printBrand}\n<h1`);
      if (!html.includes("/assets/js/recipe.js")) {
        html = html.replace("</body>", `<script src="/assets/js/recipe.js" defer></script>\n</body>`);
      }
      if (!html.includes("/assets/js/passport.js")) {
        html = html.replace("</body>", `<script src="/assets/js/passport.js" defer></script>\n</body>`);
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
      html = html.replace(/<link rel="preload" as="image" type="image\/avif" href="\/assets\/photos\/editorial\/[^"]*"[\s\S]*?>\n?/g, "");
      const avif = html.match(/<source type="image\/avif" srcset="(\/assets\/photos\/editorial\/[^"]+)" sizes="([^"]+)"/);
      if (avif) {
        const href = avif[1].split(",")[0].trim().split(/\s+/)[0];
        html = html.replace("</head>", `<link rel="preload" as="image" type="image/avif" href="${href}" imagesrcset="${avif[1]}" imagesizes="${avif[2]}">\n</head>`);
      }
      const kind = folder === "sauces" ? "sauces" : folder === "pancakes" ? "pancakes" : "bbq";
      html = html.replace(/<div class="kk-method" id="kk-method">([\s\S]*?)<\/div>/, (_, inner) => {
        const ads = [...inner.matchAll(/<aside class="kk-ad[\s\S]*?<\/aside>/g)].map((match) => match[0]);
        const clean = inner.replace(/<aside class="kk-ad[\s\S]*?<\/aside>/g, "");
        return `${ads.join("\n")}<div class="kk-method" id="kk-method">${clean}</div>`;
      });
      html = polishMethod(html);
      html = syncRecipeLd(html);
      if (!html.includes("kk-units") && html.includes("kk-info")) {
        const toggle = `<p class="kk-units no-print" role="group" aria-label="Units"><button type="button" class="kk-button quiet is-on" data-units="us" aria-pressed="true">US</button><button type="button" class="kk-button quiet" data-units="metric" aria-pressed="false">Metric</button></p>`;
        html = html.includes("kk-servings")
          ? html.replace(/(<p class="kk-servings[\s\S]*?<\/p>)/, `$1\n${toggle}`)
          : html.replace(/(<ul class="kk-info"[\s\S]*?<\/ul>)/, `$1\n${toggle}`);
      }
      html = linkPantry(html);
      html = stampOg(html, `/assets/og/recipes/${kind}-${slug}.jpg`);
      fs.writeFileSync(file, html);
    }
  }
}

const GUIDE_OPENING = {
  "Flying Sauces": {
    dek: "Sauces from the table, the mortar, and the market.",
    start: ["/flying-sauces/sauces/pesto-alla-genovese/", "/flying-sauces/sauces/chimichurri/", "/flying-sauces/sauces/mole-poblano/"]
  },
  "Flying Pancakes": {
    dek: "Batters, griddles, and the pancakes that travel with them.",
    start: ["/flying-pancakes/pancakes/crepes-suzette/", "/flying-pancakes/pancakes/masala-dosa/", "/flying-pancakes/pancakes/injera/"]
  },
  "Flying BBQ": {
    dek: "Fire, smoke, and the dishes cooked over them.",
    start: ["/flying-bbq/dishes/argentine-asado/", "/flying-bbq/dishes/tandoori-chicken/", "/flying-bbq/dishes/jamaican-jerk-chicken/"]
  }
};

function guideMast(name, items) {
  const opening = GUIDE_OPENING[name];
  const countries = new Set(items.map((item) => item.country).filter(Boolean));
  const continents = [...new Set(items.map((item) => item.continent).filter(Boolean))];
  const counts = new Map();
  for (const item of items) if (item.iso) counts.set(item.iso, (counts.get(item.iso) || 0) + 1);
  const plate = worldSvg(Object.values(byIso).map((country) => ({ ...country, count: counts.get(country.iso) || 0 })), 640, 360, (iso) => countryPath(iso), true, 18);
  const picks = opening.start.map((href) => catalog.find((item) => item.href === href)).filter(Boolean);
  return `<header class="kk-mast kk-guide-mast">
      <p class="kk-kicker">Guide</p>
      <h1 class="kk-display">${escapeHtml(name)}</h1>
      <p class="dek">${escapeHtml(opening.dek)}</p>
      <figure class="kk-shot kk-hero-shot kk-route-shot">${plate}<figcaption class="kk-caption"><span class="kk-cap-line">${escapeHtml(name)}.</span><span class="kk-credit">Atlas plate. Shaded countries have recipes in this guide.</span></figcaption></figure>
      <ul class="kk-info" aria-label="This guide"><li>${items.length} recipes</li><li>${countries.size} countries</li><li>${continents.length} continents</li></ul>
    </header>
    <h2>Start here</h2>
    <div class="kk-rcards">${picks.map((item) => placeCard(item)).join("")}</div>`;
}

function mountBrowse(rel, items, name) {
  const file = path.join(root, rel);
  let html = fs.readFileSync(file, "utf8");
  const block = browseBlock(items);
  const mast = guideMast(name, items);
  if (html.includes("kk-guide-mast")) {
    html = html.replace(/<header class="kk-mast kk-guide-mast">[\s\S]*?<\/header>\s*<h2>Start here<\/h2>\s*<div class="kk-rcards">[\s\S]*?<\/div>/, mast);
  } else {
    html = html.replace(/<section class="hero">[\s\S]*?<\/section>/, mast);
  }
  if (html.includes('id="kk-browse"')) {
    html = html.replace(/<section id="kk-browse"[\s\S]*?<\/section>\s*<script src="\/assets\/js\/filter.js" defer><\/script>/, block);
  } else {
    html = html.replace(/<\/main>/, `${block}\n</main>`);
  }
  fs.writeFileSync(file, html);
}

buildPantry();
polishRecipes();
mountBrowse("flying-sauces/index.html", catalog.filter((item) => item.section === "Flying Sauces"), "Flying Sauces");
mountBrowse("flying-pancakes/index.html", catalog.filter((item) => item.section === "Flying Pancakes"), "Flying Pancakes");
mountBrowse("flying-bbq/index.html", catalog.filter((item) => item.section === "Flying BBQ"), "Flying BBQ");

function photoFile(photo) {
  if (!photo) return "";
  return `assets/photos/editorial/${photo.id}-card-${photo.cardWidth}.jpg`;
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
  { out: "assets/og/passport.jpg", title: "My passport", kicker: "Kite Kitchen", line: "Saved in this browser. Nothing is sent on." },
  { out: "assets/og/pantry.jpg", title: "Pantry atlas", kicker: "Kite Kitchen", line: "Ingredients named in the recipes on this site." },
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
for (const collection of COLLECTIONS) {
  const stops = collectionStops(collection);
  const place = byIso[stops[0]?.iso];
  ogJobs.push({
    out: `assets/og/collections/${collection.slug}.jpg`,
    title: collection.title,
    kicker: "Collection",
    line: collection.when || orderedCountries(stops).slice(0, 4).join(" · "),
    lat: place ? place.lat : null,
    lon: place ? place.lon : null
  });
}
for (const journey of JOURNEYS) {
  const stops = journeyStops(journey);
  const place = byIso[stops[0]?.iso];
  const names = orderedCountries(stops);
  ogJobs.push({
    out: `assets/og/itineraries/${journey.slug}.jpg`,
    title: journey.title,
    kicker: DAY_JOURNEYS.includes(journey) ? "A day around the world" : "Journey",
    line: names.join(" · "),
    lat: place ? place.lat : null,
    lon: place ? place.lon : null
  });
}
for (const [iso, items] of byCountry) {
  const place = byIso[iso];
  const slug = slugByIso[iso];
  ogJobs.push({
    out: `assets/og/places/${slug}.jpg`,
    title: place.name,
    kicker: "Kite Kitchen",
    line: `${items.length} ${items.length === 1 ? "recipe" : "recipes"}`,
    lat: place.lat,
    lon: place.lon
  });
}
for (const term of pantryPages) {
  const sample = term.recipes.find((item) => byIso[item.iso]);
  const place = sample ? byIso[sample.iso] : null;
  ogJobs.push({
    out: `assets/og/pantry/${term.slug}.jpg`,
    title: term.name,
    kicker: "Pantry",
    line: `${term.recipes.length} ${term.recipes.length === 1 ? "recipe" : "recipes"}`,
    lat: place ? place.lat : null,
    lon: place ? place.lon : null
  });
}
for (const [region, items] of byRegion) {
  const sample = items.find((item) => byIso[item.iso]);
  const place = sample ? byIso[sample.iso] : null;
  ogJobs.push({
    out: `assets/og/regions/${regionSlug(region)}.jpg`,
    title: region,
    kicker: CONTINENT[region] || "Kite Kitchen",
    line: `${items.length} recipes`,
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
