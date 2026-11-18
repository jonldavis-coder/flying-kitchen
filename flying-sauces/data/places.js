import { continentOf } from "./vocabulary.js";

const SOUTH = new Set([
  "eastern-north-carolina-bbq-sauce",
  "lexington-bbq-sauce",
  "south-carolina-mustard-bbq",
  "alabama-white-sauce",
  "memphis-bbq-sauce",
  "nashville-hot-oil",
  "sausage-gravy",
  "red-eye-gravy",
  "comeback-sauce",
  "creole-sauce",
  "louisiana-remoulade",
  "louisiana-hot-sauce",
  "texas-mop-sauce",
  "chocolate-gravy",
  "chow-chow",
  "sorghum-glaze",
  "tomato-gravy",
  "cajun-brown-gravy",
  "datil-pepper-sauce"
]);

const EAST = new Set([
  "buffalo-sauce",
  "cranberry-sauce",
  "white-clam-sauce",
  "vodka-sauce",
  "sunday-gravy",
  "general-tso-sauce",
  "drawn-butter",
  "hot-bacon-dressing"
]);

const NORTH = new Set([
  "thousand-island",
  "detroit-coney-sauce",
  "cincinnati-chili-sauce",
  "chicago-giardiniera",
  "wisconsin-beer-cheese",
  "michigan-olive-burger-sauce"
]);

const ENGLAND = new Set([
  "mint-sauce",
  "bread-sauce",
  "cumberland-sauce",
  "horseradish-sauce",
  "worcestershire-sauce",
  "apple-sauce",
  "onion-gravy",
  "marie-rose-sauce",
  "piccalilli",
  "lemon-curd",
  "chip-shop-curry-sauce",
  "coronation-dressing",
  "tikka-masala-sauce"
]);

const IRELAND = new Set([
  "parsley-sauce",
  "guinness-gravy",
  "irish-whiskey-sauce",
  "corned-beef-mustard-sauce"
]);

export const PLACES = [
  { slug: "southern-united-states", title: "Southern United States", dek: "Vinegar, mustard, pepper, and gravy from Carolina to the Gulf.", match: (s) => SOUTH.has(s.slug) },
  { slug: "eastern-united-states", title: "Eastern United States", dek: "New England, New York, and the Chesapeake.", match: (s) => EAST.has(s.slug) },
  { slug: "northern-united-states", title: "Northern United States", dek: "Great Lakes and Upper Midwest sauces.", match: (s) => NORTH.has(s.slug) },
  { slug: "ireland", title: "Ireland", dek: "Parsley, Guinness, whiskey, and mustard on the Irish table.", match: (s) => IRELAND.has(s.slug) },
  { slug: "england", title: "England", dek: "Mint, mustard, bread sauce, and the roast-dinner table.", match: (s) => ENGLAND.has(s.slug) },
  { slug: "africa", title: "Africa", dek: "Sauces from several African countries, not one kitchen.", match: (s) => continentOf(s.region) === "Africa" },
  { slug: "india", title: "India", dek: "Chutneys, dals, and regional curries.", match: (s) => s.countryCode === "IN" },
  { slug: "south-korea", title: "South Korea", dek: "Soy marinades, gochujang, and the grill.", match: (s) => s.countryCode === "KR" },
  { slug: "japan", title: "Japan", dek: "Soy, mirin, sesame, and curry roux.", match: (s) => s.countryCode === "JP" },
  { slug: "china", title: "China", dek: "From Sichuan chile bean paste to Cantonese glazes. Hong Kong is included.", match: (s) => s.countryCode === "CN" || s.countryCode === "HK" },
  { slug: "cuba", title: "Cuba", dek: "Mojo criollo, sofrito, and the sauces of the Cuban table.", match: (s) => s.countryCode === "CU" },
  { slug: "mexico", title: "Mexico", dek: "Salsa, mole, recado, and the chile sauces of Mexico.", match: (s) => s.countryCode === "MX" },
  { slug: "spain", title: "Spain", dek: "Romesco, mojo, and the sauces of the Spanish coast.", match: (s) => s.countryCode === "ES" },
  { slug: "south-america", title: "South America", dek: "Chile sauces and table relishes from several countries.", match: (s) => s.region === "South America" }
];

export function placeSlugsFor(sauce) {
  return PLACES.filter((place) => place.match(sauce)).map((place) => place.slug);
}
