import { el } from "../lib/dom.js";
import { matchesPancake, readFilters, writeFilters } from "../lib/filter.js";
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
  const cards = [...document.querySelectorAll("#pancake-list .card")];
  let shown = 0;
  for (const card of cards) {
    const match = matchesPancake(cardRecord(card), filters);
    card.hidden = !match;
    if (match) shown += 1;
  }
  const count = document.getElementById("results-count");
  if (count) {
    count.textContent = shown === 1 ? "1 pancake" : `${shown} pancakes`;
  }
  const empty = document.getElementById("empty-results");
  if (empty) empty.hidden = shown !== 0;
}

function userCard(pancake) {
  const search = [pancake.name, pancake.country, pancake.region, pancake.flavor, pancake.story, ...(pancake.uses || [])]
    .join(" ")
    .toLowerCase();
  return el("article", {
    class: "card",
    "data-slug": pancake.slug,
    "data-region": pancake.region,
    "data-type": pancake.baseType,
    "data-heat": pancake.heat,
    "data-uses": (pancake.uses || []).join(","),
    "data-diets": (pancake.diets || []).join(","),
    "data-countries": "",
    "data-search": search
  }, [
    el("a", { class: "card-media", href: `pancake.html?slug=${encodeURIComponent(pancake.slug)}` }, [
      el("span", { class: "card-swatch", "data-type": pancake.baseType }, pancake.country || "Community"),
      el("span", { class: "badge" }, "Community submission")
    ]),
    el("div", { class: "card-body" }, [
      el("p", { class: "eyebrow" }, `${pancake.country} · ${pancake.region}`),
      el("h2", {}, [el("a", { href: `pancake.html?slug=${encodeURIComponent(pancake.slug)}` }, pancake.name)]),
      el("p", { class: "meta" }, `${labelOf(BASE_TYPES, pancake.baseType)} · ${labelOf(HEATS, pancake.heat)}`),
      el("p", {}, pancake.flavor || ""),
      el("p", { class: "meta rating" }, formatRating(pancake.ratingAvg, pancake.ratingCount)),
      el("p", { class: "meta hearts" }, formatHearts(pancake.heartCount))
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

  const list = document.getElementById("pancake-list");
  const userPancakes = await adapter.listUserPancakes();
  for (const pancake of userPancakes) {
    if (list && !list.querySelector(`[data-slug="${pancake.slug}"]`)) list.prepend(userCard(pancake));
  }

  const activity = await adapter.listActivity();
  const bySlug = new Map(activity.map((item) => [item.slug, item]));
  document.querySelectorAll("#pancake-list .card").forEach((card) => {
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
