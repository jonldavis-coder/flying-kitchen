export const BASE_TYPES = [
  ["wheat-batter", "Wheat batter"],
  ["crepe", "Crepe"],
  ["buckwheat", "Buckwheat"],
  ["yeasted", "Yeasted cake"],
  ["fermented-batter", "Fermented batter"],
  ["rice-batter", "Rice batter"],
  ["lentil-batter", "Lentil batter"],
  ["cornmeal", "Cornmeal cake"],
  ["masa", "Masa cake"],
  ["potato", "Potato cake"],
  ["oat", "Oat cake"],
  ["egg-cake", "Egg skillet cake"],
  ["stuffed", "Stuffed pancake"],
  ["fritter", "Pan-fried fritter"],
  ["flatbread", "Griddled flatbread"],
  ["mold-cake", "Molded batter cake"],
  ["oven-pancake", "Oven pancake"]
];

export const HEATS = [
  ["none", "No chili heat"],
  ["mild", "Mild"],
  ["medium", "Medium"],
  ["hot", "Hot"],
  ["extra-hot", "Extra hot"]
];

export const USES = [
  ["breakfast", "Breakfast"],
  ["savory", "Savory meal"],
  ["dessert", "Dessert"],
  ["street", "Street food"],
  ["feast", "Feast or fast day"],
  ["snack", "Snack"],
  ["accompaniment", "Accompaniment to a meal"]
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
