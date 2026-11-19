/** Pure planner rules shared by the page and the tests. */

export const SLOTS = [
  { key: "b", meal: "Breakfast" },
  { key: "l", meal: "Lunch" },
  { key: "d", meal: "Dinner" }
];

export function parsePlan(search) {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const slots = {};
  for (const slot of SLOTS) {
    const raw = params.get(slot.key);
    if (!raw || !raw.includes(":")) continue;
    const [country, recipe] = raw.split(":");
    if (!country || !recipe) continue;
    slots[slot.key] = { country, recipe };
  }
  return slots;
}

export function serializePlan(slots) {
  const params = new URLSearchParams();
  for (const slot of SLOTS) {
    const stop = slots?.[slot.key];
    if (stop?.country && stop?.recipe) params.set(slot.key, `${stop.country}:${stop.recipe}`);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** True when every chosen stop uses a different country. */
export function countriesDiffer(slots) {
  const names = SLOTS.map((slot) => slots?.[slot.key]?.country).filter(Boolean);
  return new Set(names).size === names.length;
}

function isSauce(recipe) {
  return /sauce/i.test(recipe?.section || "") || /\b(sauce|dressing|condiment|salsa|chutney|gravy|relish|glaze|marinade|stock|broth|aioli|mayonnaise|ketchup|vinaigrette)\b/i.test(recipe?.title || "");
}

function isMorningDish(recipe) {
  const hay = `${recipe.title} ${(recipe.tags || []).join(" ")} ${recipe.section || ""}`.toLowerCase();
  return /pancake|crepe|crêpe|bread|egg|pastry|hopper|dosa|injera|porridge|oatmeal|toast|waffle|fritter/.test(hay) || /pancake/i.test(recipe.section || "");
}

function byPhoto(a, b) {
  return (a.thumb ? 0 : 1) - (b.thumb ? 0 : 1) || a.title.localeCompare(b.title);
}

/** Primary dishes for a meal, then sauces only when nothing else fits. */
export function recipesFor(recipes, countrySlug, meal) {
  const mine = (recipes || []).filter((recipe) => recipe.country === countrySlug);
  const dishes = mine.filter((recipe) => !isSauce(recipe));
  const sauces = mine.filter((recipe) => isSauce(recipe));
  let primary = [];
  if (meal === "Breakfast") {
    const tagged = dishes.filter((recipe) => (recipe.meals || []).includes("Breakfast"));
    const morning = dishes.filter((recipe) => isMorningDish(recipe) && !tagged.includes(recipe));
    primary = tagged.sort(byPhoto).concat(morning.sort(byPhoto));
    if (!primary.length) primary = dishes.slice().sort(byPhoto);
  } else {
    const mains = dishes.filter((recipe) => /bbq|grill|pancake/i.test(recipe.section || "") || (recipe.meals || []).some((item) => /feast|dinner|lunch/i.test(item)));
    primary = (mains.length ? mains : dishes).slice().sort(byPhoto);
  }
  const more = primary.length ? sauces.slice().sort(byPhoto) : [];
  return { primary, more, note: primary.length ? "" : "No fitting dish" };
}

export function countriesFor(recipes, countries, meal, taken) {
  const used = new Set(taken || []);
  return (countries || []).filter((country) => {
    if (used.has(country.slug)) return false;
    return recipesFor(recipes, country.slug, meal).primary.length > 0;
  });
}

export function planQuery(slots) {
  return serializePlan(slots);
}
