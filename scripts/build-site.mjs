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
        <p class="kk-house-kicker">From KiteKitchen</p>
        <p><a href="/shop/">The shop is coming soon</a>. <a href="mailto:${HELLO_EMAIL}?subject=KiteKitchen%20shop">Ask for a note</a> when Jonathan approves it.</p>
      </div>
    </aside>`;
}

const consent = `<div id="kk-consent" class="kk-consent no-print" role="dialog" aria-labelledby="kk-consent-title" hidden>
    <p id="kk-consent-title"><strong>Cookies.</strong> KiteKitchen uses Google Analytics only after a choice where a choice is required. In the EEA, the UK, and Switzerland, analytics cookies stay off until you accept. Advertising cookies stay off until you accept, and no ad network is loaded while ads are turned off. <a href="/privacy/">Privacy</a></p>
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
  ["/", "Home", "home"],
  ["/recipes/", "Recipes", "recipes"],
  ["/traditions/", "Traditions", "traditions"],
  ["/flying-sauces/", "Flying Sauces", "sauces"],
  ["/flying-pancakes/", "Flying Pancakes", "pancakes"],
  ["/shop/", "Shop", "shop"]
];

function nav(current, cls) {
  return `<nav class="${cls}" aria-label="Primary">${NAV.map(([href, label, id]) => `<a href="${href}"${id === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
}

function header(current) {
  return `<a class="skip-link" href="#content">Skip to content</a>
<header class="kk-header">
  <div class="kk-header-inner">
    <a class="kk-brand" href="/">
      <img src="/assets/brand/kite-mark-128.webp" alt="" width="44" height="44">
      <span class="kk-word">KiteKitchen</span>
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
      <p class="kk-word">KiteKitchen</p>
      <nav aria-label="Footer">
        <a href="/recipes/">Recipes</a>
        <a href="/traditions/">Traditions</a>
        <a href="/flying-sauces/">Flying Sauces</a>
        <a href="/flying-pancakes/">Flying Pancakes</a>
        <a href="/friends/">Friends</a>
        <a href="/shop/">Shop</a>
        <a href="/books/">Books</a>
        <a href="/advertise/">Advertise</a>
        <a href="/credits/">Photo credits</a>
        <a href="/sources/">Sources</a>
        <a href="/about/">About</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
        <a href="/affiliate/">Affiliate disclosure</a>
        <a href="/guidelines/">Guidelines</a>
        <button type="button" class="quiet" data-consent-open>Cookie choices</button>
      </nav>
      <p>Recipes are for home cooking. They are not medical, dietary, or food-safety advice. The shop is not open. Nothing on this site has a price.</p>
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
  for (const id of ["flying-sauces", "flying-pancakes"]) {
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
  const links = [
    ["/", "Home"],
    ["/recipes/", "Recipes"],
    ["/traditions/", "Traditions"],
    ["/flying-sauces/", "Flying Sauces"],
    ["/flying-pancakes/", "Flying Pancakes"],
    ["/shop/", "Shop"]
  ];
  return `<div class="kk-bar" id="kk-bar">
    <a class="kk-brand" href="/"><img src="/assets/brand/kite-mark-128.webp" alt="" width="36" height="36"><span class="kk-word">KiteKitchen</span></a>
    <p class="kk-section-name">${escapeHtml(name)}</p>
    <nav aria-label="KiteKitchen">${links.map(([href, label]) => `<a href="${href}"${href === currentHref ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
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
    if (!html.includes('id="kk-bar"')) {
      html = html.replace(/<body([^>]*)>/, `<body$1>\n${sectionBar(name, `/${dir}/`)}`);
    }
    if (!html.includes("/assets/css/kite.css")) {
      html = html.replace(/<\/head>/, `  <link rel="stylesheet" href="/assets/css/kite.css">\n</head>`);
    }
    html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/g, "");
    html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*/g, "");
    html = html.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*">\s*/g, "");
    html = html.replace(/<link rel="icon"[^>]*>\s*/g, "");
    html = html.replace(/<link rel="apple-touch-icon"[^>]*>\s*/g, "");
    if (!html.includes("/favicon.ico")) {
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
    if (!html.includes('data-ad-slot="after-intro"') && !html.includes('data-ad-slot="section-slot"')) {
      if (/data-page="(sauce|pancake)"/.test(html)) {
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
      html = html.replace(/<\/footer>/, `<p class="kk-partof">${escapeHtml(name)} is a section of <a href="/">KiteKitchen</a>.</p></footer>`);
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

ensureSisters();
transformSection("flying-sauces", "Flying Sauces", "https://jonldavis-coder.github.io/flying-sauces/");
transformSection("flying-pancakes", "Flying Pancakes", "https://jonldavis-coder.github.io/flying-pancakes/");
cleanOld();

const sauceCount = dirs("flying-sauces/sauces").length;
const pancakeCount = dirs("flying-pancakes/pancakes").length;
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

write("CNAME", "kitekitchen.com\n");

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
    description: "Kite-day recipes, kite-festival foods with sources, and the Flying Sauces and Flying Pancakes guides.",
    publisher: { "@type": "Organization", name: "KiteKitchen", url: `${SITE_ORIGIN}/` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_ORIGIN}/search/?q={query}`,
      "query-input": "required name=query"
    }
  }
];

write("index.html", page({
  title: "KiteKitchen · recipes for kite days",
  description: "KiteKitchen is a kite-day recipe site: festival foods with sources, picnic recipes, Flying Sauces, Flying Pancakes, and a shop that is not open yet.",
  path: "/",
  current: "home",
  jsonLd: homeLd,
  main: `<section class="kk-hero">
      <div class="kk-hero-inner">
        <img class="kk-crest" src="/assets/brand/logo-360.webp" srcset="/assets/brand/logo-240.webp 240w, /assets/brand/logo-360.webp 360w, /assets/brand/logo-480.webp 480w" sizes="(min-width: 800px) 280px, 70vw" alt="KiteKitchen crest: a gold kite, spatula, and fork on a black and gold shield" width="360" height="467" fetchpriority="high">
        <div class="kk-hero-copy">
          <p class="kk-kicker">Recipes for kite days</p>
          <h1>Food for the hour the kite goes up.</h1>
          <p class="kk-lede">KiteKitchen cooks from real kite festivals, and from the picnic you pack for the park. Flying Sauces and Flying Pancakes live here under their own names. The KiteKitchen shop is coming soon.</p>
          <p class="kk-row"><a class="kk-button" href="/traditions/">Festival foods</a><a class="kk-button quiet" href="/recipes/">All recipes</a></p>
        </div>
      </div>
    </section>
    ${figure("sumpango", "Crowd in front of enormous circular tissue-paper kites at the Sumpango festival under a blue sky.", "Giant kites at the Sumpango festival in Guatemala, on the Day of the Saints. The photograph shows the kites, not a plate of food.", "kk-hero-photo")}
    <div class="kk-wrap">${ad("home", "inline")}</div>
    <section class="kk-wrap">
      <h2>Festival foods</h2>
      <p>Each tradition page says what the sources support, and links those sources. The recipes are home adaptations, labeled as such.</p>
      <div class="kk-grid cards-3">${traditions.map((item) => `<article class="kk-card">
          <p class="kk-kicker">${escapeHtml(item.kicker)}</p>
          <h3><a href="/traditions/${item.slug}/">${escapeHtml(item.title)}</a></h3>
          <p>${escapeHtml(item.lede.slice(0, 180))}…</p>
        </article>`).join("")}</div>
    </section>
    <section class="kk-wrap">
      <h2>Two guides, still under their own names</h2>
      <div class="kk-grid">
        <article class="kk-card">
          <p class="kk-kicker">Section</p>
          <h3><a href="/flying-sauces/">Flying Sauces</a></h3>
          <p>${sauceCount} sauces, with the journeys, books, and photo credits imported from that guide.</p>
        </article>
        <article class="kk-card">
          <p class="kk-kicker">Section</p>
          <h3><a href="/flying-pancakes/">Flying Pancakes</a></h3>
          <p>${pancakeCount} pancakes and their griddled relatives, imported the same way.</p>
        </article>
      </div>
      <p class="kk-note">Flying BBQ stays on its own site. It is listed with <a href="/friends/#flying-bbq">Friends of KiteKitchen</a>.</p>
    </section>
    <section class="kk-wrap">
      <h2>Picnic originals</h2>
      <p>These are KiteKitchen shapes for a park day. They are not traditional festival dishes.</p>
      <div class="kk-grid">${recipes.filter((item) => item.kind === "original").map((item) => `<article class="kk-card"><h3><a href="/recipes/${item.slug}/">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.description)}</p></article>`).join("")}</div>
    </section>
    <section class="kk-wrap">
      <h2>The shop is not open</h2>
      <p>Utensils, an apron, a tote, and a kite-day cookbook are drawn as mockups. There are no prices and no checkout. Jonathan has to approve the goods before anything is sold.</p>
      <p><a class="kk-button" href="/shop/">Look at the shop</a></p>
    </section>`
}));

write("recipes/index.html", page({
  title: "Recipes · KiteKitchen",
  description: "Kite-festival foods cooked as home adaptations, and KiteKitchen picnic originals. Each festival recipe points at its tradition page and sources.",
  path: "/recipes/",
  current: "recipes",
  main: `<div class="kk-wrap"><h1>Recipes</h1>
    <p class="kk-lede">Festival recipes are home adaptations of foods the tradition pages cite. Originals are picnic ideas from this kitchen. Neither kind is a customer review or a ranked list.</p>
    ${ad("recipes-top", "inline")}
    <h2>From the festivals</h2>
    <div class="kk-grid">${recipes.filter((item) => item.kind === "adaptation").map((item) => `<article class="kk-card"><h3><a href="/recipes/${item.slug}/">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.description)}</p><p class="kk-meta"><a href="/traditions/${item.tradition}/">${escapeHtml(traditionBySlug[item.tradition].title)}</a></p></article>`).join("")}</div>
    <h2>KiteKitchen originals</h2>
    <div class="kk-grid">${recipes.filter((item) => item.kind === "original").map((item) => `<article class="kk-card"><p class="kk-pill">Original</p><h3><a href="/recipes/${item.slug}/">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.description)}</p></article>`).join("")}</div>
  </div>`
}));

write("traditions/index.html", page({
  title: "Kite traditions · KiteKitchen",
  description: "Kite-day foods KiteKitchen could verify: Bermuda, Gujarat, Maharashtra, Guatemala, and Qingming, each with sources.",
  path: "/traditions/",
  current: "traditions",
  main: `<div class="kk-wrap"><h1>Kite traditions</h1>
    <p class="kk-lede">These are the kite-and-food traditions this site could check against published sources. If a story is only a guess, it is not here.</p>
    ${ad("traditions-top", "inline")}
    <div class="kk-grid">${traditions.map((item) => `<article class="kk-card">${figure(item.photo, item.photoAlt, item.photoNote)}<h2><a href="/traditions/${item.slug}/">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.lede)}</p></article>`).join("")}</div>
  </div>`
}));

for (const item of traditions) {
  const related = item.recipes.map((slug) => recipeBySlug[slug]);
  write(`traditions/${item.slug}/index.html`, page({
    title: `${item.title} · KiteKitchen`,
    description: item.description,
    path: `/traditions/${item.slug}/`,
    current: "traditions",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: item.title,
      description: item.description,
      url: `${SITE_ORIGIN}/traditions/${item.slug}/`,
      image: `${SITE_ORIGIN}/${photo(item.photo).file1600}`,
      author: { "@type": "Organization", name: "KiteKitchen" },
      publisher: { "@type": "Organization", name: "KiteKitchen", url: `${SITE_ORIGIN}/` }
    },
    main: `${figure(item.photo, item.photoAlt, item.photoNote, "kk-hero-photo")}
      <article class="kk-wrap">
        <p class="kk-kicker">${escapeHtml(item.kicker)}</p>
        <h1>${escapeHtml(item.title)}</h1>
        <p class="kk-lede">${escapeHtml(item.lede)}</p>
        ${ad("after-intro", "inline")}
        <div class="kk-layout">
          <div>
            ${item.sections.map((section) => `<h2>${escapeHtml(section.h)}</h2>${section.p.map((para) => `<p>${escapeHtml(para)}</p>`).join("")}`).join("")}
            ${item.extraPhoto ? figure(item.extraPhoto, item.extraAlt, item.extraNote) : ""}
            ${ad("before-recipe", "inline")}
            <h2>Recipes on this site</h2>
            <div class="kk-grid">${related.map((recipe) => `<article class="kk-card"><h3><a href="/recipes/${recipe.slug}/">${escapeHtml(recipe.title)}</a></h3><p>${escapeHtml(recipe.kind === "original" ? "KiteKitchen original." : "Home adaptation.")} ${escapeHtml(recipe.description)}</p></article>`).join("")}</div>
            <h2>Sources</h2>
            <ul class="kk-sources">${item.sources.map(([label, href]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join("")}</ul>
          </div>
          <aside class="kk-rail">${ad("sidebar", "sidebar")}<div class="kk-card"><h2>On this page</h2><p>History is limited to the linked sources. The recipes are cooked at home and say so.</p></div></aside>
        </div>
      </article>`
  }));
}

for (const recipe of recipes) {
  const image = `${SITE_ORIGIN}/${photo(recipe.photo).file1600}`;
  const tradition = recipe.tradition ? traditionBySlug[recipe.tradition] : null;
  write(`recipes/${recipe.slug}/index.html`, page({
    title: `${recipe.title} · KiteKitchen`,
    description: recipe.description,
    path: `/recipes/${recipe.slug}/`,
    current: "recipes",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: recipe.title,
      description: recipe.description,
      image,
      author: { "@type": "Organization", name: "KiteKitchen" },
      publisher: { "@type": "Organization", name: "KiteKitchen", url: `${SITE_ORIGIN}/` },
      recipeYield: recipe.yield,
      prepTime: recipe.prep,
      cookTime: recipe.cook,
      recipeCategory: recipe.category,
      recipeCuisine: recipe.cuisine,
      recipeIngredient: recipe.ingredients,
      recipeInstructions: recipe.steps.map((text) => ({ "@type": "HowToStep", text })),
      url: `${SITE_ORIGIN}/recipes/${recipe.slug}/`
    },
    main: `${figure(recipe.photo, recipe.photoAlt, recipe.photoNote, "kk-hero-photo")}
      <article class="kk-wrap">
        <p class="kk-kicker">${recipe.kind === "original" ? "KiteKitchen original" : "Home adaptation"}</p>
        <h1>${escapeHtml(recipe.title)}</h1>
        <p class="kk-lede">${escapeHtml(recipe.description)}</p>
        <p class="kk-meta">${escapeHtml(recipe.prepLabel)} · ${escapeHtml(recipe.cookLabel)} · ${escapeHtml(recipe.yield)}</p>
        ${tradition ? `<p>Tradition: <a href="/traditions/${tradition.slug}/">${escapeHtml(tradition.title)}</a></p>` : ""}
        ${ad("after-intro", "inline")}
        <div class="kk-layout">
          <div>
            ${recipe.kind === "original" ? "<p>This recipe was written for KiteKitchen. It is not a historical festival dish.</p>" : "<p>This is a home adaptation. The tradition page cites the sources. The quantities are this kitchen’s, not a single official formula.</p>"}
            ${ad("before-recipe", "inline")}
            <section class="kk-recipe-card" id="recipe" aria-label="Recipe">
              <h2>Ingredients</h2>
              <ul class="kk-ingredients">${recipe.ingredients.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
              <h2>Steps</h2>
              <ol class="kk-steps">${recipe.steps.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ol>
            </section>
            ${recipe.notes.map((note) => `<p class="kk-note">${escapeHtml(note)}</p>`).join("")}
          </div>
          <aside class="kk-rail">${ad("sidebar", "sidebar")}</aside>
        </div>
      </article>`
  }));
}

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
      <p>The kite-day cookbook above is a KiteKitchen plan. The titles below are the Flying Sauces and Flying Pancakes books, still under those names. They are not priced here.</p>
      <div class="kk-grid">
        ${sauceBooks.concat(pancakeBooks).map((book) => `<article class="kk-card"><p class="kk-kicker">${escapeHtml(book.section)}</p><h3><a href="${book.href}">${escapeHtml(book.title)}</a></h3><p class="kk-pill">Coming soon</p></article>`).join("")}
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

write("books/index.html", page({
  title: "Books · KiteKitchen",
  description: "Flying Sauces and Flying Pancakes books listed inside KiteKitchen, plus a planned kite-day cookbook. Coming soon, with no prices.",
  path: "/books/",
  current: "",
  main: `<div class="kk-wrap"><h1>Books</h1><p>These titles come from the Flying Sauces and Flying Pancakes guides. KiteKitchen is not selling them yet.</p><p><a href="/shop/kite-festival-cookbook/">Kite-day cookbook</a>, still a plan.</p><div class="kk-grid">${sauceBooks.concat(pancakeBooks).map((book) => `<article class="kk-card"><p class="kk-kicker">${escapeHtml(book.section)}</p><h2><a href="${book.href}">${escapeHtml(book.title)}</a></h2><p class="kk-pill">Coming soon</p></article>`).join("")}</div></div>`
}));

const creditItems = Object.values(photos);
write("credits/index.html", page({
  title: "Photo credits · KiteKitchen",
  description: "Photographers, licenses, and Wikimedia Commons links for the photos stored on KiteKitchen.",
  path: "/credits/",
  main: `<div class="kk-wrap"><h1>Photo credits</h1>
    <p>KiteKitchen stores these files in the repository. They are not hotlinked. Flying Sauces and Flying Pancakes keep their own credit pages: <a href="/flying-sauces/credits/">Flying Sauces credits</a> and <a href="/flying-pancakes/credits/">Flying Pancakes credits</a>.</p>
    <ul class="kk-sources">${creditItems.map((item) => `<li><strong>${escapeHtml(item.sourceTitle)}</strong>. ${escapeHtml(item.artist.replace(/\s*\(talk\)/, ""))}. ${escapeHtml(item.license)}. <a href="${escapeHtml(item.sourceUrl)}">File page</a>.</li>`).join("")}</ul>
    <p>The shop drawings and the gold crest are KiteKitchen’s own artwork. The crest was supplied by Jonathan Davis and cut out of its white background for the site.</p>
  </div>`
}));

write("sources/index.html", page({
  title: "Sources · KiteKitchen",
  description: "The published sources behind KiteKitchen’s kite-tradition pages.",
  path: "/sources/",
  main: `<div class="kk-wrap"><h1>Sources</h1><p>Tradition pages cite these links in context. This list is the same set, gathered in one place.</p>${traditions.map((item) => `<h2>${escapeHtml(item.title)}</h2><ul class="kk-sources">${item.sources.map(([label, href]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join("")}</ul>`).join("")}</div>`
}));

write("about/index.html", page({
  title: "About · KiteKitchen",
  description: "KiteKitchen is Jonathan Davis’s kite-day recipe site, with Flying Sauces and Flying Pancakes as named sections.",
  path: "/about/",
  main: `<article class="kk-wrap"><h1>About KiteKitchen</h1>
    <p>KiteKitchen is run by Jonathan Davis. The site collects foods tied to kite-flying days, plus picnic recipes made for the park, and it houses two older guides under their own names: Flying Sauces and Flying Pancakes.</p>
    <p>The public address is <a href="${SITE_ORIGIN}/">kitekitchen.com</a>. That origin is set in <span class="kk-note">site.config.mjs</span> as <code>SITE_ORIGIN</code>.</p>
    <p>Counts on the Flying Sauces and Flying Pancakes sections are the number of entries imported from those guides. This site does not add reviews or star ratings.</p>
    <p><a href="mailto:${HELLO_EMAIL}">${HELLO_EMAIL}</a> is the contact address written into the pages. Jonathan still needs to confirm the mailbox.</p>
  </article>`
}));

write("friends/index.html", page({
  title: "Friends of KiteKitchen",
  description: "Flying BBQ stays on its own site. Flying Sauces and Flying Pancakes are sections of KiteKitchen.",
  path: "/friends/",
  main: `<article class="kk-wrap"><h1>Friends of KiteKitchen</h1>
    <p>Flying Sauces and Flying Pancakes are part of this site. Flying BBQ was not folded in.</p>
    <h2 id="flying-bbq">Flying BBQ</h2>
    <p>Barbecue and live-fire cooking stay on the Flying BBQ site.</p>
    <p class="kk-row"><a class="kk-button" href="https://jonldavis-coder.github.io/flying-bbq/">Open Flying BBQ</a><a class="kk-button quiet" href="https://github.com/jonldavis-coder/flying-bbq">Repository</a></p>
  </article>`
}));

write("advertise/index.html", page({
  title: "Advertise with KiteKitchen",
  description: "A page for kitchen and kite brands that want to sponsor KiteKitchen. No ad network is switched on, and there are no affiliate links yet.",
  path: "/advertise/",
  main: `<article class="kk-wrap"><h1>Advertise</h1>
    <p>KiteKitchen will take a small number of sponsors from kitchen brands and kite brands. Slots are labeled Advertisement, kept out of ingredient lists and steps, hidden when a recipe is printed, and capped at about three a page.</p>
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
    <p>KiteKitchen uses Google Analytics 4 with measurement ID ${GA_MEASUREMENT_ID}. The Analytics library is not requested until you press, type, or scroll, or until a short wait after the page loads, so it does not sit on the first paint.</p>
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
    <p>The Flying Sauces and Flying Pancakes sections keep the text imported from those guides. Flying BBQ is a separate site.</p>
    <p>Contact <a href="mailto:${HELLO_EMAIL}">${HELLO_EMAIL}</a>. That mailbox is a placeholder until Jonathan confirms it.</p>
  </article>`
}));

write("guidelines/index.html", page({
  title: "Guidelines · KiteKitchen",
  description: "How KiteKitchen handles recipe suggestions. No made-up reviews or ratings.",
  path: "/guidelines/",
  main: `<article class="kk-wrap"><h1>Guidelines</h1>
    <p>Suggest a correction or a kite-day food by emailing <a href="mailto:${HELLO_EMAIL}?subject=KiteKitchen%20suggestion">${HELLO_EMAIL}</a>. A suggestion is not published as a review. This site does not collect star ratings.</p>
    <p>Do not send anyone else’s private information.</p>
  </article>`
}));

write("map/index.html", page({
  title: "Maps · KiteKitchen",
  description: "Maps of Flying Sauces and Flying Pancakes, kept inside those sections of KiteKitchen.",
  path: "/map/",
  main: `<article class="kk-wrap"><h1>Maps</h1><p>The route maps stay with the guides that drew them.</p><p><a href="/flying-sauces/map/">Flying Sauces map</a></p><p><a href="/flying-pancakes/map/">Flying Pancakes map</a></p></article>`
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
  description: "Send KiteKitchen a kite-day food or a correction by email.",
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
  if (rel === "bbq/index.html") return "/friends/#flying-bbq";
  if (rel === "moderate.html") return "/login.html";
  if (rel === "shop/ultimate-library/index.html") return "/shop/#books";
  if (rel === "shop/grill-tools/index.html") return "/shop/tongs/";
  if (rel === "shop/grill-gloves/index.html") return "/shop/oven-mitt/";
  if (["cutting-board", "skillet", "spice-tin", "thermometer", "branding-iron", "tumbler", "hat"].includes(parts[1]) && parts[0] === "shop" && parts.length === 2) return "/shop/";
  if (parts[0] === "notes" && parts[1] === "sauces") return `/flying-sauces/sauces/${parts[2]}/`;
  if (parts[0] === "notes" && parts[1] === "pancakes") return `/flying-pancakes/pancakes/${parts[2]}/`;
  if (parts[0] === "notes" && parts[1] === "bbq") return `https://jonldavis-coder.github.io/flying-bbq/dishes/${parts[2]}/`;
  if (parts[0] === "journeys" && parts[1] === "sauces") return `/flying-sauces/journeys/${parts[2]}/`;
  if (parts[0] === "journeys" && parts[1] === "pancakes") return `/flying-pancakes/journeys/${parts[2]}/`;
  if (parts[0] === "journeys" && parts[1] === "bbq") return `https://jonldavis-coder.github.io/flying-bbq/journeys/${parts[2]}/`;
  if (parts[0] === "shop" && parts[1] === "books" && parts[2] === "sauces") return `/flying-sauces/books/${parts[3]}/`;
  if (parts[0] === "shop" && parts[1] === "books" && parts[2] === "pancakes") return `/flying-pancakes/books/${parts[3]}/`;
  if (parts[0] === "shop" && parts[1] === "books" && parts[2] === "bbq") return `https://jonldavis-coder.github.io/flying-bbq/books/${parts[3]}/`;
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
for (const recipe of recipes) searchItems.push({ title: recipe.title, href: `/recipes/${recipe.slug}/`, section: "KiteKitchen", text: recipe.description });
for (const [dir, section, folder] of [["flying-sauces", "Flying Sauces", "sauces"], ["flying-pancakes", "Flying Pancakes", "pancakes"]]) {
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
  description: "Search KiteKitchen recipes and the Flying Sauces and Flying Pancakes entries on this site.",
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
