import { el } from "../lib/dom.js";
import { matchesDish, readFilters, writeFilters } from "../lib/filter.js";
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
  const cards = [...document.querySelectorAll("#dish-list .card")];
  let shown = 0;
  for (const card of cards) {
    const match = matchesDish(cardRecord(card), filters);
    card.hidden = !match;
    if (match) shown += 1;
  }
  const count = document.getElementById("results-count");
  if (count) {
    count.textContent = shown === 1 ? "1 dish" : `${shown} dishes`;
  }
  const empty = document.getElementById("empty-results");
  if (empty) empty.hidden = shown !== 0;
}

function userCard(dish) {
  const search = [dish.name, dish.country, dish.region, dish.flavor, dish.story, ...(dish.uses || [])]
    .join(" ")
    .toLowerCase();
  return el("article", {
    class: "card",
    "data-slug": dish.slug,
    "data-region": dish.region,
    "data-type": dish.baseType,
    "data-heat": dish.heat,
    "data-uses": (dish.uses || []).join(","),
    "data-diets": (dish.diets || []).join(","),
    "data-countries": "",
    "data-search": search
  }, [
    el("a", { class: "card-media", href: `dish.html?slug=${encodeURIComponent(dish.slug)}` }, [
      el("span", { class: "card-swatch", "data-type": dish.baseType }, dish.country || "Community"),
      el("span", { class: "badge" }, "Community submission")
    ]),
    el("div", { class: "card-body" }, [
      el("p", { class: "eyebrow" }, `${dish.country} · ${dish.region}`),
      el("h2", {}, [el("a", { href: `dish.html?slug=${encodeURIComponent(dish.slug)}` }, dish.name)]),
      el("p", { class: "meta" }, `${labelOf(BASE_TYPES, dish.baseType)} · ${labelOf(HEATS, dish.heat)}`),
      el("p", {}, dish.flavor || ""),
      el("p", { class: "meta rating" }, formatRating(dish.ratingAvg, dish.ratingCount)),
      el("p", { class: "meta hearts" }, formatHearts(dish.heartCount))
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

  const list = document.getElementById("dish-list");
  const userDishes = await adapter.listUserDishes();
  for (const dish of userDishes) {
    if (list && !list.querySelector(`[data-slug="${dish.slug}"]`)) list.prepend(userCard(dish));
  }

  const activity = await adapter.listActivity();
  const bySlug = new Map(activity.map((item) => [item.slug, item]));
  document.querySelectorAll("#dish-list .card").forEach((card) => {
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
