export const BOOKS = [
  {
    slug: "rubs-mops-and-sauces",
    title: "Rubs, Mops & Sauces",
    dek: "The dry coats, thin mops, and table sauces that travel with the fire.",
    intro: [
      "A rub is salt and spice on the surface. A mop is a thin liquid during the cook. A sauce may be the whole point, as in eastern North Carolina, or a bowl on the side, as in many Central Texas markets.",
      "This booklet is every passport entry whose method is a sauce or a rub. Print it when you want the seasonings without the whole animal."
    ],
    match: (dish) => dish.baseType === "sauce" || dish.baseType === "rub"
  },
  {
    slug: "sides-of-the-pit",
    title: "Sides of the Pit",
    dek: "Beans, slaw, bread, and the plates that show up beside the meat.",
    intro: [
      "A pit has a table. Pinto beans, vinegar slaw, pap, farofa, elote, and banana pudding are not the same idea, and they are not all cooked on the fire.",
      "Each page says whether the side is grilled, boiled, baked, or fried. Fried sides are labeled as fried."
    ],
    match: (dish) => dish.baseType === "side"
  },
  {
    slug: "seafood-on-the-coals",
    title: "Seafood on the Coals",
    dek: "Fish, oysters, lobster, and the fires that suit them.",
    intro: [
      "Fish wants a hot, clean fire and a thermometer that reaches 145°F (63°C). Shellfish should turn opaque.",
      "This booklet gathers passport entries tagged as fish or shellfish, including a few smokehouse fishes that are not grilled."
    ],
    match: (dish) => dish.uses.includes("fish") || dish.uses.includes("seafood")
  },
  {
    slug: "skewers-of-the-world",
    title: "Skewers of the World",
    dek: "Suya, souvlaki, satay, anticuchos, yakitori, and their cousins.",
    intro: [
      "A skewer is a method and a portion. What changes is the meat, the fat, the spice, and whether a sauce is dipped or painted on.",
      "Ground meat on a stick is cooked to the ground-meat temperature. Whole muscles are cooked to theirs. The pages do not swap those numbers."
    ],
    match: (dish) => dish.baseType === "skewer"
  }
];
