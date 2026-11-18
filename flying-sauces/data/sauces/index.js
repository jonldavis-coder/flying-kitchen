import { CORE } from "./core.js";
import { MORE } from "./core2.js";
import { EUROPE } from "./europe.js";
import { AFRICA_ME } from "./africa-me.js";
import { SOUTH_ASIA } from "./south-asia.js";
import { ASIA_EAST } from "./asia-east.js";
import { AMERICAS } from "./americas.js";
import { MORE_PLATES } from "./more-plates.js";
import { REGIONAL_EXTRA } from "./regional-extra.js";
import { VOYAGE_STOPS } from "./voyage-stops.js";
import { withTaste } from "./apply-notes.js";

export const SAUCES = withTaste([
  ...CORE,
  ...MORE,
  ...EUROPE,
  ...AFRICA_ME,
  ...SOUTH_ASIA,
  ...ASIA_EAST,
  ...AMERICAS,
  ...MORE_PLATES,
  ...REGIONAL_EXTRA,
  ...VOYAGE_STOPS
]);
