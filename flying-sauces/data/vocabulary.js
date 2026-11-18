export const BASE_TYPES = [
  ["mother-sauce", "Mother sauce"],
  ["emulsion", "Emulsion"],
  ["salsa", "Salsa"],
  ["chutney", "Chutney"],
  ["curry-paste", "Curry paste"],
  ["curry-sauce", "Curry sauce"],
  ["barbecue", "Barbecue sauce"],
  ["hot-sauce", "Hot sauce"],
  ["pesto", "Pesto"],
  ["dressing", "Dressing"],
  ["dipping-sauce", "Dipping sauce"],
  ["gravy", "Gravy"],
  ["tomato-sauce", "Tomato sauce"],
  ["fermented", "Fermented condiment"],
  ["nut-sauce", "Nut sauce"],
  ["pan-sauce", "Pan sauce"],
  ["marinade", "Marinade"],
  ["relish", "Relish"],
  ["dessert-sauce", "Dessert sauce"],
  ["chili-paste", "Chili paste"],
  ["soy-based", "Soy-based sauce"],
  ["butter-sauce", "Butter sauce"],
  ["yogurt-sauce", "Yogurt sauce"],
  ["vinaigrette", "Vinaigrette"],
  ["mole", "Mole"],
  ["condiment", "Condiment"]
];

export const HEATS = [
  ["none", "No chili heat"],
  ["mild", "Mild"],
  ["medium", "Medium"],
  ["hot", "Hot"],
  ["extra-hot", "Extra hot"]
];

export const USES = [
  ["barbecue", "Barbecue"],
  ["sandwich", "Sandwiches and burgers"],
  ["pasta", "Pasta"],
  ["dipping", "Dipping"],
  ["marinade", "Marinades"],
  ["dressing", "Dressings"],
  ["dessert", "Desserts"],
  ["grilling", "Grilling"],
  ["seafood", "Seafood"],
  ["meat", "Meat"],
  ["vegetables", "Vegetables"],
  ["rice", "Rice"],
  ["breakfast", "Breakfast"],
  ["tacos", "Tacos and tortillas"],
  ["noodles", "Noodles"],
  ["roast", "Roasts"],
  ["salad", "Salads"],
  ["wings", "Wings"],
  ["eggs", "Eggs"],
  ["stew", "Stews"],
  ["curry", "Curries"]
];

export const DIETS = [
  ["vegetarian", "Vegetarian"],
  ["vegan", "Vegan"],
  ["gluten-free", "Gluten-free"],
  ["dairy-free", "Dairy-free"],
  ["nut-free", "Nut-free"]
];

export const REGIONS = [
  ["North Africa", "Africa"],
  ["West Africa", "Africa"],
  ["Central Africa", "Africa"],
  ["East Africa", "Africa"],
  ["Southern Africa", "Africa"],
  ["Middle East", "Asia"],
  ["Caucasus", "Asia"],
  ["Central Asia", "Asia"],
  ["South Asia", "Asia"],
  ["Southeast Asia", "Asia"],
  ["East Asia", "Asia"],
  ["Western Europe", "Europe"],
  ["Northern Europe", "Europe"],
  ["Eastern Europe", "Europe"],
  ["Southern Europe", "Europe"],
  ["North America", "North America"],
  ["Mexico & Central America", "North America"],
  ["Caribbean", "North America"],
  ["South America", "South America"],
  ["Oceania", "Oceania"]
];

export const ALLERGENS = [
  "meat",
  "fish",
  "shellfish",
  "dairy",
  "egg",
  "honey",
  "peanut",
  "tree-nut",
  "soy",
  "wheat",
  "sesame",
  "mustard"
];

export const BASE_TYPE_IDS = BASE_TYPES.map(([id]) => id);
export const HEAT_IDS = HEATS.map(([id]) => id);
export const USE_IDS = USES.map(([id]) => id);
export const DIET_IDS = DIETS.map(([id]) => id);
export const REGION_NAMES = REGIONS.map(([name]) => name);

export function labelOf(list, id) {
  const found = list.find(([key]) => key === id);
  return found ? found[1] : id;
}

export function continentOf(region) {
  const found = REGIONS.find(([name]) => name === region);
  return found ? found[1] : "";
}
