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

export function recipesFor(recipes, countrySlug, meal) {
  const mine = (recipes || []).filter((recipe) => recipe.country === countrySlug);
  const tagged = mine.filter((recipe) => (recipe.meals || []).includes(meal));
  const list = tagged.length ? tagged : mine;
  return list.slice().sort((a, b) => (a.thumb ? 0 : 1) - (b.thumb ? 0 : 1) || a.title.localeCompare(b.title));
}

export function planQuery(slots) {
  return serializePlan(slots);
}
