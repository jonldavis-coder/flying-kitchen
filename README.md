# Flying Kitchen

The flagship hub for the Flying sites. This issue reads [Flying Sauces](https://jonldavis-coder.github.io/flying-sauces/), [Flying Pancakes](https://jonldavis-coder.github.io/flying-pancakes/), and [Flying BBQ](https://jonldavis-coder.github.io/flying-bbq/) at build time and links back to their full entries.

The live site is GitHub Pages from `main`:

**https://jonldavis-coder.github.io/flying-kitchen/**

## What the hub keeps

- Featured recipes, journeys, Top 100 books, and editor’s picks are taken from the sister sites’ published catalogs. A site with no catalog shows a coming-soon section. The next `npm run build` fills it in.
- A combined route map draws the published balloon, plane, train, and boat legs on Natural Earth country shapes. No paid map key.
- “Who settled the flavor” quotes settlement and migration lines from those sites and links to the source page.
- Cross-site search covers every published entry.
- Flying Kitchen Gear is a closed shop: original logo mockups, placeholder prices in `shop-config.js`, and a Coming soon button. Goods are planned for print-on-demand or private-label sourcing.
- The Ultimate Flying Kitchen Library is every book that has a published placeholder price, at 30% off the combined price. The total is computed. It is not stored as its own amount.
- Community notes (stars, hearts, comments) run in demo mode in this browser until Supabase keys are set. Nothing is pre-seeded.
- Ad slots stay empty while `ads-config.js` says `provider: "none"`. Print styles hide the slots, the header, and the footer.

Counts, routes, and histories are the sister sites’ own record. The hub does not invent dishes, customers, or testimonials.

## Run it locally

```bash
npm test
npm run preview
```

Open http://127.0.0.1:4173/flying-kitchen/

`npm test` rebuilds the pages from the public repos and checks the catalog, the shop math, and local links.
