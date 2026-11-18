import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { SITE_ORIGIN, GA_MEASUREMENT_ID, ADS, home_hero_photo } from "../site.config.mjs";

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
  assert.match(home, /class="kk-mark"/);
  assert.match(home, /Search recipes/);
  assert.equal((home.match(/The Kite Kitchen shop is coming soon/g) || []).length, 1);
  assert.equal(home_hero_photo, false);
  if (home_hero_photo) {
    assert.match(home, /hero-1280\.avif/);
    assert.match(home, /rel="preload"/);
  } else {
    assert.doesNotMatch(home, /hero-1280\.avif/);
    assert.doesNotMatch(home, /rel="preload"/);
  }
  assert.match(home, /Browse by continent/);
  assert.match(read("books/index.html"), /kk-cover/);
  assert.match(read("about/index.html"), /logo-full/);
  assert.match(read("about/index.html"), /flying around the world/);
  assert.match(read("about/index.html"), /<p class="kk-contact"><a href="mailto:hello@kitekitchen.com">hello@kitekitchen.com<\/a><\/p>/);
  assert.equal((read("about/index.html").match(/class="kk-contact"/g) || []).length, 2);
  assert.match(read("flying-sauces/index.html"), /kk-guide-mast/);
  assert.match(read("flying-sauces/index.html"), /Start here/);
  assert.match(read("flying-pancakes/index.html"), /Start here/);
  assert.match(read("flying-bbq/index.html"), /Start here/);
  assert.match(read("books/index.html"), /kk-catalog/);
  assert.match(read("books/index.html"), /class="dek"/);
  assert.match(read("books/index.html"), /\d+ recipes/);
  assert.equal((read("books/index.html").match(/The Kite Kitchen shop is coming soon/g) || []).length, 1);
  assert.doesNotMatch(read("books/index.html"), /\$\d/);
  assert.match(read("journeys/index.html"), /A week of street food in Asia/);
  assert.match(read("journeys/street-food-asia/index.html"), /Turmeric chicken skewers with a warm peanut sauce/);
  assert.match(read("cookbooks/index.html"), /url=\/books\//);
  assert.match(read("index.html"), /Recipe of the week/);
  assert.match(read("index.html"), /A day around the world/);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /Breakfast/);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /kk-route/);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /kk-display/);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /class="dek"/);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /Route plate/);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /\/assets\/og\/itineraries\/day-france-italy-argentina\.jpg/);
  assert.match(read("journeys/day-in-india/index.html"), /Paper dosa/);
  assert.match(read("journeys/index.html"), /data-surprise/);
  assert.match(read("journeys/index.html"), /Oceania/);
  assert.match(read("journeys/day-in-australia/index.html"), /Australian/);
  assert.match(read("journeys/day-ghana-nigeria-ethiopia/index.html"), /data-photo="nigerian-suya"|Suya/);
  assert.match(read("countries/france/index.html"), /"@type":"ItemList"/);
  assert.match(read("countries/italy/index.html"), /kk-display/);
  assert.match(read("countries/italy/index.html"), /Atlas plate/);
  assert.match(read("countries/italy/index.html"), /rel="canonical" href="https:\/\/kitekitchen.com\/countries\/italy\/"/);
  assert.match(read("countries/italy/index.html"), /\/assets\/og\/places\/italy\.jpg/);
  assert.match(read("countries/france/index.html"), /Journeys through France/);
  assert.match(read("sitemap.xml"), /\/countries\/france\//);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /href="\/countries\/italy\/"/);
  assert.match(read("sitemap.xml"), /\/countries\/italy\//);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /"@type":"ItemList"/);
  assert.match(read("assets/js/days.js"), /Surprise me|data-surprise/);
  assert.match(read("404.html"), /kk-compass-lg/);
  assert.match(read("404.html"), /Off the map/);
  assert.match(read("search/index.html"), /Nothing matches/);
  assert.match(read("search/index.html"), /kk-hit|id="results"/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /\/assets\/og\/recipes\/sauces-pesto-alla-genovese\.jpg/);
  assert.equal(fs.existsSync(path.join(root, "assets/og/home.jpg")), true);
  assert.equal(fs.existsSync(path.join(root, "assets/og/recipes/bbq-tandoori-chicken.jpg")), true);
  assert.match(read("flying-sauces/sauces/bechamel/index.html"), /data-photo="bechamel"/);
  assert.match(read("flying-pancakes/pancakes/acadian-ployes/index.html"), /kk-atlas-card/);
  assert.match(read("flying-pancakes/pancakes/acadian-ployes/index.html"), /Acadian ployes/);
  assert.match(read("flying-pancakes/pancakes/acadian-ployes/index.html"), /Atlas plate/);
  assert.doesNotMatch(read("flying-pancakes/pancakes/acadian-ployes/index.html"), /No photograph/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /Jump to recipe/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /assets\/js\/recipe.js/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /Also from Italy/);
  assert.match(read("flying-sauces/sauces/arrabbiata/index.html"), /From the journey/);
  assert.match(read("flying-sauces/sauces/arrabbiata/index.html"), /\/journeys\/day-france-italy-argentina\//);
  assert.match(read("assets/css/kite.css"), /counter\(kkstep/);
  assert.match(read("regions/southern-europe/index.html"), /Countries named on those pages/);
  assert.match(read("regions/southern-europe/index.html"), /"@type":"ItemList"/);
  assert.match(read("regions/southern-europe/index.html"), /rel="canonical" href="https:\/\/kitekitchen.com\/regions\/southern-europe\/"/);
  assert.match(read("regions/southern-europe/index.html"), /\/assets\/og\/regions\/southern-europe\.jpg/);
  assert.match(home, /kk-hero/);
  const homeOrder = ["Featured recipes", "A day around the world", "Recipe of the week", "Browse by continent", "The guides", "Recipe cookbooks"];
  let homeAt = -1;
  for (const label of homeOrder) {
    const at = home.indexOf(label);
    assert.ok(at > homeAt, label);
    homeAt = at;
  }
  assert.match(home, /href="\/map\/"/);
  assert.doesNotMatch(home, /Jonathan/);
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
  const methodStart = recipe.indexOf('id="kk-method"');
  const method = recipe.slice(methodStart, recipe.indexOf("</ol>", methodStart));
  assert.equal(method.includes("kk-ad"), false);
  assert.match(recipe, /"@type":"Recipe"/);
  assert.match(recipe, /kk-origin/);
  assert.equal((recipe.match(/The Kite Kitchen shop is coming soon/g) || []).length, 1);
  assert.match(read("traditions/bermuda-good-friday/index.html"), /noindex/);
  assert.match(read("flying-bbq/index.html"), /Flying BBQ/);
  assert.match(read("regions/southern-europe/index.html"), /Pesto alla Genovese/);
  assert.match(read("map/index.html"), /\/regions\/southern-europe\//);
  assert.match(read("books/index.html"), /data-kk-filter/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /"publisher":\{"@type":"Organization","name":"Kite Kitchen"/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /kk-place-links/);
  assert.match(read("notes/sauces/pesto-alla-genovese/index.html"), /noindex/);
  assert.match(read("notes/sauces/pesto-alla-genovese/index.html"), /flying-sauces\/sauces\/pesto-alla-genovese/);
});
