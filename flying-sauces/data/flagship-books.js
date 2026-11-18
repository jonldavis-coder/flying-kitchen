const route = (pairs) => pairs;

export const FLAGSHIP_BOOKS = [
  {
    slug: "top-100-sauces",
    title: "Flying Sauces: The Top 100 Sauces of the World",
    dek: "A reading route through a hundred sauces chosen for reach and usefulness, not a prize list.",
    tier: "top",
    vehicle: "plane",
    selectionNote: "This is not a ranking and not an official list. The hundred were chosen for cultural significance and global reach: sauces that traveled, that explain a technique, or that a cook meets far from the place they started. The order is a reading route. Another editor would pick a different hundred.",
    intro: [
      "These hundred sauces are a route, not a contest. Each one is already in the field guide. Nothing was invented to fill a slot.",
      "The route moves across the continents those sauces actually come from. The number of continents is counted from this list, not set in advance."
    ],
    slugs: [
      "bechamel", "veloute", "espagnole", "sauce-tomate", "hollandaise", "mayonnaise", "bearnaise", "beurre-blanc", "demi-glace", "vinaigrette",
      "pesto-alla-genovese", "marinara", "ragu-alla-bolognese", "carbonara", "cacio-e-pepe", "amatriciana", "puttanesca", "bagna-cauda", "romesco", "aioli",
      "tzatziki", "ajvar", "skordalia", "worcestershire-sauce", "mint-sauce", "pol-sambol",
      "harissa", "chermoula", "shito", "maafe", "yassa", "peri-peri-sauce", "chakalaka", "awaze", "ata-din-din", "egusi-sauce",
      "hummus", "toum", "tahini-sauce", "muhammara", "zhug", "fesenjan", "amba",
      "nuoc-cham", "hoisin-sauce", "dumpling-sauce", "mapo-sauce", "yuxiang-sauce", "char-siu-sauce", "xo-sauce",
      "teriyaki-sauce", "ponzu", "tonkatsu-sauce", "japanese-curry-sauce", "goma-dare",
      "ssamjang", "bulgogi-sauce", "yangnyeom-sauce",
      "green-curry", "red-curry", "massaman-curry", "pad-thai-sauce", "sriracha", "nam-pla-prik",
      "sambal-oelek", "kecap-manis", "bumbu-kacang",
      "makhani-sauce", "vindaloo-sauce", "raita", "mango-chutney", "sambar", "kasundi",
      "mole-poblano", "mole-negro", "salsa-roja", "salsa-verde-tomatillo", "pico-de-gallo", "guacamole", "recado-rojo",
      "chimichurri", "pebre", "aji-amarillo-sauce", "llajwa", "hogao", "salsa-golf",
      "cuban-mojo", "jerk-marinade", "ketchup", "buffalo-sauce", "ranch-dressing", "caesar-dressing",
      "alabama-white-sauce", "eastern-north-carolina-bbq-sauce", "kansas-city-bbq-sauce", "cranberry-sauce", "louisiana-remoulade",
      "samoan-miti", "hawaiian-chili-pepper-water", "feijoa-chutney"
    ]
  },
  {
    slug: "across-the-american-south",
    title: "Across the American South",
    dek: "A train route of vinegar, mustard, pepper, and Gulf sauces.",
    tier: "flagship",
    vehicle: "train",
    route: [[35.4, -77.9], [35.8, -80.3], [34.0, -81.0], [34.6, -87.0], [35.1, -90.0], [36.2, -86.8], [32.3, -90.2], [29.95, -90.05]],
    intro: [
      "Southern barbecue is a map. Eastern North Carolina is vinegar and pepper. Lexington adds a little tomato. The South Carolina Midlands use mustard. Alabama’s white sauce is mayonnaise. Memphis is a thinner tomato sauce.",
      "Enslaved West African cooks and their descendants shaped Southern pits and pepper sauces. English and Scottish settlers brought vinegar habits. German settlement in the Midlands is the usual account of the mustard sauce. This book follows that route and does not pretend one gravy belongs to one people only."
    ],
    slugs: [
      "eastern-north-carolina-bbq-sauce",
      "lexington-bbq-sauce",
      "south-carolina-mustard-bbq",
      "alabama-white-sauce",
      "memphis-bbq-sauce",
      "nashville-hot-oil",
      "comeback-sauce",
      "creole-sauce",
      "louisiana-remoulade",
      "louisiana-hot-sauce",
      "sausage-gravy",
      "red-eye-gravy"
    ]
  },
  {
    slug: "silk-road-by-train",
    title: "The Silk Road by Train",
    dek: "Walnut and pomegranate, then chile, soy, and scallion oil.",
    tier: "flagship",
    vehicle: "train",
    route: [[35.7, 51.4], [34.5, 69.2], [34.3, 108.9], [39.9, 116.4], [31.2, 121.5]],
    intro: [
      "The Silk Road was many routes. Walnuts, spices, wheat, and later chile moved along them. This book is a train reading of that idea, using only sauces in the field guide.",
      "It starts with Persian fesenjan, crosses an Afghan herb chutney, and ends in Chinese dipping sauces and scallion oil. It is a route, not a claim that one capital invented the others."
    ],
    slugs: ["fesenjan", "afghan-cilantro-chutney", "dumpling-sauce", "hoisin-sauce", "scallion-oil", "mapo-sauce", "yuxiang-sauce"]
  },
  {
    slug: "island-hopping-by-boat",
    title: "Island Hopping by Boat",
    dek: "Caribbean and Pacific sauces that moved by sea.",
    tier: "flagship",
    vehicle: "boat",
    route: [[23.1, -82.4], [18.0, -76.8], [18.5, -72.3], [18.4, -66.1], [10.7, -61.5], [14.6, -61.1], [18.5, -69.9], [-13.8, -172.1], [21.3, -157.8], [-41.3, 174.8]],
    intro: [
      "These sauces belong to islands. Sour orange and garlic in Cuba, allspice and scotch bonnet in Jamaica, herb pastes in Haiti and Puerto Rico, pepper sauce in Trinidad, coconut and chile farther into the Pacific.",
      "The boat is the vehicle because that is how these flavors moved. New Zealand’s feijoa chutney is the last Pacific stop in the guide, a home preserve, not a canoe-era sauce."
    ],
    slugs: [
      "cuban-mojo",
      "jerk-marinade",
      "haitian-epis",
      "puerto-rican-sofrito",
      "trinidad-pepper-sauce",
      "sauce-chien",
      "wasakaka",
      "samoan-miti",
      "hawaiian-chili-pepper-water",
      "feijoa-chutney"
    ]
  },
  {
    slug: "fire-and-heat",
    title: "Fire & Heat: Hot Sauces of the World",
    dek: "A short book of hot sauces chosen for how widely they are used.",
    tier: "flagship",
    vehicle: "plane",
    intro: [
      "Heat here means chile. This is a short list of hot sauces and pastes that traveled, not every chile sauce in the guide. The full hot shelf is the field booklet Hot Sauces.",
      "Vinegar, fermented paste, and fresh chile are different kinds of heat. The recipes keep them separate."
    ],
    slugs: [
      "harissa", "sriracha", "sambal-oelek", "louisiana-hot-sauce", "peri-peri-sauce", "nam-pla-prik",
      "buffalo-sauce", "trinidad-pepper-sauce", "zhug", "shito", "adjika", "nashville-hot-oil", "xnipec", "datil-pepper-sauce"
    ]
  },
  {
    slug: "appalachian-sauces",
    title: "Appalachian Sauces",
    dek: "Biscuit gravies, sorghum, and chow-chow from the upland South.",
    tier: "regional",
    vehicle: "train",
    intro: [
      "Appalachian sauces in this book are the ones that can be tied to a real pot: red-eye gravy, sausage gravy (sometimes called sawmill gravy), chocolate gravy, tomato gravy, sorghum glaze, and chow-chow.",
      "Scots-Irish and English settlers brought biscuit and vinegar habits into the mountains in the eighteenth century. German-speaking settlers, often by way of Pennsylvania, brought sweet-sour pickling. Enslaved people and later Black Appalachian cooks worked the same farms and kitchens. Their labor is part of this food, not a footnote.",
      "Cherokee and other Native nations of these mountains grew corn and foraged long before those settlements. This book does not assign chocolate gravy, chow-chow, or sorghum glaze to them. Those recipes are later mountain home cooking. No Cherokee sauce is invented here to fill a gap."
    ],
    slugs: ["red-eye-gravy", "sausage-gravy", "chocolate-gravy", "tomato-gravy", "sorghum-glaze", "chow-chow"]
  },
  {
    slug: "cajun-and-creole",
    title: "Cajun & Creole Louisiana",
    dek: "Dark roux, Creole tomato, and a spicy rémoulade.",
    tier: "regional",
    vehicle: "boat",
    intro: [
      "Creole cooking in New Orleans drew on French and Spanish colonial kitchens, West African cooking carried by enslaved people, Caribbean links, and Native American ingredients such as filé. Cajun cooking grew among Acadian exiles in rural southwest Louisiana. The usual distinction is city tomato and butter against a darker rural roux. It is a useful distinction, not a wall.",
      "This book holds the Louisiana sauces in the guide: Creole sauce, Louisiana rémoulade, cayenne hot sauce, and Cajun brown gravy. Gumbo is a stew and is not rewritten here as a sauce."
    ],
    slugs: ["creole-sauce", "louisiana-remoulade", "louisiana-hot-sauce", "cajun-brown-gravy"]
  },
  {
    slug: "new-england-shore",
    title: "New England Shore",
    dek: "Drawn butter, cranberry, and a later clam sauce.",
    tier: "regional",
    vehicle: "boat",
    intro: [
      "English Puritan settlers in the seventeenth century met a cold coast: dairy, cod, lobster, and native cranberry bogs already used by Wampanoag and other Native people. Drawn butter and cranberry sauce are the shore sauces in this guide.",
      "White clam sauce is later Italian-American cooking on the same water. It is included so the book does not pretend the shore stopped in 1700. The sweet boiled cranberry sauce of Thanksgiving is a domestic American habit, not a menu from 1621."
    ],
    slugs: ["drawn-butter", "cranberry-sauce", "white-clam-sauce"]
  },
  {
    slug: "british-isles",
    title: "Flavors of the British Isles",
    dek: "Mint, mustard, bread sauce, and the roast-dinner table.",
    tier: "regional",
    vehicle: "train",
    intro: [
      "This book is the English and British table sauces in the guide: mint, bread sauce, Cumberland, horseradish, Worcestershire, apple, onion gravy, piccalilli, and the chip-shop and coronation sauces.",
      "Ireland does not yet have its own entries here. Rather than borrow English mint sauce and call it Irish, this book stays with the sauces that are actually written."
    ],
    slugs: [
      "mint-sauce", "bread-sauce", "cumberland-sauce", "horseradish-sauce", "worcestershire-sauce",
      "apple-sauce", "onion-gravy", "piccalilli", "marie-rose-sauce", "chip-shop-curry-sauce",
      "coronation-dressing", "lemon-curd", "tikka-masala-sauce"
    ]
  },
  {
    slug: "east-asia",
    title: "East Asia: China, Japan, and Korea",
    dek: "Soy, chile bean paste, mirin, and gochujang.",
    tier: "regional",
    vehicle: "boat",
    intro: [
      "China, Japan, and Korea share soy and diverge immediately. This book keeps the sauces in the guide that show those differences: Sichuan chile bean paste, Cantonese glazes, Japanese soy and mirin, and Korean pastes and marinades.",
      "Hong Kong’s XO sauce is included as a Hong Kong sauce, not as an ancient Chinese one."
    ],
    slugs: [
      "mapo-sauce", "yuxiang-sauce", "dumpling-sauce", "hoisin-sauce", "char-siu-sauce", "scallion-oil", "xo-sauce",
      "teriyaki-sauce", "ponzu", "tonkatsu-sauce", "goma-dare", "japanese-curry-sauce",
      "ssamjang", "bulgogi-sauce", "yangnyeom-sauce"
    ]
  },
  {
    slug: "indias-regional-sauces",
    title: "India’s Regional Sauces",
    dek: "Chutney, sambar, kasundi, and a Goan vindaloo.",
    tier: "regional",
    vehicle: "train",
    intro: [
      "India is not one curry. These sauces are the regional ones in the guide: a Hyderabadi salan is not here, but sambar, rasam, kasundi, coconut chutney, vindaloo, and makhani are.",
      "Tikka masala is not in this book. It is a British restaurant sauce and lives with the British Isles book."
    ],
    slugs: [
      "sambar", "rasam", "kasundi", "coconut-chutney", "mint-coriander-chutney", "tamarind-date-chutney",
      "mango-chutney", "raita", "kadhi", "vindaloo-sauce", "makhani-sauce", "mirchi-ka-salan", "cafreal-marinade"
    ]
  },
  {
    slug: "africa-coast-to-coast",
    title: "Africa Coast to Coast",
    dek: "A route across several African countries, not one sauce for a continent.",
    tier: "regional",
    vehicle: "plane",
    intro: [
      "This book only includes African sauces that are in the guide, and it names the country on each one. Harissa is Tunisian. Chermoula is Moroccan. Shito is Ghanaian. Maafe is Sahelian. There is no single African sauce.",
      "The plane is just the device that makes a long route readable. The kitchens are not the same."
    ],
    slugs: [
      "chermoula", "harissa", "filfel-chuma", "koshari-sauce", "shito", "maafe", "yassa",
      "ata-din-din", "egusi-sauce", "peri-peri-sauce", "awaze", "chakalaka"
    ]
  },
  {
    slug: "latin-america-and-cuba",
    title: "Latin America & Cuba",
    dek: "Chile sauces from Mexico, the Andes, and the Caribbean, with Cuba’s mojo.",
    tier: "regional",
    vehicle: "plane",
    intro: [
      "Latin America is many sauce families. This book follows ones in the guide: Mexican salsa and mole, Cuban mojo, and the table sauces of Argentina, Peru, Bolivia, Chile, and Colombia.",
      "Cuba is included through mojo, not by folding it into Mexican salsa. They share Spanish words and not recipes."
    ],
    slugs: [
      "salsa-roja", "salsa-verde-tomatillo", "pico-de-gallo", "guacamole", "mole-poblano", "recado-rojo",
      "cuban-mojo", "chimichurri", "aji-amarillo-sauce", "llajwa", "pebre", "hogao", "salsa-golf"
    ]
  },
  {
    slug: "spain-and-the-mediterranean",
    title: "Spain & the Mediterranean",
    dek: "Romesco, mojo, aioli, pesto, and chermoula along one coast.",
    tier: "regional",
    vehicle: "balloon",
    route: [[41.1, 1.25], [28.1, -15.4], [43.3, 5.4], [44.4, 8.9], [37.5, 14.2], [33.6, -7.6]],
    intro: [
      "Spain’s sauces in the guide are romesco, salsa brava, the two Canarian mojos, and salsa vizcaína. The balloon then drifts to Provençal aioli, Genoese pesto, Sicilian salmoriglio, and Moroccan chermoula.",
      "They share olive oil and garlic in places. They are not one Mediterranean sauce."
    ],
    slugs: ["romesco", "salsa-brava", "mojo-rojo", "mojo-verde", "salsa-vizcaina", "aioli", "pesto-alla-genovese", "salmoriglio", "chermoula"]
  },
  {
    slug: "tex-mex-and-the-borderlands",
    title: "Tex-Mex & the Borderlands",
    dek: "New Mexico chile, salsa, and a Central Texas mop.",
    tier: "regional",
    vehicle: "train",
    intro: [
      "Chile was grown in the Americas long before Spanish settlement. New Mexico’s red and green chile sauces are the borderland expression of that crop in this guide. Mexican salsas and mole are the related sauces across the border and are labeled Mexican.",
      "Central Texas barbecue mop is a different history: German and Czech meat markets, salt, pepper, and a thin vinegar basting sauce. It is in this book so it is not mistaken for a salsa."
    ],
    slugs: [
      "new-mexico-red-chile",
      "new-mexico-green-chile",
      "salsa-roja",
      "salsa-verde-tomatillo",
      "guacamole",
      "pico-de-gallo",
      "chipotle-adobo",
      "texas-mop-sauce"
    ]
  }
];
