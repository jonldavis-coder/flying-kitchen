// Curated voyages. Stops are sauce slugs. Routes are approximate map legs, not GPS tracks.
export const VEHICLES = {
  balloon: "Hot air balloon",
  plane: "Plane",
  train: "Train",
  boat: "Boat"
};

export const JOURNEYS = [
  {
    slug: "silk-road-by-train",
    title: "Silk Road by train",
    vehicle: "train",
    dek: "A rail journey from Persian walnut sauce to the noodle shops of eastern China.",
    intro: [
      "The Silk Road was a set of trade routes, not one track. Walnut, spice, wheat, and fermented soy moved along it, and the sauces at these stops still taste of that traffic.",
      "This leg is by train: slow enough to taste the change from pomegranate and walnut to soy, chile bean paste, and scallion oil."
    ],
    stops: ["fesenjan", "afghan-cilantro-chutney", "dumpling-sauce", "hoisin-sauce", "scallion-oil"],
    route: [[35.7, 51.4], [34.5, 69.2], [34.3, 108.9], [39.9, 116.4], [31.2, 121.5]]
  },
  {
    slug: "caribbean-by-boat",
    title: "Caribbean by boat",
    vehicle: "boat",
    dek: "Island to island: sour orange, allspice, pepper, and herb pastes.",
    intro: [
      "Caribbean sauces traveled by sea. Sour orange and garlic, scotch bonnet, vinegar pickles, and herb pastes are dockside food.",
      "This leg is by boat, the way these flavors actually moved between islands."
    ],
    stops: ["cuban-mojo", "jerk-marinade", "haitian-epis", "puerto-rican-sofrito", "trinidad-pepper-sauce", "sauce-chien", "wasakaka"],
    route: [[23.1, -82.4], [18.0, -76.8], [18.5, -72.3], [18.5, -69.9], [18.4, -66.1], [14.6, -61.1], [10.7, -61.5]]
  },
  {
    slug: "across-the-american-south",
    title: "Across the American South",
    vehicle: "train",
    dek: "Vinegar, mustard, mayonnaise, and pepper, from Carolina to the Gulf.",
    intro: [
      "Southern barbecue is not one sauce. Vinegar in the east, a little tomato in the Piedmont, mustard in the Midlands, white sauce in Alabama, and a thinner tomato sauce in Memphis.",
      "The leg runs by train across that map, with Gulf pepper and gravy at the end of the line."
    ],
    stops: [
      "eastern-north-carolina-bbq-sauce",
      "lexington-bbq-sauce",
      "south-carolina-mustard-bbq",
      "alabama-white-sauce",
      "memphis-bbq-sauce",
      "nashville-hot-oil",
      "comeback-sauce",
      "creole-sauce",
      "louisiana-hot-sauce"
    ],
    route: [[35.4, -77.9], [35.8, -80.3], [34.0, -81.0], [34.6, -87.0], [35.1, -90.0], [36.2, -86.8], [32.3, -90.2], [29.95, -90.07], [30.22, -92.02]]
  },
  {
    slug: "mediterranean-by-balloon",
    title: "Mediterranean by balloon",
    vehicle: "balloon",
    dek: "A low, slow pass over nut sauces, basil, oregano, and chermoula.",
    intro: [
      "A balloon is the right speed for this coast. The sauces change with the harbor: dried pepper and nuts, garlic and oil, basil, oregano and lemon, then cumin and cilantro.",
      "Nothing here is a fast transfer. The point is how close these kitchens are, and how different the jars still are."
    ],
    stops: ["romesco", "aioli", "pesto-alla-genovese", "salmoriglio", "chermoula"],
    route: [[41.1, 1.25], [43.3, 5.4], [44.4, 8.9], [37.5, 14.2], [33.6, -7.6]]
  },
  {
    slug: "mexico-to-the-andes",
    title: "Mexico to the Andes",
    vehicle: "plane",
    dek: "A flight from mole and achiote to the chile sauces of the Andes.",
    intro: [
      "Chile is the thread, and the plane is the honest way to cover this distance. Puebla’s mole, Yucatán’s achiote paste, then the raw and cooked chile sauces of the Andes.",
      "Each stop uses a different chile and a different thickener: nuts and seeds, annatto and sour orange, then ají and herbs."
    ],
    stops: ["mole-poblano", "salsa-verde-tomatillo", "recado-rojo", "ecuadorian-aji", "aji-amarillo-sauce", "ocopa", "pebre"],
    route: [[19.04, -98.2], [19.43, -99.13], [20.97, -89.6], [-0.18, -78.47], [-12.05, -77.04], [-16.4, -71.54], [-33.45, -70.66]]
  }
];

export function journeyFor(slug) {
  return JOURNEYS.find((journey) => journey.stops.includes(slug)) || null;
}

export function nextOnJourney(slug, known) {
  const journey = journeyFor(slug);
  if (!journey) return null;
  const stops = journey.stops.filter((stop) => known.has(stop));
  const index = stops.indexOf(slug);
  if (index === -1 || stops.length < 2) return null;
  const next = stops[(index + 1) % stops.length];
  return { slug: next, journey };
}
