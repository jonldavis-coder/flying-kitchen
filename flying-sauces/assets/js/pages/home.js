import { el } from "../lib/dom.js";
import { matchesSauce, readFilters, writeFilters } from "../lib/filter.js";
import { formatHearts, formatRating } from "../lib/format.js";
import { labelOf, BASE_TYPES, HEATS } from "../../../data/vocabulary.js";

function cardRecord(card) {
  return {
    region: card.dataset.region || "",
    baseType: card.dataset.type || "",
    heat: card.dataset.heat || "",
    uses: (card.dataset.uses || "").split(",").filter(Boolean),
    diets: (card.dataset.diets || "").split(",").filter(Boolean),
    countries: (card.dataset.countries || "").split(",").filter(Boolean),
    search: card.dataset.search || ""
  };
}

function filtersFromForm(form) {
  const data = new FormData(form);
  return {
    query: String(data.get("q") || ""),
    region: String(data.get("region") || ""),
    baseType: String(data.get("type") || ""),
    heat: String(data.get("heat") || ""),
    use: String(data.get("use") || ""),
    diet: String(data.get("diet") || ""),
    country: String(data.get("country") || "")
  };
}

function applyFilters(filters) {
  const cards = [...document.querySelectorAll("#sauce-list .card")];
  let shown = 0;
  for (const card of cards) {
    const match = matchesSauce(cardRecord(card), filters);
    card.hidden = !match;
    if (match) shown += 1;
  }
  const count = document.getElementById("results-count");
  if (count) {
    count.textContent = shown === 1 ? "1 sauce" : `${shown} sauces`;
  }
  const empty = document.getElementById("empty-results");
  if (empty) empty.hidden = shown !== 0;
}

function userCard(sauce) {
  const search = [sauce.name, sauce.country, sauce.region, sauce.flavor, sauce.story, ...(sauce.uses || [])]
    .join(" ")
    .toLowerCase();
  return el("article", {
    class: "card",
    "data-slug": sauce.slug,
    "data-region": sauce.region,
    "data-type": sauce.baseType,
    "data-heat": sauce.heat,
    "data-uses": (sauce.uses || []).join(","),
    "data-diets": (sauce.diets || []).join(","),
    "data-countries": "",
    "data-search": search
  }, [
    el("a", { class: "card-media", href: `sauce.html?slug=${encodeURIComponent(sauce.slug)}` }, [
      el("span", { class: "card-swatch", "data-type": sauce.baseType }, sauce.country || "Community"),
      el("span", { class: "badge" }, "Community submission")
    ]),
    el("div", { class: "card-body" }, [
      el("p", { class: "eyebrow" }, `${sauce.country} · ${sauce.region}`),
      el("h2", {}, [el("a", { href: `sauce.html?slug=${encodeURIComponent(sauce.slug)}` }, sauce.name)]),
      el("p", { class: "meta" }, `${labelOf(BASE_TYPES, sauce.baseType)} · ${labelOf(HEATS, sauce.heat)}`),
      el("p", {}, sauce.flavor || ""),
      el("p", { class: "meta rating" }, formatRating(sauce.ratingAvg, sauce.ratingCount)),
      el("p", { class: "meta hearts" }, formatHearts(sauce.heartCount))
    ])
  ]);
}

export async function init(adapter) {
  const form = document.getElementById("filters");
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const initial = readFilters(params);
  for (const [key, value] of Object.entries({
    q: initial.query,
    region: initial.region,
    type: initial.baseType,
    heat: initial.heat,
    use: initial.use,
    diet: initial.diet,
    country: initial.country
  })) {
    const field = form.elements[key];
    if (field && value) field.value = value;
  }

  const list = document.getElementById("sauce-list");
  const userSauces = await adapter.listUserSauces();
  for (const sauce of userSauces) {
    if (list && !list.querySelector(`[data-slug="${sauce.slug}"]`)) list.prepend(userCard(sauce));
  }

  const activity = await adapter.listActivity();
  const bySlug = new Map(activity.map((item) => [item.slug, item]));
  document.querySelectorAll("#sauce-list .card").forEach((card) => {
    const stats = bySlug.get(card.dataset.slug);
    if (!stats) return;
    const rating = card.querySelector(".rating");
    const hearts = card.querySelector(".hearts");
    if (rating) rating.textContent = formatRating(stats.ratingAvg, stats.ratingCount);
    if (hearts) hearts.textContent = formatHearts(stats.heartCount);
  });

  const run = () => {
    const filters = filtersFromForm(form);
    writeFilters(filters);
    applyFilters(filters);
  };
  form.addEventListener("input", run);
  form.addEventListener("change", run);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
  applyFilters(filtersFromForm(form));
}
