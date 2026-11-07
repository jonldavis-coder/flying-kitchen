import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSisters } from "./fetch-sisters.mjs";
import { prepareHubPhotos } from "./photos.mjs";
import { page, adSlot } from "./layout.mjs";
import { GEAR, SHOP_POLICY } from "../data/gear.js";
import { boxSetQuote, priceLabel } from "../assets/js/lib/shop.js";
import { escapeHtml } from "../assets/js/lib/escape.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://jonldavis-coder.github.io/flying-kitchen";
const pages = [];

function write(rel, contents) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
  if (rel.endsWith(".html") || rel.endsWith(".xml") || rel.endsWith(".txt")) pages.push(rel);
}

const [sisters, hubPhotos] = await Promise.all([loadSisters(), prepareHubPhotos()]);
const vehiclePhoto = {
  balloon: hubPhotos.balloon,
  train: hubPhotos.train,
  boat: hubPhotos.boat,
  plane: hubPhotos.plane
};
const books = sisters.flatMap((site) => site.books.map((book) => ({ ...book, siteId: site.id, siteName: site.name })));
const pricedBooks = books.filter((book) => book.price != null && book.price !== "");
const quote = boxSetQuote(pricedBooks.map((book) => book.price), SHOP_POLICY.boxSetDiscount);
const missingBookSites = sisters.filter((site) => !site.books.some((book) => book.price != null && book.price !== ""));
const issue = sisters.map((site) => (
  site.status === "live"
    ? `${site.name}: ${site.count} ${site.subject}`
    : `${site.name}: coming soon`
)).join(" · ");

const shopFile = {
  openingSoon: SHOP_POLICY.openingSoon,
  pricesAreFinal: SHOP_POLICY.pricesAreFinal,
  notifyEmail: SHOP_POLICY.notifyEmail,
  boxSetDiscount: SHOP_POLICY.boxSetDiscount,
  gear: GEAR.map((item) => ({
    id: item.id,
    name: item.name,
    pricePlaceholder: item.price,
    page: `shop/${item.id}/`
  })),
  books: pricedBooks.map((book) => ({
    id: `${book.siteId}-${book.slug}`,
    site: book.siteId,
    name: book.title,
    pricePlaceholder: book.price,
    page: `shop/books/${book.siteId}/${book.slug}/`,
    outbound: book.url
  })),
  boxSet: {
    id: "ultimate-library",
    name: "Ultimate Flying Kitchen Library",
    page: "shop/ultimate-library/",
    discount: SHOP_POLICY.boxSetDiscount
  }
};
write("shop-config.js", `// Generated from data/gear.js and sister-site shop prices.\n// Placeholder prices, not final. The library total is not stored here.\nwindow.FLYING_KITCHEN_SHOP = ${JSON.stringify(shopFile, null, 2)};\n`);

const featured = [];
const seenFeatured = new Set();
for (const site of sisters) {
  for (const journey of site.journeys) {
    for (const stop of journey.stops) {
      const key = `${site.id}:${stop.slug}`;
      if (seenFeatured.has(key)) continue;
      seenFeatured.add(key);
      featured.push({ ...stop, siteId: site.id, siteName: site.name, journey: journey.title, vehicle: journey.vehicle, vehicleLabel: journey.vehicleLabel });
    }
  }
}

const editorPicks = books.filter((book) => book.tier === "top" || book.tier === "flagship");
const topBooks = books.filter((book) => book.slug.includes("top-100") || /top 100/i.test(book.title));
const passages = sisters.flatMap((site) => site.passages || []);

const catalog = [];
for (const site of sisters) {
  for (const item of site.items) {
    catalog.push({
      site: site.id,
      siteName: site.name,
      kind: "recipe",
      slug: item.slug,
      name: item.name,
      country: item.country,
      region: item.region,
      flavor: item.flavor,
      url: item.url
    });
  }
}
write("data/catalog.json", JSON.stringify({ generatedAt: new Date().toISOString(), count: catalog.length, items: catalog }, null, 2));
write("data/passages.json", JSON.stringify(passages, null, 2));
write("data/sisters.json", JSON.stringify(sisters.map((site) => ({
  id: site.id,
  name: site.name,
  status: site.status,
  reason: site.reason,
  fetchedAt: site.fetchedAt,
  stale: site.stale,
  count: site.count,
  journeys: site.journeys.length,
  books: site.books.length,
  passages: site.passages.length,
  files: site.files,
  pages: site.pages,
  repoUrl: site.repoUrl
})), null, 2));

const known = [
  "library",
  ...GEAR.map((item) => `gear:${item.id}`),
  ...books.map((book) => `book:${book.siteId}:${book.slug}`),
  ...sisters.flatMap((site) => site.journeys.map((journey) => `journey:${site.id}:${journey.slug}`)),
  ...featured.map((item) => `recipe:${item.siteId}:${item.slug}`)
];
write("assets/js/catalog.js", `// Generated. Community notes can be left only on these hub pages.\nexport const KNOWN = ${JSON.stringify(known)};\n`);

const routes = [];
for (const site of sisters) {
  for (const journey of site.journeys) {
    if (!journey.route.length) continue;
    routes.push({
      id: `${site.id}:${journey.slug}`,
      site: site.id,
      siteName: site.name,
      title: journey.title,
      vehicle: journey.vehicle,
      vehicleLabel: journey.vehicleLabel,
      points: journey.route,
      href: `journeys/${site.id}/${journey.slug}/`
    });
  }
}
write("data/routes.json", JSON.stringify(routes, null, 2));

function sourcingLabel(kind) {
  if (kind === "print-on-demand") return "Planned for print-on-demand";
  if (kind === "private-label") return "Planned for private-label sourcing";
  return "Planned sourcing";
}

function buyBox(amount) {
  return `<aside class="buy-box no-print" id="availability">
      <p class="status-pill">Coming soon</p>
      <p class="price" data-amount="${escapeHtml(amount)}">${escapeHtml(priceLabel(amount, SHOP_POLICY))}</p>
      <a class="button" href="#availability">Coming soon</a>
      <p class="note">Planned for print-on-demand or private-label sourcing. Nothing on this page is for sale yet. The price is a placeholder.</p>
    </aside>`;
}

function communityBlock() {
  return `<p class="meta" id="rating-summary">No ratings yet</p>
      <p class="meta" id="heart-summary">No hearts yet</p>
      <div id="print-actions" class="no-print button-row"></div>
      <div id="community-actions" class="no-print section-rule"></div>
      <section id="comments" class="no-print section-rule" aria-label="Comments"></section>`;
}

function photoFigure(photo, { className = "photo-frame", note = "" } = {}) {
  if (!photo?.local || !photo.alt) return "";
  return `<figure class="${className}">
      <img src="${escapeHtml(photo.local)}" alt="${escapeHtml(photo.alt)}" width="${photo.width || 1200}" height="${photo.height || 800}">
      <figcaption class="photo-credit">${escapeHtml(photo.caption || "")}${photo.caption ? " " : ""}${escapeHtml(photo.credit)} · ${escapeHtml(photo.license)}${note ? ` · ${escapeHtml(note)}` : ""} · <a href="${escapeHtml(photo.sourceUrl)}">Source</a></figcaption>
    </figure>`;
}

function recipeCard(item) {
  const picture = item.photo?.local ? photoFigure(item.photo, { className: "card-photo", note: `Photograph published for ${item.name}` }) : "";
  return `<article class="card">
      ${picture}
      <p class="eyebrow">${escapeHtml(item.siteName)} · ${escapeHtml(item.vehicleLabel || "Route")}</p>
      <h3><a href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a></h3>
      <p>${escapeHtml(item.flavor || item.country || "")}</p>
      <p class="meta">${escapeHtml(item.country || item.siteName)}${item.journey ? ` · ${escapeHtml(item.journey)}` : ""}</p>
      <p class="meta"><a href="notes/${escapeHtml(item.siteId)}/${escapeHtml(item.slug)}/">Hub notes</a></p>
    </article>`;
}

function bookCard(book, href) {
  return `<article class="card">
      <p class="eyebrow">${escapeHtml(book.siteName)} · ${escapeHtml(book.tier === "top" ? "Top shelf" : book.tier === "flagship" ? "Flagship" : "Field booklet")}</p>
      <h3><a href="${escapeHtml(book.url)}">${escapeHtml(book.title)}</a></h3>
      <p>${escapeHtml(book.dek)}</p>
      <p class="meta">${book.members.length} ${book.members.length === 1 ? "entry" : "entries"}${book.price != null ? ` · ${escapeHtml(priceLabel(book.price, SHOP_POLICY))}` : ""}</p>
      <p class="meta"><a href="${escapeHtml(href)}">Shop page</a></p>
    </article>`;
}

function comingBlock(site) {
  return `<section class="coming">
      <p class="status-pill">Coming soon</p>
      <h2>${escapeHtml(site.name)}</h2>
      <p>${escapeHtml(site.reason || `${site.name} has not published a catalog yet.`)}</p>
      ${site.stale ? `<p class="note">${escapeHtml(site.staleReason || "")}</p>` : ""}
      <p class="button-row"><a class="button" href="${escapeHtml(site.repoUrl)}">Repository</a><a class="button button-quiet" href="${escapeHtml(site.pages)}">Pages site</a></p>
    </section>`;
}

function sisterMain(site) {
  if (site.status !== "live") {
    return `<div class="wrap">
      <p class="eyebrow">Sister site</p>
      ${comingBlock(site)}
      <p class="lede">When ${escapeHtml(site.name)} publishes <span class="code">data/index.json</span>, journeys, or books in its public repository, the next build of this hub fills this page from that record.</p>
    </div>`;
  }
  const siteFeatured = featured.filter((item) => item.siteId === site.id);
  const siteBooks = books.filter((book) => book.siteId === site.id);
  const siteTop = topBooks.filter((book) => book.siteId === site.id);
  const picks = editorPicks.filter((book) => book.siteId === site.id);
  return `<div class="wrap">
      <p class="eyebrow">Sister site · ${site.count} published ${escapeHtml(site.subject)}</p>
      <h1>${escapeHtml(site.name)}</h1>
      <p class="lede">${escapeHtml(site.dek)}</p>
      ${site.stale ? `<p class="note">${escapeHtml(site.staleReason || "")}</p>` : ""}
      <p class="button-row"><a class="button" href="${escapeHtml(site.pages)}">Open the full site</a><a class="button button-quiet" href="${escapeHtml(site.repoUrl)}">Repository</a></p>
      ${siteTop.length ? `<h2>Top 100</h2><div class="grid">${siteTop.map((book) => bookCard(book, `shop/books/${site.id}/${book.slug}/`)).join("")}</div>` : ""}
      ${picks.length ? `<h2>Editor’s picks</h2><p>Flagship books published by ${escapeHtml(site.name)}. The order is that site’s own reading route.</p><div class="grid">${picks.map((book) => bookCard(book, `shop/books/${site.id}/${book.slug}/`)).join("")}</div>` : ""}
      ${site.journeys.length ? `<h2>Journeys</h2><div class="grid">${site.journeys.map((journey) => `<article class="card">
        <p class="eyebrow">${escapeHtml(journey.vehicleLabel || journey.vehicle)}</p>
        <h3><a href="journeys/${site.id}/${escapeHtml(journey.slug)}/">${escapeHtml(journey.title)}</a></h3>
        <p>${escapeHtml(journey.dek)}</p>
        <p class="meta">${journey.stops.length} stops</p>
      </article>`).join("")}</div>` : ""}
      ${siteFeatured.length ? `<h2>Featured from the journeys</h2><div class="grid">${siteFeatured.map(recipeCard).join("")}</div>` : ""}
      <h2>Books on the shelf</h2>
      <p>${siteBooks.length} ${siteBooks.length === 1 ? "book" : "books"} with a published contents list.</p>
      <div class="grid">${siteBooks.map((book) => bookCard(book, `shop/books/${site.id}/${book.slug}/`)).join("")}</div>
    </div>`;
}

const homeFeatured = interleaved(featured, 6);
function interleaved(items, limit) {
  const bySite = new Map();
  for (const item of items) {
    if (!bySite.has(item.siteId)) bySite.set(item.siteId, []);
    bySite.get(item.siteId).push(item);
  }
  const groups = [...bySite.values()];
  const out = [];
  for (let index = 0; out.length < limit; index += 1) {
    let added = false;
    for (const group of groups) {
      if (!group[index]) continue;
      out.push(group[index]);
      added = true;
      if (out.length >= limit) break;
    }
    if (!added) break;
  }
  return out;
}
const featuredSites = sisters.filter((site) => featured.some((item) => item.siteId === site.id));
const homeJourneys = sisters.flatMap((site) => site.journeys.map((journey) => ({ ...journey, siteId: site.id, siteName: site.name })));

write("index.html", page({
  title: "Flying Kitchen",
  description: "The flagship hub for Flying Sauces, Flying Pancakes, and Flying BBQ. Routes, books, and a gear shop that is still coming soon.",
  current: "home",
  pageName: "home",
  issue,
  canonical: `${ORIGIN}/`,
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Flying Kitchen",
    url: `${ORIGIN}/`,
    description: "The flagship hub for the Flying sites.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${ORIGIN}/search/?q={query}`,
      "query-input": "required name=query"
    }
  },
  main: `<section class="hero-stage">
      ${photoFigure(hubPhotos.balloon, { className: "hero-frame" })}
      <div class="wrap hero-card">
        <p class="eyebrow">Flagship hub · Balloon, plane, train, and boat</p>
        <h1>Taste the world from one kitchen.</h1>
        <p class="lede">Flying Kitchen gathers the Flying sites the way a travel journal gathers a route. The recipes stay on their own shelves. This issue carries the journeys, the books, and a gear list that is still being planned.</p>
        <form class="search-form" action="search/" method="get">
          <label for="home-q">Search the published shelves</label>
          <div class="tool-row">
            <input id="home-q" name="q" type="search" placeholder="Search sauces, pancakes, barbecue">
            <button class="button" type="submit">Search</button>
          </div>
        </form>
      </div>
    </section>
    <section class="wrap">
      <h2>The way the journal travels</h2>
      <p>These are photographs of a balloon, a railway, a boat, an airplane, and cast-iron skillets. They are not pictures of a named recipe.</p>
      <div class="photo-row">
        ${[hubPhotos.train, hubPhotos.boat, hubPhotos.plane, hubPhotos.skillet].map((photo) => photoFigure(photo)).join("")}
      </div>
    </section>
    ${adSlot("home_after_hero")}
    <section class="wrap">
      <h2>The three sites</h2>
      <div class="sister-band">
        ${sisters.map((site) => site.status === "live"
          ? `<a class="sister-card" href="${site.id}/">
              <p class="eyebrow">Live</p>
              <h3>${escapeHtml(site.name)}</h3>
              <p>${escapeHtml(site.dek)}</p>
              <p class="count-stamp"><span>${site.count}</span>${escapeHtml(site.subject)}</p>
            </a>`
          : `<a class="sister-card is-soon" href="${site.id}/">
              <p class="status-pill">Coming soon</p>
              <h3>${escapeHtml(site.name)}</h3>
              <p>${escapeHtml(site.dek)}</p>
              <p>The shelf appears here when the public catalog is published.</p>
            </a>`).join("")}
      </div>
    </section>
    <section class="wrap">
      <p class="eyebrow">From the published journeys</p>
      <h2>Featured recipes</h2>
      <p>Each card is a stop on a journey the sister site already published. The link opens the full entry there. A picture is added only when that site publishes a freely licensed photograph of that same entry, with its credit.</p>
      ${homeFeatured.length ? `<div class="grid">${homeFeatured.map(recipeCard).join("")}</div>` : `<p class="coming">No journey stops are published yet.</p>`}
      ${featured.length > homeFeatured.length ? `<p class="button-row">${featuredSites.map((site) => `<a class="button button-quiet" href="${site.id}/">${escapeHtml(site.name)} stops</a>`).join("")}</p>` : ""}
    </section>
    <section class="wrap">
      <p class="eyebrow">Hot air balloon, plane, train, boat</p>
      <h2>Top journeys</h2>
      ${homeJourneys.length ? `<div class="grid">${homeJourneys.map((journey) => `<article class="card">
        <p class="eyebrow">${escapeHtml(journey.siteName)} · ${escapeHtml(journey.vehicleLabel || journey.vehicle)}</p>
        <h3><a href="journeys/${escapeHtml(journey.siteId)}/${escapeHtml(journey.slug)}/">${escapeHtml(journey.title)}</a></h3>
        <p>${escapeHtml(journey.dek)}</p>
        <p class="meta">${journey.stops.length} stops · <a href="${escapeHtml(journey.outbound)}">Open on ${escapeHtml(journey.siteName)}</a></p>
      </article>`).join("")}</div>` : `<p>No journeys are published yet.</p>`}
      <p><a class="button" href="map/">Combined route map</a></p>
    </section>
    <section class="wrap highlight">
      <p class="eyebrow">Quoted from the sister sites</p>
      <h2>Who settled the flavor</h2>
      <p>These lines are the sister sites’ own words about settlement, migration, and the kitchens that carried the flavor. Flying Kitchen does not add a story of its own.</p>
      ${passages.length ? `<div class="passage-list">${passages.slice(0, 3).map((passage) => `<blockquote>
        <p>${escapeHtml(passage.text)}</p>
        <footer><a href="${escapeHtml(passage.url)}">${escapeHtml(passage.title)}</a> · ${escapeHtml(passage.siteName)}</footer>
      </blockquote>`).join("")}</div>
      <p><a class="button button-quiet" href="settled/">All of these passages</a></p>` : `<p class="status-pill">Coming soon</p><p>No settlement notes are published on the sister sites yet.</p>`}
    </section>
    ${adSlot("home_mid")}
    <section class="wrap">
      <p class="eyebrow">A reading route, not a prize list</p>
      <h2>Top 100 books</h2>
      ${topBooks.length ? `<div class="grid">${topBooks.map((book) => bookCard(book, `shop/books/${book.siteId}/${book.slug}/`)).join("")}</div>` : `<p>No Top 100 book is published yet. Pancakes and barbecue will show here when their sites publish one.</p>`}
    </section>
    <section class="wrap">
      <h2>Editor’s picks</h2>
      <p>The flagship books each live site already chose. Another editor would pack a different bag.</p>
      ${editorPicks.length ? `<div class="grid">${editorPicks.map((book) => bookCard(book, `shop/books/${book.siteId}/${book.slug}/`)).join("")}</div>` : `<p>No flagship books are published yet.</p>`}
      <p><a class="button button-quiet" href="books/">Every book</a></p>
    </section>
    <section class="wrap">
      <p class="eyebrow">Flying Kitchen Gear</p>
      <h2>The shop is being planned</h2>
      <p>Aprons, tools, boards, skillets, tins, thermometers, gloves, a branding iron, tumblers, and hats. The pictures are original mockups. Prices are placeholders. Buying is coming soon.</p>
      <div class="gear-grid">${GEAR.slice(0, 3).map((item) => `<a class="gear-card" href="shop/${item.id}/">
        <img src="assets/images/gear/${item.id}.jpg" alt="Original mockup of the ${escapeHtml(item.name)}" width="1100" height="1100">
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(priceLabel(item.price, SHOP_POLICY))}</p>
      </a>`).join("")}</div>
      <p><a class="button" href="shop/">Open the shop</a></p>
    </section>`
}));

for (const site of sisters) {
  write(`${site.id}/index.html`, page({
    title: `${site.name} · Flying Kitchen`,
    description: site.status === "live"
      ? `${site.name} on the Flying Kitchen hub: ${site.count} published ${site.subject}, with journeys and books linked back to the full site.`
      : `${site.name} is still being built. This hub page stays empty of invented recipes until a public catalog exists.`,
    current: site.id === "sauces" || site.id === "pancakes" || site.id === "bbq" ? "" : "",
    issue,
    canonical: `${ORIGIN}/${site.id}/`,
    main: sisterMain(site)
  }));
}

write("map/index.html", page({
  title: "Route map · Flying Kitchen",
  description: "A combined world map of the journeys published by the Flying sites. Routes are those sites’ own legs, drawn on Natural Earth country shapes.",
  current: "map",
  pageName: "map",
  issue,
  canonical: `${ORIGIN}/map/`,
  extraHead: `<link rel="stylesheet" href="assets/vendor/leaflet/leaflet.css">`,
  main: `<div class="wrap">
      <p class="eyebrow">Combined routes</p>
      <h1>World route map</h1>
      <p class="lede">Balloon, plane, train, and boat legs from every Flying site that has published a journey. The lines are those published legs, not GPS tracks.</p>
      ${adSlot("map_top")}
      <div class="tool-row no-print">
        <label>Site <select id="map-site"><option value="">All sites</option>${sisters.map((site) => `<option value="${escapeHtml(site.id)}">${escapeHtml(site.name)}</option>`).join("")}</select></label>
        <label>Vehicle <select id="map-vehicle"><option value="">All vehicles</option><option value="balloon">Hot air balloon</option><option value="plane">Plane</option><option value="train">Train</option><option value="boat">Boat</option></select></label>
      </div>
      <p id="map-status" class="meta">Loading the map.</p>
      <div id="route-map" class="map-canvas" role="region" aria-label="World route map"></div>
      <h2>The legs</h2>
      ${routes.length ? `<div class="stack">${routes.map((route) => `<article class="card" data-route="${escapeHtml(route.id)}">
        <p class="eyebrow">${escapeHtml(route.siteName)} · ${escapeHtml(route.vehicleLabel || route.vehicle)}</p>
        <h3><a href="${escapeHtml(route.href)}">${escapeHtml(route.title)}</a></h3>
      </article>`).join("")}</div>` : `<p>No site has published a route yet.</p>`}
      <script id="route-data" type="application/json">${JSON.stringify(routes).replace(/</g, "\\u003c")}</script>
    </div>
    <script src="assets/vendor/leaflet/leaflet.js"></script>`
}));

const searchItems = catalog.map((item) => {
  const blob = [item.name, item.country, item.region, item.flavor, item.siteName, item.kind].join(" ").toLowerCase();
  return { ...item, blob };
});
write("search/index.html", page({
  title: "Search · Flying Kitchen",
  description: "Search the published entries from every live Flying site.",
  current: "search",
  pageName: "search",
  issue,
  canonical: `${ORIGIN}/search/`,
  main: `<div class="wrap">
      <p class="eyebrow">Cross-site search</p>
      <h1>Search the shelves</h1>
      <p class="lede">This list is built from the sister sites’ public catalogs. A site that is still being built contributes nothing until it publishes entries.</p>
      ${adSlot("search_top")}
      <form id="search-form" class="search-form" action="search/" method="get">
        <label for="q">Search</label>
        <div class="tool-row">
          <input id="q" name="q" type="search" placeholder="Name, place, or flavor">
          <button class="button" type="submit">Search</button>
        </div>
      </form>
      <p id="search-status" class="meta">${searchItems.length} entries</p>
      <ul id="results" class="result-list">
        ${searchItems.map((item) => `<li data-search="${escapeHtml(item.blob)}">
          <a href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a>
          <span class="meta">${escapeHtml(item.siteName)}${item.country ? ` · ${escapeHtml(item.country)}` : ""}</span>
          ${item.flavor ? `<p>${escapeHtml(item.flavor)}</p>` : ""}
        </li>`).join("\n")}
      </ul>
    </div>`
}));

write("settled/index.html", page({
  title: "Who settled the flavor · Flying Kitchen",
  description: "Settlement and migration passages quoted from the Flying sites’ own books and field notes.",
  issue,
  canonical: `${ORIGIN}/settled/`,
  main: `<div class="wrap prose">
      <p class="eyebrow">Quoted from the sister sites</p>
      <h1>Who settled the flavor</h1>
      <p class="lede">Each paragraph below is copied from a published Flying book or field note. The link goes to that page. This hub does not write a new history to fill a gap.</p>
      ${passages.length ? `<div class="passage-list">${passages.map((passage) => `<blockquote>
        <p>${escapeHtml(passage.text)}</p>
        <footer>${escapeHtml(passage.label)} · <a href="${escapeHtml(passage.url)}">${escapeHtml(passage.title)}</a> · ${escapeHtml(passage.siteName)}</footer>
      </blockquote>`).join("")}</div>` : `<p class="status-pill">Coming soon</p><p>No settlement notes are published on the sister sites yet.</p>`}
    </div>`
}));

write("books/index.html", page({
  title: "Books · Flying Kitchen",
  description: "Recipe books published by the Flying sites, plus the Ultimate Flying Kitchen Library box set.",
  current: "books",
  issue,
  canonical: `${ORIGIN}/books/`,
  main: `<div class="wrap">
      <p class="eyebrow">The library</p>
      <h1>Books from the Flying sites</h1>
      <p class="lede">Every book below is published on a sister site. The box set is 30% off the sum of their placeholder prices. That total is computed. It is not typed in as its own amount.</p>
      <article class="card box-card">
        <img src="assets/images/gear/ultimate-library.jpg" alt="Original mockup of the Ultimate Flying Kitchen Library" width="1100" height="1100">
        <div>
          <p class="eyebrow">Box set · Save 30%</p>
          <h2><a href="shop/ultimate-library/">Ultimate Flying Kitchen Library</a></h2>
          <p>${pricedBooks.length} books with a published placeholder price. ${escapeHtml(priceLabel(quote.total, SHOP_POLICY))}.</p>
        </div>
      </article>
      ${topBooks.length ? `<h2>Top 100</h2><div class="grid">${topBooks.map((book) => bookCard(book, `shop/books/${book.siteId}/${book.slug}/`)).join("")}</div>` : ""}
      <h2>Editor’s picks</h2>
      <div class="grid">${editorPicks.map((book) => bookCard(book, `shop/books/${book.siteId}/${book.slug}/`)).join("") || "<p>No flagship books are published yet.</p>"}</div>
      <h2>All published books</h2>
      <div class="grid">${books.map((book) => bookCard(book, `shop/books/${book.siteId}/${book.slug}/`)).join("") || "<p>No books are published yet.</p>"}</div>
    </div>`
}));

write("shop/index.html", page({
  title: "Shop · Flying Kitchen",
  description: "Flying Kitchen Gear and the books from each Flying site. Buying is coming soon. Prices are placeholders.",
  current: "shop",
  issue,
  canonical: `${ORIGIN}/shop/`,
  main: `<div class="wrap">
      <p class="status-pill">Coming soon</p>
      <h1>Flying Kitchen Gear</h1>
      <p class="lede">Cool barbecue and grilling goods, drawn with the Flying Kitchen logo. Items are planned for print-on-demand or private-label sourcing. Prices are placeholders, not an offer. The buy button on every item says coming soon.</p>
      ${adSlot("shop_top")}
      <article class="card box-card">
        <img src="assets/images/gear/ultimate-library.jpg" alt="Original mockup of the Ultimate Flying Kitchen Library" width="1100" height="1100">
        <div>
          <p class="eyebrow">Books · Save 30%</p>
          <h2><a href="shop/ultimate-library/">Ultimate Flying Kitchen Library</a></h2>
          <p>Every book with a published placeholder price, from every Flying site that has one. The set price is 30% off the combined price.</p>
          <p class="price" data-amount="${quote.total}">${escapeHtml(priceLabel(quote.total, SHOP_POLICY))}</p>
        </div>
      </article>
      <h2>Gear</h2>
      <div class="gear-grid">
        ${GEAR.map((item) => `<a class="gear-card" href="shop/${item.id}/">
          <img src="assets/images/gear/${item.id}.jpg" alt="Original mockup of the ${escapeHtml(item.name)}" width="1100" height="1100">
          <p class="eyebrow">${escapeHtml(sourcingLabel(item.sourcing))}</p>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(priceLabel(item.price, SHOP_POLICY))}</p>
        </a>`).join("")}
      </div>
      <h2>Books</h2>
      ${sisters.map((site) => {
        const siteBooks = pricedBooks.filter((book) => book.siteId === site.id);
        if (!siteBooks.length) {
          return `<h3>${escapeHtml(site.name)}</h3><p class="status-pill">Coming soon</p><p>No books with placeholder prices are published here yet.</p>`;
        }
        return `<h3>${escapeHtml(site.name)}</h3><div class="grid">${siteBooks.map((book) => bookCard(book, `shop/books/${book.siteId}/${book.slug}/`)).join("")}</div>`;
      }).join("")}
    </div>`
}));

write("shop/ultimate-library/index.html", page({
  title: "Ultimate Flying Kitchen Library · Flying Kitchen",
  description: "A box set of every book from the Flying sites. The price is 30% off the combined placeholder prices, computed automatically.",
  current: "shop",
  pageName: "entry",
  issue,
  canonical: `${ORIGIN}/shop/ultimate-library/`,
  main: `<article id="entry-root" class="wrap entry" data-slug="library">
      <p class="print-only print-brand">Flying Kitchen</p>
      <div class="product">
        <img src="assets/images/gear/ultimate-library.jpg" alt="Original mockup of the Ultimate Flying Kitchen Library box set" width="1100" height="1100">
        <div>
          <p class="eyebrow">Box set · Books only</p>
          <h1>Ultimate Flying Kitchen Library</h1>
          <p class="dek">All the books from all three Flying sites that have published a placeholder price. Gear is separate. The discount is 30% off the sum of those book prices, computed from the shop config, not stored as its own amount.</p>
          <ul class="price-lines" id="box-quote" data-total="${quote.total}" data-sum="${quote.sum}" data-savings="${quote.savings}">
            <li>Books in the set: ${quote.count}</li>
            <li>Individual books, added up: <span data-sum>${escapeHtml(priceLabel(quote.sum, SHOP_POLICY))}</span></li>
            <li>You save: <span data-savings>${escapeHtml(priceLabel(quote.savings, SHOP_POLICY))}</span></li>
            <li>Set price: <span data-total>${escapeHtml(priceLabel(quote.total, SHOP_POLICY))}</span></li>
          </ul>
          ${buyBox(quote.total)}
          <p class="note">${missingBookSites.length ? `${escapeHtml(missingBookSites.map((site) => site.name).join(" and "))} ${missingBookSites.length === 1 ? "joins" : "join"} this sum when ${missingBookSites.length === 1 ? "that site publishes" : "those sites publish"} book prices. Until then ${missingBookSites.length === 1 ? "it is" : "they are"} absent from the arithmetic on purpose.` : "Every Flying site with published book prices is in this sum."}</p>
        </div>
      </div>
      <h2>Books in the set</h2>
      <ol class="contents">
        ${pricedBooks.map((book) => `<li><a href="${escapeHtml(book.url)}">${escapeHtml(book.title)}</a> · ${escapeHtml(book.siteName)} · ${escapeHtml(priceLabel(book.price, SHOP_POLICY))}</li>`).join("")}
      </ol>
      ${communityBlock()}
    </article>`
}));

for (const item of GEAR) {
  write(`shop/${item.id}/index.html`, page({
    title: `${item.name} · Flying Kitchen`,
    description: `${item.summary} Planned for ${item.sourcing === "print-on-demand" ? "print-on-demand" : "private-label"} sourcing. Coming soon.`,
    current: "shop",
    pageName: "entry",
    issue,
    canonical: `${ORIGIN}/shop/${item.id}/`,
    main: `<article id="entry-root" class="wrap entry" data-slug="gear:${escapeHtml(item.id)}">
      <p class="print-only print-brand">Flying Kitchen</p>
      <div class="product">
        <img src="assets/images/gear/${item.id}.jpg" alt="Original mockup of the ${escapeHtml(item.name)}. This is a drawing for the shop, not a photograph of a finished product." width="1100" height="1100">
        <div>
          <p class="eyebrow">${escapeHtml(sourcingLabel(item.sourcing))}</p>
          <h1>${escapeHtml(item.name)}</h1>
          <p class="dek">${escapeHtml(item.summary)}</p>
          <ul>${item.details.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
          ${buyBox(item.price)}
          ${adSlot("entry_rail")}
        </div>
      </div>
      ${communityBlock()}
    </article>`
  }));
}

for (const book of books) {
  const amount = book.price;
  write(`shop/books/${book.siteId}/${book.slug}/index.html`, page({
    title: `${book.title} · Flying Kitchen`,
    description: `${book.title} from ${book.siteName}. ${book.dek}`,
    current: "shop",
    pageName: "entry",
    issue,
    canonical: `${ORIGIN}/shop/books/${book.siteId}/${book.slug}/`,
    main: `<article id="entry-root" class="wrap entry" data-slug="book:${escapeHtml(book.siteId)}:${escapeHtml(book.slug)}">
      <p class="print-only print-brand">Flying Kitchen</p>
      <p class="eyebrow">${escapeHtml(book.siteName)} · ${book.members.length} ${book.members.length === 1 ? "entry" : "entries"}</p>
      <h1>${escapeHtml(book.title)}</h1>
      <p class="dek">${escapeHtml(book.dek)}</p>
      ${book.intro.map((para) => `<p>${escapeHtml(para)}</p>`).join("")}
      <p><a class="button" href="${escapeHtml(book.url)}">Read the full book on ${escapeHtml(book.siteName)}</a></p>
      ${amount != null ? buyBox(amount) : `<p class="status-pill">Coming soon</p><p>This book has no published placeholder price yet, so it is not in the library sum.</p>`}
      <h2>Contents</h2>
      <ol class="contents">
        ${book.members.map((member) => `<li><a href="${escapeHtml(member.url)}">${escapeHtml(member.name)}</a>${member.country ? ` · ${escapeHtml(member.country)}` : ""}</li>`).join("")}
      </ol>
      ${communityBlock()}
    </article>`
  }));
}

for (const site of sisters) {
  for (const journey of site.journeys) {
    write(`journeys/${site.id}/${journey.slug}/index.html`, page({
      title: `${journey.title} · Flying Kitchen`,
      description: journey.dek || `${journey.title}, a ${journey.vehicleLabel || journey.vehicle} journey from ${site.name}.`,
      pageName: "entry",
      issue,
      canonical: `${ORIGIN}/journeys/${site.id}/${journey.slug}/`,
      main: `<article id="entry-root" class="wrap entry" data-slug="journey:${escapeHtml(site.id)}:${escapeHtml(journey.slug)}">
        <p class="print-only print-brand">Flying Kitchen</p>
        ${photoFigure(vehiclePhoto[journey.vehicle], { note: "This photograph shows the vehicle, not the food on this route." })}
        <p class="eyebrow">${escapeHtml(site.name)} · ${escapeHtml(journey.vehicleLabel || journey.vehicle)}</p>
        <h1>${escapeHtml(journey.title)}</h1>
        <p class="dek">${escapeHtml(journey.dek)}</p>
        ${journey.intro.map((para) => `<p>${escapeHtml(para)}</p>`).join("")}
        <p><a class="button" href="${escapeHtml(journey.outbound)}">Open this route on ${escapeHtml(site.name)}</a> <a class="button button-quiet" href="map/">See it on the map</a></p>
        <h2>Stops</h2>
        <ol class="contents">
          ${journey.stops.map((stop) => `<li><a href="${escapeHtml(stop.url)}">${escapeHtml(stop.name)}</a>${stop.country ? ` · ${escapeHtml(stop.country)}` : ""}${stop.flavor ? ` — ${escapeHtml(stop.flavor)}` : ""}</li>`).join("")}
        </ol>
        ${communityBlock()}
      </article>`
    }));
  }
}

for (const item of featured) {
  write(`notes/${item.siteId}/${item.slug}/index.html`, page({
    title: `${item.name} notes · Flying Kitchen`,
    description: `Hub notes for ${item.name}, a ${item.siteName} entry. The full recipe stays on that site.`,
    pageName: "entry",
    issue,
    canonical: `${ORIGIN}/notes/${item.siteId}/${item.slug}/`,
    main: `<article id="entry-root" class="wrap entry" data-slug="recipe:${escapeHtml(item.siteId)}:${escapeHtml(item.slug)}">
      <p class="print-only print-brand">Flying Kitchen</p>
      ${item.photo?.local ? photoFigure(item.photo, { note: `Photograph published for ${item.name}` }) : ""}
      <p class="eyebrow">${escapeHtml(item.siteName)}${item.journey ? ` · ${escapeHtml(item.journey)}` : ""}</p>
      <h1>${escapeHtml(item.name)}</h1>
      <p class="dek">${escapeHtml(item.flavor || "")}</p>
      <p class="meta">${escapeHtml(item.country || "")}${item.region ? ` · ${escapeHtml(item.region)}` : ""}</p>
      <p>The full entry, including the recipe, stays on ${escapeHtml(item.siteName)}. This page is for a heart, a rating, or a comment about the pick.</p>
      <p><a class="button" href="${escapeHtml(item.url)}">Read the full entry</a></p>
      ${adSlot("entry_rail")}
      ${communityBlock()}
    </article>`
  }));
}

const usedEntryPhotos = [];
const seenEntryPhotos = new Set();
for (const item of featured) {
  if (!item.photo?.local || seenEntryPhotos.has(`${item.siteId}:${item.slug}`)) continue;
  seenEntryPhotos.add(`${item.siteId}:${item.slug}`);
  usedEntryPhotos.push(item);
}

write("credits/index.html", page({
  title: "Photo credits · Flying Kitchen",
  description: "Credits for the photographs on Flying Kitchen. Hub pictures are freely licensed. Dish pictures come only from the sister site that published that entry.",
  issue,
  canonical: `${ORIGIN}/credits/`,
  main: `<div class="wrap prose">
      <p class="eyebrow">Photographs</p>
      <h1>Photo credits</h1>
      <p class="lede">Hub pictures are photographs downloaded from Wikimedia Commons. Each one is CC0, CC BY, CC BY-SA, or public domain. A dish card gets a photograph only when its own sister site publishes a freely licensed picture of that same entry.</p>
      <h2>Hub photographs</h2>
      <ul class="credit-list">
        ${Object.values(hubPhotos).map((photo) => `<li>
          <img src="${escapeHtml(photo.local)}" alt="" width="160" height="100">
          <p><strong>${escapeHtml(photo.caption)}</strong></p>
          <p>${escapeHtml(photo.alt)}</p>
          <p>${escapeHtml(photo.credit)} · ${escapeHtml(photo.license)}${photo.licenseUrl ? ` · <a href="${escapeHtml(photo.licenseUrl)}">License</a>` : ""} · <a href="${escapeHtml(photo.sourceUrl)}">Wikimedia Commons</a></p>
        </li>`).join("")}
      </ul>
      <h2>Sister-site photographs</h2>
      ${usedEntryPhotos.length ? `<ul class="credit-list">${usedEntryPhotos.map((item) => `<li>
          <p><strong>${escapeHtml(item.name)}</strong> · ${escapeHtml(item.siteName)}</p>
          <p>${escapeHtml(item.photo.alt)}</p>
          <p>${escapeHtml(item.photo.credit)} · ${escapeHtml(item.photo.license)}${item.photo.licenseUrl ? ` · <a href="${escapeHtml(item.photo.licenseUrl)}">License</a>` : ""} · <a href="${escapeHtml(item.photo.sourceUrl || item.url)}">Source</a></p>
        </li>`).join("")}</ul>` : `<p>None of the sister sites has published a freely licensed photograph for a featured entry in this build. Those cards stay without a picture rather than borrow one from another dish.</p>`}
    </div>`
}));

write("about/index.html", page({
  title: "About · Flying Kitchen",
  description: "What Flying Kitchen is, which sister sites it reads, and what it refuses to invent.",
  current: "about",
  issue,
  canonical: `${ORIGIN}/about/`,
  main: `<div class="wrap prose">
      <p class="eyebrow">About the hub</p>
      <h1>A journal for three Flying sites</h1>
      <p>Flying Kitchen is the flagship shelf for Flying Sauces, Flying Pancakes, and Flying BBQ. The voice is a travel journal: hot air balloon, plane, train, and boat. The work is recipes and where they come from.</p>
      <p>At build time the hub reads each site’s public repository. ${sisters.map((site) => site.status === "live" ? `${site.name} is in this issue with ${site.count} ${site.subject}.` : `${site.name} shows a coming-soon section until it publishes a catalog.`).join(" ")} The next rebuild fills a coming-soon section from that catalog.</p>
      <h2>Accuracy</h2>
      <p>Counts, journeys, books, and settlement lines come from those sites. Featured recipes are stops on published journeys. The Top 100 is the sister site’s own book, when one exists. Editor’s picks are that site’s flagship books.</p>
      <p>Dishes, origins, and book lists come from the sister sites’ published pages. Community ratings start empty. A comment appears only after a reader posts one in demo mode, and it stays in that browser.</p>
      <h2>The shop</h2>
      <p>Flying Kitchen Gear is a plan: aprons, grill tools, cutting boards, cast-iron skillets, spice-rub tins, meat thermometers, grill gloves, branding irons, tumblers, and hats, each drawn with the logo. Sourcing is planned as print-on-demand or private label. Prices live in the shop config as placeholders. The Ultimate Flying Kitchen Library is every published Flying book, at 30% off the combined placeholder price.</p>
      <h2>Food</h2>
      <p>Recipes on the sister sites are for home cooking. They are not professional food-safety or medical advice.</p>
    </div>`
}));

write("guidelines/index.html", page({
  title: "Community guidelines · Flying Kitchen",
  description: "How comments, hearts, and ratings work on Flying Kitchen.",
  issue,
  canonical: `${ORIGIN}/guidelines/`,
  main: `<div class="wrap prose">
      <h1>Community guidelines</h1>
      <p>Hearts, star ratings, and comments are notes from signed-in readers. In demo mode they stay in this browser. They are not reviews collected by the shop, and the site does not write them for you.</p>
      <ul>
        <li>Write about the entry in your own words.</li>
        <li>Leave other people alone. Harassment is reported and can be hidden by the owner account in this browser.</li>
        <li>Do not present a home note as professional food-safety or medical advice.</li>
        <li>A bare link is not a comment. Two links in a comment is the limit.</li>
        <li>Suggestions must point at Flying Sauces, Flying Pancakes, or Flying BBQ. They are not added to the public shelf from the form.</li>
      </ul>
    </div>`
}));

write("affiliate/index.html", page({
  title: "Affiliate disclosure · Flying Kitchen",
  description: "Flying Kitchen does not use affiliate links in this issue.",
  issue,
  canonical: `${ORIGIN}/affiliate/`,
  main: `<div class="wrap prose">
      <h1>Affiliate disclosure</h1>
      <p>This issue has no affiliate links and no paid product placements. Advertisement slots exist in the page and stay empty while the ad config says the provider is none. Print views hide those slots.</p>
      <p>If a later issue adds an affiliate relationship or a paid slot, this page will name it before the link goes up.</p>
    </div>`
}));

write("privacy/index.html", page({
  title: "Privacy · Flying Kitchen",
  description: "Draft privacy note for Flying Kitchen demo mode.",
  issue,
  canonical: `${ORIGIN}/privacy/`,
  main: `<div class="wrap prose">
      <p class="eyebrow">Draft</p>
      <h1>Privacy</h1>
      <p>This is a draft note for a static site, not a lawyer’s policy. In demo mode, the account, comments, hearts, ratings, reports, and suggestions are stored in this browser’s local storage. The site does not send them to a server while the Supabase settings in the config are empty.</p>
      <p>Passwords are hashed in the browser before they are stored. That only keeps them out of plain text on this device. Demo mode is for trying the kitchen, not for a private multi-user service.</p>
      <p>The pages are static files on GitHub Pages. A future shared store would need its own note on this page before it is turned on.</p>
    </div>`
}));

write("terms/index.html", page({
  title: "Terms · Flying Kitchen",
  description: "Draft terms for the Flying Kitchen hub and its closed shop.",
  issue,
  canonical: `${ORIGIN}/terms/`,
  main: `<div class="wrap prose">
      <p class="eyebrow">Draft</p>
      <h1>Terms</h1>
      <p>This is a draft for a static fan-journal of the Flying sites, not a contract from a store. The shop is closed. Placeholder prices are not an offer. Coming soon buttons do not take payment, shipping details, or preorders.</p>
      <p>Recipes linked from this hub are home-cooking notes on the sister sites. They are not a promise of a result and not professional advice.</p>
      <p>Community notes are the words of the person who posted them. In demo mode they never leave that browser.</p>
    </div>`
}));

write("sources/index.html", page({
  title: "Sources · Flying Kitchen",
  description: "Which public files Flying Kitchen read, and when.",
  issue,
  canonical: `${ORIGIN}/sources/`,
  main: `<div class="wrap">
      <p class="eyebrow">Build record</p>
      <h1>Sources</h1>
      <p class="lede">Each section is a read of a public repository. A coming-soon site had no catalog to quote.</p>
      ${sisters.map((site) => `<section class="card">
        <p class="eyebrow">${escapeHtml(site.status === "live" ? "Live read" : "Coming soon")}</p>
        <h2><a href="${escapeHtml(site.repoUrl)}">${escapeHtml(site.name)}</a></h2>
        <p>Read at ${escapeHtml(site.fetchedAt || "")}. ${site.stale ? escapeHtml(site.staleReason || "") : ""}</p>
        <p>${site.status === "live" ? `${site.count} entries · ${site.journeys.length} journeys · ${site.books.length} books · ${site.passages.length} settlement passages.` : escapeHtml(site.reason || "")}</p>
        ${site.files?.length ? `<ul>${site.files.map((file) => `<li><a href="${escapeHtml(`https://raw.githubusercontent.com/${site.repo}/main/${file}`)}">${escapeHtml(file)}</a></li>`).join("")}</ul>` : ""}
      </section>`).join("")}
    </div>`
}));

write("login.html", page({
  title: "Sign in · Flying Kitchen",
  description: "Sign in to leave a heart, a rating, or a comment. Demo mode stays in this browser.",
  pageName: "auth",
  issue,
  canonical: `${ORIGIN}/login.html`,
  main: `<div class="wrap prose">
      <h1>Sign in</h1>
      <p id="auth-status" role="status"></p>
      <p>Demo mode keeps the account in this browser. It is here so you can try hearts, stars, and comments. It is not a private multi-user service.</p>
      <h2>Create an account</h2>
      <form id="signup-form" data-auth class="stack">
        <label>Display name <input name="displayName" required maxlength="40" autocomplete="nickname"></label>
        <label>Email <input name="email" type="email" required autocomplete="username"></label>
        <label>Password <input name="password" type="password" required minlength="8" autocomplete="new-password"></label>
        <label class="hp">Website <input name="website" tabindex="-1" autocomplete="off"></label>
        <button type="submit">Create account</button>
        <p class="form-error" role="alert"></p>
      </form>
      <h2>Sign in</h2>
      <form id="signin-form" data-auth class="stack">
        <label>Email <input name="email" type="email" required autocomplete="username"></label>
        <label>Password <input name="password" type="password" required autocomplete="current-password"></label>
        <label class="hp">Website <input name="website" tabindex="-1" autocomplete="off"></label>
        <button type="submit">Sign in</button>
        <p class="form-error" role="alert"></p>
      </form>
      <h2>One-time link</h2>
      <form id="magic-form" data-auth class="stack">
        <label>Email <input name="email" type="email" required></label>
        <label class="hp">Website <input name="website" tabindex="-1" autocomplete="off"></label>
        <button type="submit">Send a one-time link</button>
        <p class="form-error" role="alert"></p>
      </form>
    </div>`
}));

write("submit.html", page({
  title: "Suggest a pick · Flying Kitchen",
  description: "Suggest a page that already exists on a Flying site. Suggestions stay in this browser.",
  pageName: "submit",
  issue,
  canonical: `${ORIGIN}/submit.html`,
  main: `<div class="wrap prose">
      <h1>Suggest a pick</h1>
      <p>Point at a page that already exists on Flying Sauces, Flying Pancakes, or Flying BBQ. The suggestion stays in this browser. It is not added to the public shelf and it is not treated as a new fact.</p>
      <form id="suggest-form" class="stack">
        <label>Name <input name="title" required maxlength="140"></label>
        <label>Address <input name="url" type="url" required placeholder="https://jonldavis-coder.github.io/flying-sauces/"></label>
        <label>Note <textarea name="note" maxlength="500" rows="4"></textarea></label>
        <label class="hp">Website <input name="website" tabindex="-1" autocomplete="off"></label>
        <button type="submit">Save in this browser</button>
        <p class="form-error" role="alert"></p>
      </form>
      <h2>Your suggestions</h2>
      <ul id="suggestion-list"></ul>
    </div>`
}));

write("moderate.html", page({
  title: "Moderate · Flying Kitchen",
  description: "Owner tools for comments stored in this browser.",
  pageName: "moderate",
  issue,
  canonical: `${ORIGIN}/moderate.html`,
  robots: "noindex",
  main: `<div class="wrap">
      <h1>Moderate</h1>
      <p>These tools read the demo notes in this browser. They turn on when the config has an owner email and that account is signed in.</p>
      <div id="moderate-root"></div>
    </div>`
}));

write("404.html", page({
  title: "Page not found · Flying Kitchen",
  description: "That page is not on the Flying Kitchen hub.",
  issue,
  canonical: `${ORIGIN}/404.html`,
  main: `<div class="wrap">
      <p class="eyebrow">404</p>
      <h1>This page is not on the route.</h1>
      <p class="lede">The hub did not invent a stand-in. Try the field guide, the map, or the search.</p>
      <p class="button-row"><a class="button" href="index.html">Back to the hub</a><a class="button button-quiet" href="search/">Search</a></p>
    </div>`
}));

write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter((rel) => rel.endsWith(".html")).map((rel) => {
  const loc = rel === "index.html" ? `${ORIGIN}/` : `${ORIGIN}/${rel.replace(/index\.html$/, "")}`;
  return `  <url><loc>${loc}</loc></url>`;
}).join("\n")}\n</urlset>\n`);

const manifest = pages.filter((rel) => rel.endsWith(".html"));
write("data/pages.json", JSON.stringify(manifest, null, 2));

const summary = {
  issue,
  sauces: sisters.find((site) => site.id === "sauces")?.count || 0,
  featured: featured.length,
  journeys: homeJourneys.length,
  books: books.length,
  pricedBooks: pricedBooks.length,
  boxSet: quote,
  passages: passages.length,
  gear: GEAR.length,
  pages: manifest.length
};
write("data/build-summary.json", JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
