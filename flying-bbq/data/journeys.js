// Curated voyages. Stops are dish slugs. Routes use the stop coordinates, not a GPS track.
export const VEHICLES = {
  "balloon": "Hot air balloon",
  "plane": "Plane",
  "train": "Train",
  "boat": "Boat"
};

export const JOURNEYS = [
  {
    "slug": "american-bbq-belt",
    "title": "The American BBQ Belt by train",
    "vehicle": "train",
    "dek": "Vinegar, mustard, white sauce, and post oak, from eastern North Carolina to South Texas.",
    "intro": [
      "This train does not pretend the South has one barbecue. It stops where the wood, the animal, and the sauce actually change.",
      "Eastern North Carolina chops a whole hog with vinegar and pepper. Lexington reddens a shoulder dip with a little tomato. The South Carolina Midlands reach for mustard. Alabama’s white sauce is mayonnaise. Memphis leaves the ribs dry. Owensboro cooks mutton. St. Louis and Chicago cut the shoulder into steaks and tips. Kansas City cubes the brisket point. Texas, at the end of the line, salts beef and, in the south of the state, pits a head.",
      "The leg is by train because that is how these regions once sat on the same map of rails, markets, and moving cooks. It is a reading route, not a timetable."
    ],
    "stops": [
      "eastern-nc-whole-hog",
      "lexington-pork-shoulder",
      "south-carolina-mustard-pork",
      "alabama-white-chicken",
      "memphis-dry-ribs",
      "kentucky-mutton",
      "st-louis-pork-steaks",
      "chicago-rib-tips",
      "kansas-city-burnt-ends",
      "east-texas-chopped-beef",
      "central-texas-brisket",
      "south-texas-barbacoa"
    ],
    "route": [
      [
        35.4724,
        -77.4164
      ],
      [
        35.824,
        -80.2534
      ],
      [
        34.0007,
        -81.0348
      ],
      [
        34.6059,
        -86.9833
      ],
      [
        35.1495,
        -90.049
      ],
      [
        37.7719,
        -87.1112
      ],
      [
        38.627,
        -90.1994
      ],
      [
        41.768,
        -87.625
      ],
      [
        39.0997,
        -94.5786
      ],
      [
        32.5449,
        -94.3674
      ],
      [
        29.8849,
        -97.67
      ],
      [
        25.9018,
        -97.4975
      ]
    ]
  },
  {
    "slug": "caribbean-by-boat",
    "title": "Caribbean by boat",
    "vehicle": "boat",
    "dek": "Mojo, jerk, and island pigs, harbor to harbor.",
    "intro": [
      "These fires moved by sea. Sour orange and garlic in Cuba, allspice and scotch bonnet in Jamaica, a boucan in Haiti, wasakaka in the Dominican Republic, lechón in Puerto Rico, chadon beni in Trinidad, flying fish in Barbados.",
      "The boat is the vehicle because that is how pigs, chile, and citrus actually traveled. Each stop is its own kitchen."
    ],
    "stops": [
      "cuban-lechon-asado",
      "jamaican-jerk-chicken",
      "haitian-boukannen",
      "dominican-wasakaka-chicken",
      "puerto-rican-lechon",
      "trinidad-grilled-kingfish",
      "barbados-grilled-flying-fish"
    ],
    "route": [
      [
        21.929,
        -79.443
      ],
      [
        18.164,
        -76.332
      ],
      [
        18.594,
        -72.307
      ],
      [
        18.486,
        -69.931
      ],
      [
        18.113,
        -66.166
      ],
      [
        10.66,
        -61.508
      ],
      [
        13.063,
        -59.539
      ]
    ]
  },
  {
    "slug": "asado-by-plane",
    "title": "Asado and churrasco by plane",
    "vehicle": "plane",
    "dek": "A flight across the southern fires, from the parrilla to picanha.",
    "intro": [
      "The distance from a Buenos Aires parrilla to a Brazilian picanha skewer is a plane ride, not a stroll. The fire idea is shared. The cuts are not.",
      "This route starts with an Argentine asado, crosses the Río de la Plata, looks south to a Patagonian lamb, steps into a Chilean asado, and ends on Brazilian picanha. It is not a ranking of who grills better."
    ],
    "stops": [
      "argentine-asado",
      "uruguayan-asado-al-espeto",
      "patagonian-cordero-al-asador",
      "chilean-asado",
      "brazilian-picanha"
    ],
    "route": [
      [
        -34.25,
        -59.47
      ],
      [
        -32.317,
        -58.076
      ],
      [
        -50.338,
        -72.265
      ],
      [
        -33.449,
        -70.669
      ],
      [
        -30.035,
        -51.218
      ]
    ]
  },
  {
    "slug": "mediterranean-by-balloon",
    "title": "Mediterranean by balloon",
    "vehicle": "balloon",
    "dek": "A low pass over sardines, calçots, vine shoots, and a spit.",
    "intro": [
      "A balloon is the right speed for this coast. The fire changes with the harbor: sardines on a Malaga beach, spring onions in Catalonia, lamb chops over Rioja vine cuttings, June sardines in Lisbon, an Easter lamb in Greece, a hand-minced kebab in Adana.",
      "Nothing here is a fast transfer. The point is how close these shores are, and how different the grills still are."
    ],
    "stops": [
      "spanish-espetos",
      "spanish-calcots",
      "spanish-chuletillas",
      "portuguese-sardines",
      "greek-spit-lamb",
      "turkish-adana-kebab"
    ],
    "route": [
      [
        36.72,
        -4.42
      ],
      [
        41.29,
        1.25
      ],
      [
        42.58,
        -2.85
      ],
      [
        38.72,
        -9.14
      ],
      [
        37.57,
        22.8
      ],
      [
        37.0,
        35.32
      ]
    ]
  },
  {
    "slug": "africa-by-plane",
    "title": "Africa's fires by plane",
    "vehicle": "plane",
    "dek": "Mechoui, dibi, suya, nyama choma, and a braai.",
    "intro": [
      "Africa does not have one grill. This flight is a way to taste how far the fires sit from each other: a Moroccan celebration lamb, a Dakar street dibi, Hausa suya, a Ghanaian tilapia, Kenyan nyama choma, Mozambican peri-peri chicken, and a South African braai sausage.",
      "The plane is honest about the distance. It is not a claim that one coast taught the others."
    ],
    "stops": [
      "moroccan-mechoui",
      "senegalese-dibi",
      "nigerian-suya",
      "ghanaian-grilled-tilapia",
      "kenyan-nyama-choma",
      "mozambican-peri-peri-chicken",
      "south-african-boerewors"
    ],
    "route": [
      [
        31.63,
        -8.01
      ],
      [
        14.72,
        -17.47
      ],
      [
        12.0,
        8.52
      ],
      [
        5.56,
        -0.21
      ],
      [
        -1.29,
        36.82
      ],
      [
        -25.97,
        32.57
      ],
      [
        -26.2,
        28.05
      ]
    ]
  },
  {
    "slug": "pacific-by-boat",
    "title": "Pacific earth ovens by boat",
    "vehicle": "boat",
    "dek": "Imu, lovo, umu, and hāngi. Related heat, separate peoples.",
    "intro": [
      "An earth oven holds heat in the ground. Hawaiʻi, Fiji, Samoa, Tonga, and Aotearoa use that idea under different names, with different foods and different obligations.",
      "The boat is the old way between these islands. A home pot in this journal is labeled as a home pot. It is not an imu, a lovo, an umu, or a marae hāngi."
    ],
    "stops": [
      "kalua-pig",
      "fijian-lovo",
      "samoan-umu",
      "tongan-umu",
      "maori-hangi"
    ],
    "route": [
      [
        19.7297,
        -155.09
      ],
      [
        -18.141,
        178.441
      ],
      [
        -13.833,
        -171.766
      ],
      [
        -21.139,
        -175.205
      ],
      [
        -38.137,
        176.25
      ]
    ]
  },
  {
    "slug": "asian-grills-by-plane",
    "title": "Asian grills by plane",
    "vehicle": "plane",
    "dek": "Cumin lamb, char siu, galbi, yakitori, gai yang, satay, and lechón.",
    "intro": [
      "This is a long flight on purpose. Xinjiang lamb skewers, a Beijing duck, Cantonese char siu, Korean galbi, yakitori, Isaan grilled chicken, Malaysian satay, and a Cebu lechón do not belong to one cuisine.",
      "The plane is just how a reader covers that distance. Each stop keeps its own wood, sugar, and rule for doneness."
    ],
    "stops": [
      "xinjiang-lamb-skewers",
      "peking-duck",
      "char-siu",
      "korean-galbi",
      "japanese-yakitori",
      "thai-gai-yang",
      "malaysian-satay-ayam",
      "filipino-lechon"
    ],
    "route": [
      [
        43.825,
        87.617
      ],
      [
        39.904,
        116.407
      ],
      [
        23.13,
        113.264
      ],
      [
        37.263,
        127.029
      ],
      [
        35.682,
        139.759
      ],
      [
        15.229,
        104.857
      ],
      [
        2.993,
        101.788
      ],
      [
        10.307,
        123.886
      ]
    ]
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
