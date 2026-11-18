import fs from "node:fs";

const STORAGE = "Refrigerate leftovers within 2 hours and use within 3 to 4 days, or freeze. Reheat leftovers to 165°F (74°C).";

const SAFETY = {
  brisket: "Whole beef is safe at 145°F (63°C) with a 3-minute rest. For brisket that slices instead of bouncing, keep cooking until the thickest part of the flat is about 195–205°F (90–96°C) and a probe slides in with little resistance, then rest it.",
  "pork-shoulder": "Whole pork is safe at 145°F (63°C) with a 3-minute rest. For pulled or chopped pork, continue to about 195–205°F (90–96°C) so the collagen softens, then rest it.",
  ribs: "Pork ribs are safe at 145°F (63°C) after a 3-minute rest. For tender ribs, cook until the meat has pulled back from the ends of the bones, often around 195–203°F (90–95°C).",
  poultry: "Cook poultry to 165°F (74°C) in the thickest part, not touching bone.",
  "ground-poultry": "Cook ground poultry and sausages made from it to 165°F (74°C).",
  ground: "Cook ground meat, including fresh sausages, to 160°F (71°C).",
  whole: "Cook whole cuts of beef, pork, lamb, or goat to at least 145°F (63°C) and rest 3 minutes. A shoulder you want to pull can continue toward 195°F (90°C).",
  fish: "Cook fish to 145°F (63°C), until it is opaque and flakes.",
  shellfish: "Cook shrimp, lobster, and crab until the flesh is opaque and pearly. An internal temperature of 145°F (63°C) is the target for lobster and shrimp.",
  offal: "Cook beef offal to at least 145°F (63°C) with a rest. Cook poultry offal, including chicken hearts and livers, to 165°F (74°C).",
  veg: "These ingredients are vegetables, bread, or a sauce. Keep them clean, and refrigerate leftovers within 2 hours. This is not a canning recipe.",
  beans: "Boil dried beans until they are completely tender. Kidney beans must be boiled hard, not held warm from raw. Refrigerate leftovers within 2 hours."
};

const raw = JSON.parse(fs.readFileSync(new URL("./raw.json", import.meta.url), "utf8"));

export const DISHES = raw.map((dish) => {
  const safety = dish.safety || SAFETY[dish.doneness] || SAFETY.whole;
  return {
    sample: true,
    pronunciation: "",
    alsoCountries: [],
    variations: [],
    pairings: [],
    storage: STORAGE,
    ...dish,
    safety
  };
});
