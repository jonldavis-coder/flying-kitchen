import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { boxSetQuote } from "../assets/js/lib/shop.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function readGlobal(rel, key) {
  const sandbox = {};
  new Function("window", read(rel))(sandbox);
  return sandbox[key];
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

test("sister sites, shop math, and accuracy rules", () => {
  const sisters = JSON.parse(read("data/sisters.json"));
  const sauces = sisters.find((site) => site.id === "sauces");
  assert.equal(sauces.status, "live");
  assert.ok(sauces.count >= 200);

  const pancakes = sisters.find((site) => site.id === "pancakes");
  assert.equal(pancakes.status, "live");
  assert.ok(pancakes.count >= 290);
  assert.ok(pancakes.journeys >= 8);
  assert.ok(pancakes.books >= 18);
  const bbq = sisters.find((site) => site.id === "bbq");
  assert.equal(bbq.status, "live");
  assert.ok(bbq.count >= 302);
  assert.ok(bbq.journeys >= 7);
  assert.ok(bbq.books >= 18);
  assert.match(read("bbq/index.html"), /Open the full site/);
  assert.match(read("bbq/index.html"), /Journeys/);
  assert.match(read("pancakes/index.html"), /Open the full site/);
  assert.match(read("pancakes/index.html"), /Journeys/);

  const shop = readGlobal("shop-config.js", "FLYING_KITCHEN_SHOP");
  assert.equal(shop.openingSoon, true);
  assert.equal(shop.boxSet.discount, 0.3);
  assert.equal(shop.boxSet.total, undefined);
  assert.equal(shop.boxSet.price, undefined);
  assert.equal(shop.boxSet.pricePlaceholder, undefined);
  assert.equal(shop.gear.length, 10);

  const pancakeBooks = shop.books.filter((book) => book.site === "pancakes");
  const sauceBooks = shop.books.filter((book) => book.site === "sauces");
  const bbqBooks = shop.books.filter((book) => book.site === "bbq");
  assert.ok(pancakeBooks.length >= 18);
  assert.ok(sauceBooks.length >= 20);
  assert.ok(bbqBooks.length >= 18);
  assert.ok(pancakeBooks.some((book) => book.id === "pancakes-top-100-pancakes"));
  assert.ok(bbqBooks.some((book) => book.id === "bbq-top-100-bbq"));
  const quote = boxSetQuote(shop.books.map((book) => book.pricePlaceholder), shop.boxSetDiscount);
  assert.equal(quote.count, sauceBooks.length + pancakeBooks.length + bbqBooks.length);
  assert.equal(quote.total, Math.round((quote.sum - quote.savings) * 100) / 100);
  const library = read("shop/ultimate-library/index.html");
  assert.match(library, /30%/);
  assert.match(library, new RegExp(`data-total="${quote.total}"`));
  assert.match(library, /Coming soon/);
  assert.match(library, /print-on-demand or private-label/i);

  const ads = readGlobal("ads-config.js", "FLYING_KITCHEN_ADS");
  assert.equal(ads.provider, "none");
  const css = read("assets/css/styles.css");
  assert.match(css, /@media print/);
  assert.match(css, /\.ad-slot[\s\S]*display:\s*none !important/);

  const home = read("index.html");
  assert.match(home, /https:\/\/jonldavis-coder\.github\.io\/flying-sauces\/sauces\//);
  assert.match(home, /https:\/\/jonldavis-coder\.github\.io\/flying-pancakes\/pancakes\//);
  assert.match(home, /https:\/\/jonldavis-coder\.github\.io\/flying-bbq\/dishes\//);
  assert.match(home, /290/);
  assert.match(home, /302/);
  assert.match(library, /Flying Pancakes/);
  assert.match(library, /Flying BBQ/);
  assert.match(library, /Every Flying site with published book prices is in this sum/);
  assert.doesNotMatch(library, /joins this sum/);
  assert.match(home, /Who settled the flavor/);
  assert.doesNotMatch(home, /National Geographic/);
  assert.match(home, /hidden/);
  assert.match(home, /data-ad-slot="home_after_hero"/);

  const passages = JSON.parse(read("data/passages.json"));
  assert.ok(passages.length >= 3);
  for (const passage of passages) {
    assert.match(passage.url, /^https:\/\/jonldavis-coder\.github\.io\/flying-/);
    assert.ok(passage.text.length > 40);
  }
  assert.match(read("settled/index.html"), /settlers/i);

  for (const item of shop.gear) {
    assert.ok(fs.existsSync(path.join(root, "assets/images/gear", `${item.id}.jpg`)));
    const page = read(`shop/${item.id}/index.html`);
    assert.match(page, /Coming soon/);
    assert.match(page, /Original mockup/);
  }
});

test("every built page is a real file and local links resolve", () => {
  const manifest = JSON.parse(read("data/pages.json"));
  assert.ok(manifest.length > 40);
  const htmlFiles = walkHtml(root);
  assert.equal(htmlFiles.length, manifest.length);

  const missing = [];
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(html, /National Geographic/);
    assert.doesNotMatch(html, /testimonial/i);
    const refs = html.matchAll(/\b(?:href|src)="([^"]+)"/g);
    for (const match of refs) {
      let href = match[1];
      if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#") || href.startsWith("data:")) continue;
      href = href.split("#")[0].split("?")[0];
      if (href.startsWith("/flying-kitchen/")) href = href.slice("/flying-kitchen/".length);
      else if (href.startsWith("/")) href = href.slice(1);
      if (!href) href = "index.html";
      const rel = decodeURIComponent(href);
      const target = path.normalize(path.join(root, rel));
      const candidate = target.endsWith(path.sep) || !path.extname(target) ? path.join(target, "index.html") : target;
      if (!candidate.startsWith(root) || !fs.existsSync(candidate)) missing.push(`${path.relative(root, file)} -> ${href}`);
    }
  }
  assert.deepEqual(missing, []);
});
