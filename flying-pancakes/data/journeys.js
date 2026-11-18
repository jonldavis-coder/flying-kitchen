// Curated voyages. Stops are pancake slugs. Routes use each stop's own coordinates.
export const VEHICLES = {
  balloon: "Hot air balloon",
  plane: "Plane",
  train: "Train",
  boat: "Boat"
};

export const JOURNEYS = [
  {
    slug: "who-settled-the-flavor",
    title: "Who settled the flavor",
    vehicle: "train",
    dek: "A rail route across the United States, tasting the cakes settlers, immigrants, and older corn traditions left on the griddle.",
    intro: [
      "This train does not hand the country to one kitchen. It stops where a cake can be tied to a real migration, a crop, or a dispute about the name.",
      "Read the essay first if you want the argument in one place. The pancakes are the evidence."
    ],
    stops: [
      "hudson-valley-buckwheat-cakes",
      "pennsylvania-dutch-potato-pancakes",
      "pennsylvania-dutch-funnel-cakes",
      "rhode-island-johnnycakes",
      "appalachian-buckwheat-cakes",
      "appalachian-sorghum-pancakes",
      "southeastern-corn-griddle-cakes",
      "southern-hoecakes",
      "lowcountry-rice-griddle-cakes",
      "new-orleans-calas",
      "upper-midwest-swedish-pancakes",
      "hopi-piki"
    ]
  },
  {
    slug: "crepes-by-balloon",
    title: "Crepes by balloon",
    vehicle: "balloon",
    dek: "A low, slow pass over Brittany and the north of France, from wheat crepes to buckwheat galettes.",
    intro: [
      "A balloon is the right speed for this coast. The batter changes faster than the landscape: white flour and milk, then buckwheat, ham, and egg.",
      "Chandeleur, not Mardi Gras, is the French crepe day. The pages say so."
    ],
    stops: [
      "crepes-bretonnes",
      "galette-de-sarrasin",
      "galette-complete",
      "galette-saucisse",
      "ficelle-picarde",
      "normandy-apple-crepes",
      "crepes-suzette",
      "socca"
    ]
  },
  {
    slug: "butter-week-by-plane",
    title: "Butter week by plane",
    vehicle: "plane",
    dek: "Shrove Tuesday, Candlemas, and Maslenitsa. The plane is honest about the distance between these fast days.",
    intro: [
      "These are not the same holiday. England clears the pantry on Shrove Tuesday. France makes crepes at Chandeleur. Russia spends a week on blini before Lent.",
      "The plane hops the calendar as well as the map. Each page names its own day."
    ],
    stops: [
      "english-shrove-pancakes",
      "welsh-crempog",
      "irish-boxty",
      "filloas",
      "crepes-bretonnes",
      "russian-blini",
      "polish-nalesniki",
      "icelandic-ponnukokur"
    ]
  },
  {
    slug: "dosas-by-train",
    title: "Dosas by train",
    vehicle: "train",
    dek: "A rail journey through rice, urad, and gram-flour batters, from a plain dosa to a Bengali patishapta.",
    intro: [
      "South Indian fermented batters and North Indian cheelas share a griddle and not a recipe. The train is how a cook actually moves between those kitchens today.",
      "Nothing here is a single ancient mother batter. The pages keep the ferments separate."
    ],
    stops: [
      "plain-dosa",
      "masala-dosa",
      "rava-dosa",
      "neer-dosa",
      "uttapam",
      "pesarattu",
      "adai",
      "appam",
      "besan-cheela",
      "patishapta"
    ]
  },
  {
    slug: "east-asia-savory-by-plane",
    title: "East Asia's savory cakes by plane",
    vehicle: "plane",
    dek: "Jianbing, scallion pancake, okonomiyaki, and jeon. A flight, because these cities are not a day's walk apart.",
    intro: [
      "Osaka and Hiroshima do not make the same okonomiyaki. Tianjin jianbing is not a Shandong jianbing. The plane stops treat them as neighbors, not as one dish with a new sauce.",
      "This is a savory route. Dorayaki and sweet hotteok are in the journal, on another page."
    ],
    stops: [
      "tianjin-jianbing",
      "cong-you-bing",
      "osaka-okonomiyaki",
      "hiroshima-okonomiyaki",
      "pajeon",
      "kimchi-jeon",
      "bindaetteok",
      "banh-xeo"
    ]
  },
  {
    slug: "africa-coast-to-coast",
    title: "Africa coast to coast",
    vehicle: "plane",
    dek: "From a Moroccan baghrir to a South African pannekoek, with fermented batters in between.",
    intro: [
      "The coasts are not one cuisine. Baghrir, masa, injera, canjeero, and pannekoek do not descend from each other. The plane is only a way to taste them in one reading.",
      "Where a cake is tied to a trade in grain, the page says which grain."
    ],
    stops: [
      "moroccan-baghrir",
      "nigerian-masa",
      "ghanaian-tatale",
      "injera",
      "somali-canjeero",
      "kenyan-vitumbua",
      "malagasy-mofo-gasy",
      "south-african-pannekoek"
    ]
  },
  {
    slug: "caribbean-by-boat",
    title: "Caribbean by boat",
    vehicle: "boat",
    dek: "Cassava bread, johnny cakes, and plantain, moving the way these coasts actually met: by sea.",
    intro: [
      "The boat is not a costume. Cassava bread, bammy, and johnny cakes traveled with sailors, enslaved people, and later shop cooks.",
      "Bitter cassava is dangerous when it is not processed. The recipes use a commercial product and say so."
    ],
    stops: [
      "cuban-torrejas",
      "jamaican-bammy",
      "dominican-casabe",
      "dominican-yaniqueques",
      "bahamian-johnnycake",
      "puerto-rican-almojabanas",
      "trinidadian-dhalpuri"
    ]
  },
  {
    slug: "masa-and-corn-by-plane",
    title: "Masa and corn by plane",
    vehicle: "plane",
    dek: "Tortillas, pupusas, arepas, and cachapas. Corn is the thread. The plane admits the distance.",
    intro: [
      "Nixtamalized masa and fresh-corn batters are different doughs. A tortilla, a pupusa, an arepa, and a cachapa should not be swapped in a recipe and called the same cake.",
      "The route starts in Mexico and ends with a Brazilian tapioca crepe, which is not masa at all. That last hop is a reminder that the map of griddled cakes does not stop at corn."
    ],
    stops: [
      "corn-tortilla",
      "gorditas",
      "tlacoyos",
      "pupusas",
      "venezuelan-arepas",
      "cachapas",
      "colombian-arepas",
      "brazilian-tapioca"
    ]
  },
  {
    slug: "potato-road-by-train",
    title: "The potato road by train",
    vehicle: "train",
    dek: "Boxty, rösti, latkes, and raggmunk. One tuber, many batters, a slow train.",
    intro: [
      "Potatoes reached these kitchens at different times. A latke, a boxty, and a rösti are cousins, not copies.",
      "The train stays on the ground, which is how the recipes actually moved: with farmers, not with a headline."
    ],
    stops: [
      "irish-boxty",
      "lancashire-potato-cakes",
      "swiss-rosti",
      "kartoffelpuffer",
      "placki-ziemniaczane",
      "deruny",
      "potato-latkes",
      "raggmunk"
    ]
  },
  {
    slug: "scandinavia-by-boat",
    title: "Scandinavia by boat",
    vehicle: "boat",
    dek: "Lefse, svele, plättar, and aebleskiver, harbor to harbor.",
    intro: [
      "These cakes already knew the water. A boat is how rye, butter, and later cloudberries moved, and how the recipes later crossed to the Upper Midwest.",
      "The American church-basement versions are mentioned on the pages. The recipes here are the Scandinavian ones."
    ],
    stops: [
      "norwegian-lefse",
      "svele",
      "swedish-pannkakor",
      "swedish-plattar",
      "danish-pandekager",
      "aebleskiver",
      "finnish-lettu",
      "icelandic-ponnukokur"
    ]
  }
];
