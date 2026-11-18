// Public site origin. Canonicals, Open Graph, JSON-LD, sitemap, and robots
// all read this value. One line switches the origin.
export const SITE_ORIGIN = "https://kitekitchen.com";

// GitHub Pages serves this repository at the domain root once CNAME is set.
export const BASE_PATH = "/";

// GA4 for kitekitchen.com. The library is not requested until first interaction
// or a short timeout, and Consent Mode defaults decide storage.
export const GA_MEASUREMENT_ID = "G-JHDKNY6NTV";

// AdSense stays off until a real publisher ID is pasted here and enabled is true.
// Do not invent an ID.
export const ADS = {
  enabled: false,
  publisherId: ""
};

// No public mailbox is set up. Leave this empty so the build cannot publish an address.
export const HELLO_EMAIL = "";

// home_hero_photo: set false to remove the photograph under the home search.
export const home_hero_photo = false;
