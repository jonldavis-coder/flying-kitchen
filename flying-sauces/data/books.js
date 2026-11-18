export const BOOKS = [
  {
    slug: "barbecue-sauces-of-the-world",
    title: "Barbecue Sauces of the World",
    dek: "Vinegar, mustard, molasses, and white sauce. A booklet of the sauces people brush, dip, and serve with fire-cooked food.",
    intro: [
      "Barbecue sauce is not one recipe. In eastern North Carolina it can be vinegar and pepper. In Kansas City it is thick, sweet, and red. In Alabama it is mayonnaise and vinegar. Elsewhere, char siu glaze, jerk marinade, and peri-peri do the same job for grilled and roasted meat.",
      "This book gathers field-guide sauces whose main use is barbecue or the grill. Print it as one booklet. Each recipe starts on its own page."
    ],
    match: (sauce) => sauce.baseType === "barbecue" || sauce.uses.includes("barbecue")
  },
  {
    slug: "sandwich-and-burger-sauces",
    title: "Sandwich & Burger Sauces",
    dek: "The layer that keeps a sandwich from tasting like plain bread.",
    intro: [
      "A sandwich sauce has to be spreadable, sharp enough to cut fat, and stable at room temperature for as long as lunch lasts. Ketchup, mustard, fry sauce, burger sauce, and brown sauce all live here, beside remoulade, comeback sauce, and salsa golf.",
      "Regional relatives are cross-linked in the variations on each page instead of being repeated as separate recipes."
    ],
    match: (sauce) => sauce.uses.includes("sandwich")
  },
  {
    slug: "pasta-sauces",
    title: "Pasta Sauces",
    dek: "From a Roman cheese-and-pepper emulsion to a Bolognese ragù.",
    intro: [
      "Italian pasta sauces are often named for a city or a method: cacio e pepe, amatriciana, pesto alla Genovese, ragù alla Bolognese. Italian-American kitchens added Sunday gravy and vodka sauce. This book keeps those histories separate.",
      "Print the booklet for a sauce-by-sauce comparison. The field-guide page for each sauce has the longer origin note."
    ],
    match: (sauce) => sauce.uses.includes("pasta")
  },
  {
    slug: "dipping-sauces",
    title: "Dipping Sauces",
    dek: "Small bowls: nuoc cham, chimichurri, tentsuyu, toum, and their cousins.",
    intro: [
      "A dipping sauce is built to be picked up by a dumpling, a grilled skewer, a fry, or a piece of bread. Acid, salt, and chili usually do more work than a long simmer.",
      "Sauces in this book are tagged for dipping in the field guide. Many of them also work as a finishing spoonful."
    ],
    match: (sauce) => sauce.uses.includes("dipping") || sauce.baseType === "dipping-sauce"
  },
  {
    slug: "hot-sauces",
    title: "Hot Sauces",
    dek: "Chili, vinegar, garlic, and time. A booklet of sauces whose point is heat.",
    intro: [
      "Heat is a fact of the chile, not a badge. This book collects sauces marked hot or extra hot, plus sauces whose base type is hot sauce or chili paste.",
      "Where a commercial bottle is famous, the page names it as a commercial example and gives a home recipe for the style. It does not claim to copy a secret formula."
    ],
    match: (sauce) => sauce.heat === "hot" || sauce.heat === "extra-hot" || sauce.baseType === "hot-sauce" || sauce.baseType === "chili-paste"
  },
  {
    slug: "marinades",
    title: "Marinades",
    dek: "The sauces that go on before the cooking: jerk, mojo, bulgogi, cafreal, adobo.",
    intro: [
      "A marinade seasons the surface and, when it contains acid or salt, changes texture. It is still a sauce: you can boil the leftover marinade if it has touched raw meat, or reserve a portion before it does.",
      "Each recipe says what it is for. Do not reuse a marinade that has held raw meat unless you cook it through."
    ],
    match: (sauce) => sauce.baseType === "marinade" || sauce.uses.includes("marinade")
  },
  {
    slug: "dessert-sauces",
    title: "Dessert Sauces",
    dek: "Custard, caramel, chocolate, curd, and fruit, poured or spooned.",
    intro: [
      "Dessert sauces are often techniques with a new main ingredient: a custard is an emulsion of egg and milk, caramel is a controlled sugar browning, a coulis is a fruit puree.",
      "These recipes are for the table, not for shelf-stable canning."
    ],
    match: (sauce) => sauce.baseType === "dessert-sauce" || sauce.uses.includes("dessert")
  },
  {
    slug: "mother-sauces-and-classics",
    title: "The Mother Sauces & Their Children",
    dek: "The five French mother sauces and the named sauces built from them, plus a few classics from other kitchens.",
    intro: [
      "In the French system taught since the nineteenth century, five mother sauces anchor a repertoire: béchamel, velouté, espagnole, sauce tomate, and hollandaise. Mayonnaise, béarnaise, and a vinaigrette sit beside them as emulsions.",
      "A mother sauce is a method, not a claim that other cultures descend from Paris. Mole, pesto, and nuoc cham are in this book because they are classics of their own kitchens, not because they are French daughters."
    ],
    slugs: [
      "bechamel",
      "veloute",
      "espagnole",
      "sauce-tomate",
      "hollandaise",
      "mayonnaise",
      "bearnaise",
      "beurre-blanc",
      "vinaigrette",
      "demi-glace",
      "pesto-alla-genovese",
      "mole-poblano",
      "nuoc-cham"
    ]
  }
];
