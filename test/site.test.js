import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { SITE_ORIGIN, GA_MEASUREMENT_ID, ADS, home_hero_photo } from "../site.config.mjs";
import { featureForDate, isoWeekSerial, weekPick, extendWeekSchedule } from "../scripts/feature-calendar.mjs";
import { isCondiment, rankItems, sauceGroupLabel } from "../assets/js/search-rank.mjs";

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
    assert.match(home, /rel="preload" href="\/assets\/fonts\/source-sans-3-latin\.woff2"/);
    assert.doesNotMatch(home, /rel="preload" as="image"/);
  }
  assert.match(home, /Browse by continent/);
  assert.match(read("books/index.html"), /kk-cover/);
  assert.match(read("about/index.html"), /logo-full/);
  assert.match(read("about/index.html"), /flying around the world/);
  assert.match(read("about/index.html"), /Contact details coming soon/);
  assert.doesNotMatch(read("about/index.html"), /hello@kitekitchen\.com/);
  assert.doesNotMatch(read("config.js"), /hello@kitekitchen\.com/);
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
  assert.equal(isoWeekSerial(new Date("1970-01-05T00:00:00Z")), 0);
  assert.equal(isoWeekSerial(new Date("1970-01-11T00:00:00Z")), 0);
  assert.equal(isoWeekSerial(new Date("1970-01-12T00:00:00Z")), 1);
  const photoHrefs = JSON.parse(read("assets/search-index.json")).filter((item) => item.thumb).map((item) => item.href);
  assert.ok(photoHrefs.length > 26);
  const seen = new Set();
  for (let week = 0; week < 26; week += 1) {
    const href = weekPick(photoHrefs, new Date(Date.UTC(2026, 0, 5 + week * 7)));
    assert.equal(seen.has(href), false);
    seen.add(href);
  }
  const schedule = JSON.parse(read("data/week-schedule.json"));
  const nowSerial = isoWeekSerial(new Date());
  const currentWeek = schedule.find((row) => row.serial === nowSerial);
  assert.equal(currentWeek.slug, "pupusas");
  const horizon = schedule.filter((row) => row.serial >= nowSerial && row.serial < nowSerial + 26);
  assert.equal(horizon.length, 26);
  assert.equal(new Set(horizon.map((row) => row.slug)).size, 26);
  const unchanged = extendWeekSchedule(schedule, [...photoHrefs.map((href) => href.split("/").filter(Boolean).at(-1)), "zzzz-extra-photo"], schedule.at(-1).serial);
  assert.deepEqual(unchanged, schedule);
  assert.match(read("index.html"), /data-week="\/flying-pancakes\/pancakes\/pupusas\/"/);
  const dishPhotos = JSON.parse(read("data/dish-photos.json"));
  assert.ok(dishPhotos.filter((photo) => photo.slug).length >= 130);
  for (const photo of dishPhotos) {
    assert.ok(photo.mastWidth >= 1000, photo.id);
    assert.ok(photo.cardWidth >= 1000, photo.id);
    assert.ok(Math.abs(photo.mastWidth / photo.mastHeight - 1.5) < 0.02, photo.id);
    assert.ok(Math.abs(photo.cardWidth / photo.cardHeight - 4 / 3) < 0.02, photo.id);
    assert.equal(fs.existsSync(path.join(root, `assets/photos/editorial/${photo.id}-mast-${photo.mastWidth}.jpg`)), true, photo.id);
    assert.equal(fs.existsSync(path.join(root, `assets/photos/editorial/${photo.id}-card-${photo.cardWidth}.jpg`)), true, photo.id);
  }
  const carbonaraHero = read("flying-sauces/sauces/carbonara/index.html").match(/kk-hero-shot[\s\S]*?width="(\d+)" height="(\d+)"/);
  assert.ok(Number(carbonaraHero[1]) >= 1000);
  assert.ok(Math.abs(Number(carbonaraHero[1]) / Number(carbonaraHero[2]) - 1.5) < 0.02);
  const weekCard = read("index.html").match(/class="kk-week"[\s\S]*?width="(\d+)" height="(\d+)"/);
  assert.ok(Number(weekCard[1]) >= 1000);
  assert.ok(Math.abs(Number(weekCard[1]) / Number(weekCard[2]) - 4 / 3) < 0.02);
  assert.match(read("flying-sauces/sauces/ssamjang/index.html"), /data-photo="ssamjang"/);
  assert.match(read("flying-sauces/sauces/ssamjang/index.html"), /Photograph by leeey/);
  assert.match(read("credits/index.html"), /Ssamjang\./);
  assert.match(read("flying-pancakes/pancakes/banh-xeo/index.html"), /data-photo="banh-xeo"/);
  assert.match(read("assets/css/kite.css"), /aspect-ratio: 3 \/ 2/);
  assert.equal(featureForDate(new Date("2026-11-01T00:30:00Z")), "holiday-table");
  assert.equal(featureForDate(new Date("2026-11-18T15:00:00Z")), "holiday-table");
  assert.equal(featureForDate(new Date("2026-11-26T23:00:00Z")), "holiday-table");
  assert.equal(featureForDate(new Date("2026-11-27T00:30:00Z")), "december-table");
  assert.equal(featureForDate(new Date("2026-11-30T23:00:00Z")), "december-table");
  assert.equal(featureForDate(new Date("2026-12-01T00:30:00Z")), "december-table");
  assert.equal(featureForDate(new Date("2026-12-25T12:00:00Z")), "december-table");
  assert.equal(featureForDate(new Date("2027-01-01T23:00:00Z")), "december-table");
  assert.equal(featureForDate(new Date("2027-01-02T00:30:00Z")), "winter-warmers");
  assert.equal(featureForDate(new Date("2027-02-28T12:00:00Z")), "winter-warmers");
  assert.equal(featureForDate(new Date("2027-03-01T12:00:00Z")), "breakfast");
  assert.equal(featureForDate(new Date("2026-07-04T12:00:00Z")), "street-food");
  assert.equal(featureForDate(new Date("2026-10-31T12:00:00Z")), "weeknight");
  assert.match(read("index.html"), new RegExp(`data-feature="${featureForDate(new Date())}"`));
  assert.match(read("index.html"), /Map plate/);
  const homeHtml = read("index.html");
  const homeFeature = homeHtml.slice(homeHtml.indexOf("kk-feature"), homeHtml.indexOf("Featured recipes"));
  const homeFeatured = homeHtml.slice(homeHtml.indexOf("Featured recipes"), homeHtml.indexOf("A day around the world"));
  assert.match(homeFeature, /Map plate/);
  assert.match(homeFeature, /kk-route/);
  assert.doesNotMatch(homeFeature, /kk-atlas-card/);
  assert.match(homeFeatured, /\/assets\/photos\/editorial\//);
  assert.doesNotMatch(homeFeatured, /kk-atlas-card/);
  assert.match(read("collections/index.html"), /kk-collection-catalog/);
  assert.match(read("collections/index.html"), /through November 26/);
  assert.match(read("collections/index.html"), /through January 1/);
  assert.match(read("collections/index.html"), /Breakfast around the world/);
  assert.match(read("collections/index.html"), /Street food of the world/);
  assert.match(read("collections/index.html"), /Winter warmers/);
  assert.match(read("collections/index.html"), /On the home page/);
  assert.match(read("collections/breakfast/index.html"), /Masala dosa/);
  assert.match(read("collections/breakfast/index.html"), /City breakfast/);
  assert.match(read("collections/street-food/index.html"), /Takoyaki/);
  assert.match(read("collections/winter-warmers/index.html"), /Hotteok/);
  assert.match(read("collections/winter-warmers/index.html"), /Winter street sweet/);
  assert.match(read(".github/workflows/rebuild.yml"), /cron: "20 7 \* \* \*"/);
  assert.match(read("collections/holiday-table/index.html"), /kk-display/);
  assert.match(read("collections/holiday-table/index.html"), /class="dek"/);
  assert.match(read("collections/holiday-table/index.html"), /Map plate/);
  assert.match(read("collections/holiday-table/index.html"), /Cranberry Sauce/);
  assert.match(read("collections/holiday-table/index.html"), /"@type":"ItemList"/);
  assert.match(read("collections/weeknight/index.html"), /30 minutes or less/);
  assert.match(read("collections/weeknight/index.html"), /Carbonara/);
  const weeknightTimes = [...read("collections/weeknight/index.html").matchAll(/(\d+) min/g)].map((match) => Number(match[1]));
  assert.ok(weeknightTimes.length >= 8);
  assert.ok(weeknightTimes.every((minutes) => minutes <= 30));
  assert.match(read("flying-sauces/sauces/carbonara/index.html"), /In this collection/);
  assert.match(read("sitemap.xml"), /\/collections\/holiday-table\//);
  assert.match(read("sitemap.xml"), /\/collections\/weeknight\//);
  assert.match(read("sitemap.xml"), /\/collections\/breakfast\//);
  assert.match(read("sitemap.xml"), /\/collections\/street-food\//);
  assert.match(read("sitemap.xml"), /\/collections\/winter-warmers\//);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /Breakfast/);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /kk-route/);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /kk-display/);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /class="dek"/);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /Route plate/);
  assert.match(read("journeys/day-france-italy-argentina/index.html"), /\/assets\/og\/itineraries\/day-france-italy-argentina\.jpg/);
  assert.match(read("journeys/day-india-thailand-vietnam/index.html"), /Paper dosa/);
  assert.match(read("journeys/index.html"), /data-surprise/);
  assert.match(read("journeys/index.html"), /Oceania/);
  assert.match(read("journeys/day-germany-india-australia/index.html"), /Australian/);
  assert.match(read("journeys/day-morocco-senegal-nigeria/index.html"), /data-photo="nigerian-suya"|Suya/);
  assert.match(read("countries/france/index.html"), /"@type":"ItemList"/);
  assert.match(read("countries/italy/index.html"), /kk-display/);
  const south = read("regions/southern-europe/index.html");
  assert.ok(south.indexOf("/flying-sauces/sauces/carbonara/") < south.indexOf("/flying-sauces/sauces/agrodolce/"));
  const garlicEurope = read("pantry/garlic/index.html").split("<h2>Europe</h2>")[1].split("<h2>")[0];
  assert.ok(garlicEurope.indexOf("/flying-sauces/sauces/pesto-alla-genovese/") < garlicEurope.indexOf("/flying-bbq/dishes/bulgarian-meshana-skara/"));
  const weeknightCards = read("collections/weeknight/index.html").split("kk-rcards")[1];
  assert.ok(weeknightCards.indexOf('class="kk-shot"') < weeknightCards.indexOf('class="kk-atlas-card"'));
  const sauceBrowse = read("flying-sauces/index.html").split('id="kk-browse"')[1];
  assert.ok(sauceBrowse.indexOf("/flying-sauces/sauces/pesto-alla-genovese/") < sauceBrowse.indexOf("/flying-sauces/sauces/alabama-white-sauce/"));
  assert.match(read("assets/js/search.js"), /rankScore/);
  assert.match(read("assets/js/search-rank.mjs"), /item\.thumb \? 1 : 0/);
  assert.match(read("journeys/day-china-elsalvador-mexico/index.html"), /Tianjin jianbing/);
  assert.doesNotMatch(read("journeys/day-china-elsalvador-mexico/index.html"), /shandong-jianbing/);
  assert.match(read("journeys/day-malaysia-italy-jamaica/index.html"), /Carbonara/);
  assert.doesNotMatch(read("journeys/day-malaysia-italy-jamaica/index.html"), /burro-e-salvia/);
  assert.match(read("journeys/day-malaysia-australia-newzealand/index.html"), /Australian Lamb Chops|Lamb chops/);
  assert.doesNotMatch(read("journeys/day-malaysia-australia-newzealand/index.html"), /australian-barramundi/);
  assert.match(read("journeys/day-malaysia-australia-newzealand/index.html"), /Breakfast in Malaysia, lunch in Australia, dinner in New Zealand/);
  assert.match(read("journeys/day-nigeria-southafrica-zimbabwe/index.html"), /Breakfast in Nigeria, lunch in South Africa, dinner in Zimbabwe/);
  assert.doesNotMatch(read("journeys/day-nigeria-southafrica-zimbabwe/index.html"), /zambian-vitumbuwa|ghanaian-kyinkyinga|peri-peri/);
  assert.doesNotMatch(read("journeys/day-australia-singapore-malaysia/index.html"), /kalua-pig|Hawaii/);
  const movedDays = [
    ["day-in-india", "day-india-thailand-vietnam"],
    ["day-in-australia", "day-germany-india-australia"],
    ["day-in-morocco", "day-morocco-spain-portugal"],
    ["day-in-south-africa", "day-unitedkingdom-kenya-southafrica"],
    ["day-samoa-australia-newzealand", "day-malaysia-australia-newzealand"],
    ["day-newzealand-fiji", "day-australia-singapore-malaysia"],
    ["day-samoa-tonga", "day-china-japan-korea"],
    ["day-ghana-nigeria-ethiopia", "day-denmark-sweden-norway"],
    ["day-kenya-tanzania", "day-kenya-ethiopia-yemen"],
    ["day-morocco-mali-senegal", "day-morocco-senegal-nigeria"],
    ["day-egypt-mozambique", "day-turkey-egypt-mozambique"],
    ["day-zambia-ghana-zimbabwe", "day-nigeria-southafrica-zimbabwe"],
    ["day-colombia-india-hawaii", "day-colombia-india-unitedstates"]
  ];
  const sitemap = read("sitemap.xml");
  for (const [from, to] of movedDays) {
    const stub = read(`journeys/${from}/index.html`);
    assert.match(stub, /content="noindex"/, from);
    assert.match(stub, new RegExp(`rel="canonical" href="https://kitekitchen.com/journeys/${to}/"`), from);
    assert.match(stub, new RegExp(`url=/journeys/${to}/`), from);
    assert.doesNotMatch(sitemap, new RegExp(`/journeys/${from}/`), from);
    assert.match(sitemap, new RegExp(`/journeys/${to}/`), to);
  }
  const dishPhotoSlugs = new Set(dishPhotos.filter((photo) => photo.slug).map((photo) => photo.slug));
  for (const name of fs.readdirSync(path.join(root, "journeys"))) {
    if (!name.startsWith("day-")) continue;
    const day = read(`journeys/${name}/index.html`);
    if (day.includes('content="noindex"')) continue;
    const cards = day.match(/<article class="kk-rcard">[\s\S]*?<\/article>/g) || [];
    assert.ok(cards.length >= 3, name);
    for (const card of cards) {
      assert.equal(card.includes("kk-atlas-card"), false, name);
      assert.match(card, /\/assets\/photos\/editorial\//, name);
    }
    const meals = [...day.matchAll(/<p class="kk-kicker">(Breakfast|Lunch|Dinner) · ([^<]+)<\/p>/g)];
    assert.equal(meals.length, 3, name);
    const countries = meals.map((match) => match[2]);
    assert.equal(new Set(countries).size, 3, `${name}: ${countries.join(", ")}`);
    const hrefs = [...day.matchAll(/<h3><a href="([^"]+)">/g)].map((match) => match[1]);
    assert.equal(hrefs.length, cards.length, name);
    for (const href of hrefs) assert.equal(dishPhotoSlugs.has(href.split("/").filter(Boolean).at(-1)), true, href);
  }
  for (const name of ["holiday-table", "december-table", "weeknight", "breakfast", "street-food", "winter-warmers"]) {
    const page = read(`collections/${name}/index.html`);
    const cards = page.match(/<article class="kk-rcard">[\s\S]*?<\/article>/g) || [];
    assert.ok(cards.length >= 3, name);
    for (const card of cards.slice(0, 3)) {
      assert.equal(card.includes("kk-atlas-card"), false, name);
      assert.match(card, /\/assets\/photos\/editorial\//, name);
    }
    assert.ok(page.indexOf("Map plate") > page.indexOf("kk-rcards"), name);
  }
  for (const name of ["flying-sauces", "flying-pancakes", "flying-bbq"]) {
    const page = read(`${name}/index.html`);
    assert.ok(page.indexOf("Start here") < page.indexOf("Atlas plate"), name);
    const start = page.slice(page.indexOf("Start here"), page.indexOf("Atlas plate"));
    const cards = start.match(/<article class="kk-rcard">[\s\S]*?<\/article>/g) || [];
    assert.equal(cards.length, 3, name);
    for (const card of cards) assert.match(card, /\/assets\/photos\/editorial\//, name);
  }
  const usSauces = read("countries/united-states-of-america/index.html").split("<h2>Flying Sauces</h2>")[1].split("<h2>")[0];
  const firstPhoto = usSauces.indexOf('class="kk-shot"');
  const firstPlate = usSauces.indexOf('class="kk-atlas-card"');
  assert.ok(firstPhoto !== -1 && firstPlate !== -1 && firstPhoto < firstPlate);
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
  assert.match(read("search/index.html"), /Nothing on this route matches/);
  assert.match(read("search/index.html"), /id="search-country"/);
  assert.match(read("search/index.html"), /data-meal="Breakfast"/);
  assert.match(read("search/index.html"), /kk-hit|id="results"/);
  assert.match(read("assets/js/search.js"), /search-country/);
  assert.match(read("index.html"), /kk-menu-close/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /print-brand/);
  assert.match(read("assets/css/kite.css"), /kk-menu\[open\]/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /\/assets\/og\/recipes\/sauces-pesto-alla-genovese\.jpg/);
  assert.equal(fs.existsSync(path.join(root, "assets/og/home.jpg")), true);
  assert.equal(fs.existsSync(path.join(root, "assets/og/recipes/bbq-tandoori-chicken.jpg")), true);
  assert.match(read("flying-sauces/sauces/bechamel/index.html"), /data-photo="bechamel"/);
  assert.match(read("flying-pancakes/pancakes/acadian-ployes/index.html"), /kk-atlas-card/);
  assert.match(read("flying-pancakes/pancakes/acadian-ployes/index.html"), /Acadian ployes/);
  assert.match(read("flying-pancakes/pancakes/acadian-ployes/index.html"), /Atlas plate/);
  assert.doesNotMatch(read("flying-pancakes/pancakes/acadian-ployes/index.html"), /No photograph/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /Jump to recipe/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /kk-units/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /data-units="metric"/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /"recipeYield":"4 servings \(about 1 cup\)"/);
  assert.match(read("assets/js/recipe.js"), /data-units/);
  assert.match(read("flying-bbq/dishes/afghan-tikka/index.html"), /Cook whole cuts of beef, pork, lamb, or goat to at least 145°F \(63°C\)/);
  assert.match(read("flying-sauces/sauces/coconut-chutney/index.html"), /data-photo="coconut-chutney"/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /assets\/js\/recipe.js/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /Also from Italy/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /data-cook/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /data-save/);
  assert.match(read("index.html"), /class="kk-passport" href="\/passport\/"/);
  assert.match(read("passport/index.html"), /My passport/);
  assert.match(read("passport/index.html"), /No stamps yet/);
  assert.match(read("passport/index.html"), /Nothing is sent on/);
  assert.match(read("passport/index.html"), /id="kk-stamps"/);
  assert.match(read("assets/js/passport.js"), /localStorage/);
  assert.doesNotMatch(read("assets/js/passport.js"), /gtag|analytics/);
  assert.match(read("sitemap.xml"), /\/passport\//);
  assert.match(read("pantry/index.html"), /Pantry atlas/);
  assert.match(read("pantry/garlic/index.html"), /recipes list garlic/);
  assert.match(read("pantry/garlic/index.html"), /Atlas plate/);
  assert.match(read("pantry/garlic/index.html"), /<h2>Europe<\/h2>/);
  assert.doesNotMatch(read("pantry/garlic/index.html"), /<h2>History<\/h2>/);
  assert.match(read("pantry/coconut-milk/index.html"), /coconut milk/);
  assert.match(read("pantry/rice/index.html"), /list rice/);
  assert.match(read("pantry/chilies/index.html"), /list chilies/);
  assert.match(read("flying-sauces/sauces/carbonara/index.html"), /class="kk-pantry" href="\/pantry\/black-pepper\/"/);
  assert.match(read("flying-sauces/sauces/pesto-alla-genovese/index.html"), /class="kk-pantry" href="\/pantry\/garlic\/"/);
  assert.match(read("flying-sauces/sauces/carbonara/index.html"), /Home<\/a><a href="\/recipes\/\?continent=Europe">Europe<\/a><a href="\/countries\/italy\/">Italy<\/a><span aria-current="page">Carbonara<\/span>/);
  assert.match(read("flying-sauces/sauces/carbonara/index.html"), /"@type":"BreadcrumbList"/);
  assert.match(read("flying-sauces/sauces/carbonara/index.html"), /"name":"Kite Kitchen"/);
  assert.doesNotMatch(read("flying-sauces/sauces/carbonara/index.html"), /datePublished/);
  assert.match(read("countries/italy/index.html"), /Home<\/a><a href="\/recipes\/\?continent=Europe">Europe<\/a><span aria-current="page">Italy<\/span>/);
  assert.match(read("regions/southern-europe/index.html"), /Home<\/a><a href="\/recipes\/\?continent=Europe">Europe<\/a><span aria-current="page">Southern Europe<\/span>/);
  assert.match(read("pantry/garlic/index.html"), /Home<\/a><a href="\/pantry\/">Pantry<\/a><span aria-current="page">Garlic<\/span>/);
  const sample = ["flying-sauces/sauces/carbonara", "flying-sauces/sauces/pesto-alla-genovese", "flying-pancakes/pancakes/masala-dosa", "flying-bbq/dishes/argentine-asado", "flying-bbq/dishes/jamaican-jerk-chicken"];
  for (const rel of sample) {
    const raw = read(`${rel}/index.html`).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
    const node = JSON.parse(raw).find((item) => item["@type"] === "Recipe");
    assert.ok(node.image);
    assert.equal(node.author["@type"], "Organization");
    assert.equal(node.author.name, "Kite Kitchen");
    assert.equal(node.datePublished, undefined);
    assert.ok(node.recipeIngredient.length);
    assert.ok(node.recipeInstructions.every((step, index) => step["@type"] === "HowToStep" && step.name && step.text && step.url.endsWith(`#step-${index + 1}`) && step.image));
    assert.ok(node.keywords);
    assert.equal(node.aggregateRating, undefined);
    assert.equal(node.video, undefined);
    assert.match(read(`${rel}/index.html`), /id="step-1"/);
    assert.ok(node.totalTime);
    assert.ok(node.recipeYield);
    assert.ok(node.recipeCuisine);
    assert.ok(node.recipeCategory);
    assert.match(node.keywords, new RegExp(node.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.ok(node.keywords.split(",").length <= 6);
  }
  const plate = JSON.parse(read("flying-bbq/dishes/cuban-lechon-asado/index.html").match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]).find((item) => item["@type"] === "Recipe");
  assert.ok(plate.recipeInstructions.every((step, index) => step.name && step.text && step.url.endsWith(`#step-${index + 1}`) && !step.image));
  assert.ok(plate.keywords);
  assert.equal(plate.aggregateRating, undefined);
  assert.equal(plate.video, undefined);
  assert.doesNotMatch(read("flying-bbq/dishes/cuban-lechon-asado/index.html"), /data-photo=/);
  assert.match(read("sitemap.xml"), /\/pantry\/garlic\//);
  assert.doesNotMatch(read("flying-pancakes/pancakes/albanian-flija/index.html"), /Also from Albania/);
  assert.match(read("flying-sauces/sauces/ajvar/index.html"), /Also from Serbia/);
  assert.doesNotMatch(read("flying-sauces/sauces/ajvar/index.html"), /Also from Eastern Europe/);
  assert.match(read("flying-sauces/sauces/carbonara/index.html"), /Also from Rome/);
  assert.doesNotMatch(read("flying-sauces/sauces/carbonara/index.html"), /Also from Southern Europe/);
  assert.match(read("assets/js/recipe.js"), /wakeLock/);
  assert.match(read("assets/css/kite.css"), /kk-cooking/);
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

function jpegSize(buffer) {
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker === 0xc0 || marker === 0xc2) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

test("every recipe share image is a branded card", () => {
  const kinds = [["flying-sauces", "sauces", "sauces"], ["flying-pancakes", "pancakes", "pancakes"], ["flying-bbq", "dishes", "bbq"]];
  let count = 0;
  for (const [dir, folder, kind] of kinds) {
    for (const slug of fs.readdirSync(path.join(root, dir, folder))) {
      const html = read(`${dir}/${folder}/${slug}/index.html`);
      const image = `/assets/og/recipes/${kind}-${slug}.jpg`;
      assert.match(html, new RegExp(`property="og:image" content="${SITE_ORIGIN}${image}"`));
      const size = jpegSize(fs.readFileSync(path.join(root, image.slice(1))));
      assert.equal(size && size.width, 1200, slug);
      assert.equal(size && size.height, 630, slug);
      count += 1;
    }
  }
  assert.ok(count > 800);
  assert.equal(jpegSize(fs.readFileSync(path.join(root, "assets/og/recipes/sauces-carbonara.jpg"))).width, 1200);
  assert.equal(jpegSize(fs.readFileSync(path.join(root, "assets/og/recipes/pancakes-acadian-ployes.jpg"))).width, 1200);
});

test("the unpublished mailbox is not in the build", () => {
  const files = walkHtml(root);
  files.push(path.join(root, "config.js"));
  const hits = [];
  for (const file of files) {
    if (fs.readFileSync(file, "utf8").includes("hello@kitekitchen.com")) hits.push(path.relative(root, file));
  }
  assert.deepEqual(hits, []);
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

test("recipe times, temperatures, units, and repeated doneness lines stay consistent", () => {
  const folders = ["flying-sauces/sauces", "flying-pancakes/pancakes", "flying-bbq/dishes"];
  const boiler = [
    "Cook poultry to 165°F (74°C) in the thickest part, not touching bone.",
    "Cook ground meat to 160°F (71°C).",
    "Cook whole cuts of beef, pork, lamb, or goat to at least 145°F (63°C) and rest 3 minutes."
  ];
  function minutes(label) {
    if (!label) return null;
    const hours = label.match(/(\d+)\s*hr/i);
    const mins = label.match(/(\d+)\s*min/i);
    if (!hours && !mins) return null;
    return (hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
  }
  function durationMinutes(value) {
    if (!value) return null;
    const hours = value.match(/(\d+)H/);
    const mins = value.match(/(\d+)M/);
    return (hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
  }
  let checked = 0;
  for (const folder of folders) {
    for (const entry of fs.readdirSync(path.join(root, folder))) {
      const file = path.join(root, folder, entry, "index.html");
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, "utf8");
      const name = entry;
      const info = (html.match(/<ul class="kk-info"[\s\S]*?<\/ul>/) || [""])[0];
      const bits = [...info.matchAll(/<li>([^<]+)<\/li>/g)].map((match) => match[1]);
      assert.ok(bits.some((bit) => /Serves\s+\d+/i.test(bit)), `${name} servings`);
      const prep = bits.find((bit) => /prep/i.test(bit));
      const cook = bits.find((bit) => /cook/i.test(bit));
      assert.notEqual(minutes(prep), null, `${name} prep`);
      assert.notEqual(minutes(cook), null, `${name} cook`);
      const data = JSON.parse((html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [null, "null"])[1]);
      const nodes = Array.isArray(data) ? data : [data];
      const recipe = nodes.find((node) => node && node["@type"] === "Recipe");
      if (recipe && recipe.totalTime) {
        assert.equal(durationMinutes(recipe.totalTime), minutes(prep) + minutes(cook), `${name} total time`);
      }
      const plain = html.replace(/<[^>]+>/g, " ");
      const ovenFahrenheit = new Set([225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500]);
      for (const match of plain.matchAll(/(\d+(?:\.\d+)?)\s*°\s*F\s*\(\s*(\d+(?:\.\d+)?)\s*°\s*C\s*\)/g)) {
        const fahrenheit = Number(match[1]);
        const celsius = Number(match[2]);
        const exact = (fahrenheit - 32) * 5 / 9;
        const delta = Math.abs(exact - celsius);
        if (ovenFahrenheit.has(fahrenheit)) {
          assert.equal(celsius % 5, 0, `${name} ${match[0]} should use a Celsius dial mark`);
          assert.ok(delta <= 8, `${name} ${match[0]} is ${delta.toFixed(1)}° from ${exact.toFixed(1)}°C`);
        } else {
          assert.ok(delta <= 1, `${name} ${match[0]} internal temperature should stay within 1° of ${exact.toFixed(1)}°C`);
        }
      }
      const ingredients = ((html.match(/<ul class="ingredients">([\s\S]*?)<\/ul>/) || [null, ""])[1]).replace(/<[^>]+>/g, " ");
      assert.doesNotMatch(ingredients, /(?<!\d )(?<!\d)(?:1|1\/2|1\/3|1\/4|1\/8|2\/3|3\/4)\s+(?:cups|tablespoons|teaspoons|pounds|ounces)\b/, name);
      const steps = (html.match(/<ol class="steps">([\s\S]*?)<\/ol>/) || [null, ""])[1];
      assert.match(steps, /<li\b/, `${name} steps`);
      for (const phrase of boiler) assert.ok(steps.split(phrase).length - 1 <= 1, `${name} ${phrase}`);
      checked += 1;
    }
  }
  assert.ok(checked >= 800);
});

test("related recipes stay short, photographed, and tied to data on the page", () => {
  for (const rel of [
    "flying-sauces/sauces/carbonara/index.html",
    "flying-sauces/sauces/pesto-alla-genovese/index.html",
    "flying-pancakes/pancakes/albanian-flija/index.html",
    "flying-sauces/sauces/ajvar/index.html",
    "flying-pancakes/pancakes/tianjin-jianbing/index.html"
  ]) {
    const html = read(rel);
    const related = html.split("<h2>Related</h2>")[1]?.split("</section>")[0] || "";
    assert.match(html, /<h2>Related<\/h2>/, rel);
    const links = [...related.matchAll(/<a href="([^"]+)">/g)].map((match) => match[1]);
    assert.ok(links.length >= 1 && links.length <= 4, `${rel} ${links.length}`);
    assert.equal(new Set(links).size, links.length, rel);
    assert.equal(links.some((href) => rel.includes(href.split("/").filter(Boolean).at(-1))), false, rel);
    assert.match(related, /kk-meta/, rel);
  }
  const carbonara = read("flying-sauces/sauces/carbonara/index.html");
  const carbonaraRelated = carbonara.split("<h2>Related</h2>")[1].split("</section>")[0];
  for (const slug of ["arrabbiata", "amatriciana", "gricia", "cacio-e-pepe"]) {
    assert.match(carbonaraRelated, new RegExp(`/flying-sauces/sauces/${slug}/`), slug);
  }
  assert.match(carbonaraRelated, /Also from Rome/);
  assert.doesNotMatch(carbonaraRelated, /Southern Europe|Skordalia/);
  const pesto = read("flying-sauces/sauces/pesto-alla-genovese/index.html");
  const pestoRelated = pesto.split("<h2>Related</h2>")[1].split("</section>")[0];
  assert.match(pestoRelated, /Also from Italy/);
  assert.match(pestoRelated, /Genoa|Liguria/);
  assert.doesNotMatch(pestoRelated, /Southern Europe|Skordalia/);
  assert.doesNotMatch(read("flying-pancakes/pancakes/albanian-flija/index.html"), /Also from Albania/);
  assert.match(read("flying-sauces/sauces/ajvar/index.html"), /Also from Serbia/);
  assert.doesNotMatch(read("flying-sauces/sauces/ajvar/index.html"), /Also from Eastern Europe/);
  assert.match(read("flying-pancakes/pancakes/tianjin-jianbing/index.html"), /Also from China/);
});

test("search ranks exact names, accents, typos, and photographs", () => {
  const items = JSON.parse(read("assets/search-index.json"));
  function top(query, count = 5) {
    return rankItems(items, query).slice(0, count);
  }
  function first(query) {
    const hit = top(query, 1)[0];
    assert.ok(hit, query);
    return hit;
  }
  const queries = [
    "carbonara", "carbanara", "creme brulee", "crème brûlée", "jianbing", "chicken", "breakfast",
    "vegetarian", "italian pasta", "quick", "thanksgiving", "pancakes", "bbq", "pesto", "aioli",
    "dosa", "pupusas", "turkey", "mole", "injera", "fesenjan", "france", "gravy", "rice", "korea",
    "holiday", "latke", "soup", "vegan", "roast turkey"
  ];
  assert.equal(queries.length, 30);
  assert.equal(first("carbonara").title, "Carbonara");
  assert.equal(first("carbanara").title, "Carbonara");
  assert.deepEqual(top("creme brulee").map((item) => item.href), top("crème brûlée").map((item) => item.href));
  assert.match(first("jianbing").title, /jianbing/i);
  assert.match(first("chicken").title, /chicken/i);
  assert.ok(first("chicken").thumb, "chicken photo");
  assert.ok(first("breakfast").meals.includes("Breakfast"));
  assert.ok(first("vegetarian").diets.some((diet) => /vegetarian/i.test(diet)));
  assert.equal(first("italian pasta").country, "Italy");
  assert.ok(first("quick").minutes <= 30);
  assert.match(first("thanksgiving").collections.join(" "), /thanksgiving/i);
  assert.match(first("pancakes").section, /Pancake/);
  assert.match(first("bbq").section, /BBQ/);
  assert.match(first("pesto").title, /Pesto/);
  assert.match(first("aioli").title, /A[iï]oli/);
  assert.match(first("dosa").title, /dosa/i);
  assert.match(first("pupusas").title, /Pupusa/);
  assert.match(first("turkey").title, /[Tt]urkey/);
  assert.match(first("mole").title, /Mole/);
  assert.match(first("injera").title, /Injera/);
  assert.match(first("fesenjan").title, /Fesenjan/);
  assert.equal(first("france").country, "France");
  assert.match(`${first("gravy").title} ${first("gravy").text}`, /gravy/i);
  assert.match(`${first("rice").title} ${first("rice").ingredients}`, /rice/i);
  assert.ok(/korea/i.test(first("korea").country) || /korea/i.test(first("korea").title));
  assert.match(first("holiday").collections.join(" "), /holiday|thanksgiving/i);
  assert.match(first("latke").title, /latke/i);
  assert.match(`${first("soup").title} ${first("soup").text} ${first("soup").ingredients}`, /soup/i);
  assert.ok(first("vegan").diets.some((diet) => /vegan/i.test(diet)));
  assert.match(first("roast turkey").title, /Roast Turkey/);
  const chicken = top("chicken", 8);
  const withPhoto = chicken.findIndex((item) => item.thumb);
  const without = chicken.findIndex((item) => !item.thumb);
  if (withPhoto >= 0 && without >= 0) assert.ok(withPhoto < without);
  const pasta = rankItems(items, "italian pasta");
  assert.ok(pasta.length >= 8, `italian pasta ${pasta.length}`);
  assert.ok(pasta.slice(0, 8).every((item) => item.country === "Italy"));
  for (const name of ["Arrabbiata", "Amatriciana", "Gricia", "Carbonara", "Cacio e Pepe"]) {
    assert.ok(pasta.some((item) => item.title === name), name);
  }
  assert.ok(pasta.some((item) => /pesto/i.test(item.title)));
  for (const word of ["noodles", "soup", "curry", "bread", "pancake", "sauce", "salad", "cake"]) {
    const hits = rankItems(items, word);
    assert.ok(hits.length >= 3, `${word} ${hits.length}`);
    assert.ok(hits.every((item) => {
      const hay = `${item.title} ${item.section} ${item.ingredients} ${(item.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(word) || hay.includes(word.replace(/s$/, "")) || (word === "pancake" && /pancake|crepe/.test(hay)) || (word === "noodle" && /noodle/.test(hay));
    }), word);
  }
  const soups = rankItems(items, "soup");
  assert.match(soups[0].title, /soup/i);
  assert.ok(soups.some((item) => !/soup/i.test(item.title)));
  const noodles = rankItems(items, "noodles");
  assert.ok(noodles.some((item) => /noodle/i.test(`${item.title} ${(item.tags || []).join(" ")} ${item.ingredients}`)));
  for (const query of ["noodles", "soup"]) {
    const hits = rankItems(items, query);
    const sauceAt = hits.findIndex((item) => isCondiment(item));
    assert.ok(sauceAt > 0, `${query} sauce index ${sauceAt}`);
    assert.ok(hits.slice(0, sauceAt).every((item) => !isCondiment(item)), query);
    assert.equal(isCondiment(hits[0]), false, query);
    assert.equal(sauceGroupLabel(query), `Sauces for ${query}`);
  }
  assert.equal(sauceGroupLabel("sauce"), "");
  assert.equal(sauceGroupLabel("italian pasta"), "");
  const searchJs = fs.readFileSync("assets/js/search.js", "utf8");
  assert.match(searchJs, /kk-search-group/);
  assert.match(searchJs, /sauceGroupLabel/);
  assert.match(fs.readFileSync("assets/css/kite.css", "utf8"), /kk-search-group/);
});
