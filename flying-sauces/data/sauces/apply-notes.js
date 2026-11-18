import { NOTES_CORE } from "./notes-core.js";
import { NOTES_EUROPE } from "./notes-europe.js";
import { NOTES_WORLD } from "./notes-world.js";

export const TASTE_NOTES = {
  ...NOTES_CORE,
  ...NOTES_EUROPE,
  ...NOTES_WORLD
};

export function withTaste(sauces) {
  return sauces.map((sauce) => {
    const note = TASTE_NOTES[sauce.slug] || {};
    return {
      ...sauce,
      whyItTastes: sauce.whyItTastes || note.whyItTastes || "",
      authenticTouch: sauce.authenticTouch || note.authenticTouch || ""
    };
  });
}
