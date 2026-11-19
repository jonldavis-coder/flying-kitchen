# KiteKitchen

Kite-day recipes, with Flying Sauces and Flying Pancakes kept as named sections. The shop is a preview: no prices and no checkout.

The public origin is **https://kitekitchen.com**. Canonicals, the sitemap, robots, Open Graph, and JSON-LD all read `SITE_ORIGIN` in `site.config.mjs`.

```js
export const SITE_ORIGIN = "https://kitekitchen.com";
```

Change that one line and run `npm run build` if the origin ever moves. `CNAME` contains `kitekitchen.com`.

## Run it

```bash
npm install
npm test
npm run preview
```

Open http://127.0.0.1:4173/

`npm test` rebuilds the pages and checks links, the shop, analytics, and ads.

## Ads and analytics

- Google Analytics 4 measurement ID: `G-JHDKNY6NTV` in `site.config.mjs`.
- The gtag library loads after the first pointer, key, or scroll, or 4.5 seconds after load.
- Consent Mode defaults deny analytics storage in the EEA, UK, and Switzerland until the visitor accepts. Advertising storage stays denied until they accept.
- AdSense stays off (`ADS.enabled` is false, publisher ID empty). `ads.txt` is a comment until Google issues a real line.
