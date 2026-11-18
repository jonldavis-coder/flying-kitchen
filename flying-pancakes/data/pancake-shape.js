export function cake(input) {
  return {
    sample: true,
    pronunciation: "",
    locale: input.place || input.country || "",
    alsoCountries: [],
    variations: [],
    pairings: [],
    safety: "",
    storage: "Refrigerate leftovers and reheat on a dry skillet. Egg or dairy batter should not sit at room temperature.",
    diets: [],
    allergens: [],
    arriveBy: "plane",
    ...input
  };
}
