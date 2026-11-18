export const BOOKS = [
  {
    slug: "breakfast-pancakes",
    title: "Breakfast Pancakes",
    dek: "The morning stack, from buttermilk cakes to dosa and plättar.",
    intro: [
      "Breakfast is a use, not a country. A Southern diner stack, a Mangalore neer dosa, and a Swedish plättar can all be the first thing on the table.",
      "Print this booklet when you want the morning recipes in one sheaf. The journal page for each cake has the longer history."
    ],
    match: (pancake) => pancake.uses.includes("breakfast")
  },
  {
    slug: "savory-pancakes",
    title: "Savory Pancakes",
    dek: "Scallion, cabbage, cheese, and chile. Cakes that stand in for the meal.",
    intro: [
      "A savory pancake is built to be dinner or a street lunch: okonomiyaki, pajeon, a buckwheat galette, a pupusa, a dosa with potato.",
      "Sweet breakfast cakes stay in the breakfast booklet unless the recipe itself is salted and filled."
    ],
    match: (pancake) => pancake.uses.includes("savory")
  },
  {
    slug: "dessert-pancakes",
    title: "Dessert Pancakes",
    dek: "Sugar, fruit, cheese, and syrup, after the meal or in the middle of a feast.",
    intro: [
      "Dessert cakes in this booklet are the ones tagged as dessert: Suzette, Kaiserschmarrn, dorayaki, malpua, and the diner stack that is mostly sugar.",
      "A feast-day pancake can also be dinner. The tag follows the recipe on the page."
    ],
    match: (pancake) => pancake.uses.includes("dessert")
  },
  {
    slug: "potato-cakes",
    title: "Potato Cakes",
    dek: "Boxty, latkes, rösti, and the other cakes that start with a potato.",
    intro: [
      "The potato is a late arrival in many of these kitchens. The cakes are not one recipe copied across a border.",
      "Shredded, mashed, and raw-and-cooked mixtures behave differently. Each page says which one it is."
    ],
    match: (pancake) => pancake.baseType === "potato"
  },
  {
    slug: "fermented-batters",
    title: "Fermented Batters",
    dek: "Injera, dosa, baghrir, kisra, and the other cakes that sour before they cook.",
    intro: [
      "Fermentation is a method. It is not proof that the cakes share an ancestor.",
      "The time on the page is a home range. A cold room will take longer, and the batter should smell sour, not rotten."
    ],
    match: (pancake) => pancake.baseType === "fermented-batter"
  },
  {
    slug: "scandinavian-griddle",
    title: "The Scandinavian Griddle",
    dek: "Plättar, lefse, svele, aebleskiver, and their neighbors.",
    intro: [
      "This booklet gathers the Northern European pages: Sweden, Norway, Denmark, Finland, Iceland, and the Åland oven pancake.",
      "The Upper Midwest versions are noted on those pages. The recipes stay with the Scandinavian kitchen."
    ],
    match: (pancake) => pancake.region === "Northern Europe"
  },
  {
    slug: "molded-batter-cakes",
    title: "Molded Batter Cakes",
    dek: "Poffertjes, aebleskiver, khanom khrok, and the other cakes cooked in a dimpled pan.",
    intro: [
      "A molded pan is a tool, not a cuisine. The Dutch, the Danes, South India, and Thailand all ended up with dimples, for different batters.",
      "Oil the cups lightly. The first round tells you whether the pan is hot enough."
    ],
    match: (pancake) => pancake.baseType === "mold-cake"
  },
  {
    slug: "hanukkah-table",
    title: "The Hanukkah Table",
    dek: "Potato latkes, cheese latkes, and blintzes. Dairy first, potatoes later.",
    intro: [
      "Ashkenazi Hanukkah food is fried, and the older dairy custom is told through the Book of Judith. Potato latkes became everyday only after potatoes spread in Eastern Europe.",
      "This is a small book on purpose. It does not collect every fried potato cake in the journal and call it a latke."
    ],
    slugs: ["potato-latkes", "farmer-cheese-latkes", "cheese-blintzes"]
  }
];
