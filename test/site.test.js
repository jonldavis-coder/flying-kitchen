import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { SITE_ORIGIN, GA_MEASUREMENT_ID, ADS } from "../site.config.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function walkHtml(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, found);
    else if (entry.name.endsWith(".html")) found.push(full);
  }
  return found;
}

test("origin, domain, analytics, and ads stay honest", () => {
  assert.equal(SITE_ORIGIN, "https://kitekitchen.com");
  assert.equal(read("CNAME").trim(), "kitekitchen.com");
  assert.equal(GA_MEASUREMENT_ID, "G-JHDKNY6NTV");
  assert.equal(ADS.enabled, false);
  assert.equal(ADS.publisherId, "");
  assert.match(read("robots.txt"), new RegExp(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`));
  assert.match(read("sitemap.xml"), new RegExp(`<loc>${SITE_ORIGIN}/</loc>`));
  assert.doesNotMatch(read("sitemap.xml"), /jonldavis-coder\.github\.io/);
  assert.doesNotMatch(read("ads.txt"), /pub-\d/);
  assert.match(read("assets/js/consent.js"), /pointerdown/);
  assert.match(read("assets/js/consent.js"), /4500/);
  assert.match(read("assets/js/consent.js"), /analytics_storage: "denied"/);
  assert.match(read("assets/js/consent.js"), /analytics_storage: "granted"/);
  assert.match(read("privacy/index.html"), /Google Analytics 4/);
  assert.match(read("privacy/index.html"), new RegExp(GA_MEASUREMENT_ID));
  const home = read("index.html");
  assert.match(home, /kite-mark-128\.webp/);
  assert.match(home, /Search recipes/);
  assert.doesNotMatch(home, /kk-hero-photo/);
  assert.doesNotMatch(home, /Taste the World/);
  assert.doesNotMatch(home, /googletagmanager\.com\/gtag\/js/);
  assert.match(home, /Flying Sauces/);
  assert.match(home, /Flying Pancakes/);
  assert.match(read("friends/index.html"), /flying-bbq/);
  assert.match(read("shop/index.html"), /Coming soon/);
  assert.doesNotMatch(read("shop/index.html"), /\$\d/);
});

test("every sitemap url is a file and local links resolve", () => {
  const locs = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 800);
  for (const loc of locs) {
    assert.ok(loc.startsWith(`${SITE_ORIGIN}/`), loc);
    let rel = loc.slice(`${SITE_ORIGIN}/`.length);
    const file = rel === "" ? path.join(root, "index.html") : path.join(root, rel, rel.endsWith(".html") ? "" : "index.html");
    const target = rel.endsWith(".html") ? path.join(root, rel) : (rel === "" ? path.join(root, "index.html") : path.join(root, rel, "index.html"));
    assert.equal(fs.existsSync(target), true, loc);
  }

  const missing = [];
  for (const file of walkHtml(root)) {
    const html = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(html, /Placeholder price/);
    assert.doesNotMatch(html, /testimonial/i);
    const base = (html.match(/<base href="([^"]+)"/) || ["", "/"])[1];
    const refs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    const srcset = [...html.matchAll(/srcset="([^"]+)"/g)].flatMap((m) => m[1].split(",").map((part) => part.trim().split(/\s+/)[0]));
    for (let href of refs.concat(srcset)) {
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#") || href.startsWith("data:")) continue;
      href = href.split("#")[0].split("?")[0];
      if (!href) continue;
      const rel = decodeURIComponent(href.startsWith("/") ? href.slice(1) : `${base.startsWith("/") ? base.slice(1) : base}${href}`);
      const target = path.normalize(path.join(root, rel));
      const candidate = path.extname(target) ? target : path.join(target, "index.html");
      if (!candidate.startsWith(root) || !fs.existsSync(candidate)) missing.push(`${path.relative(root, file)} -> ${href}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("recipe pages keep ads out of the method and printable", () => {
  const css = read("assets/css/kite.css");
  assert.match(css, /@media print/);
  assert.match(css, /\.kk-ad[\s\S]*display:\s*none !important/);
  const recipe = read("flying-sauces/sauces/pesto-alla-genovese/index.html");
  const slots = recipe.match(/data-ad-slot="/g) || [];
  assert.ok(slots.length >= 1 && slots.length <= 3);
  const ingredients = recipe.slice(recipe.indexOf('<ul class="ingredients">'), recipe.indexOf("</ul>"));
  assert.equal(ingredients.includes("kk-ad"), false);
  assert.match(recipe, /"@type":"Recipe"/);
  assert.match(recipe, /kk-origin/);
  assert.match(read("traditions/bermuda-good-friday/index.html"), /noindex/);
  assert.match(read("flying-bbq/index.html"), /Flying BBQ/);
  assert.match(read("notes/sauces/pesto-alla-genovese/index.html"), /noindex/);
  assert.match(read("notes/sauces/pesto-alla-genovese/index.html"), /flying-sauces\/sauces\/pesto-alla-genovese/);
});
