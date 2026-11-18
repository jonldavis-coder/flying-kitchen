# Flying BBQ of the World

A guide to barbecue and live-fire cooking. This issue has **302 stops**. The route is growing to **1,000**. Every count on the site is the number of edited entries.

Each stop has a workable recipe with a safe cooking temperature, an origin, a history, a cultural note, a **Why it tastes this way** section, and an **Authentic touch**. Pages open with **Arriving in…** and link a **Next stop**. Histories leave out claims that are not solid.

Illustrations are drawn for this site. The route map uses Natural Earth shapes and Leaflet, with a vehicle icon on each curated leg. No paid map key. No borrowed magazine marks.

The live site is GitHub Pages from `main`:

**https://jonldavis-coder.github.io/flying-bbq/**

## Pages

- Home: a voyage invitation, then search and filters.
- Route map: shaded countries plus journey lines. Balloon, plane, train, and boat icons mark the legs.
- Journeys: curated routes, including the American BBQ Belt by train.
- Explore: by region, by fire method, and by use.
- Who settled the flavor: how Native nations, Spanish and Caribbean barbacoa, enslaved Africans, and later immigrants shaped regional barbecue in the United States.
- Recipe books: flagship collections and field booklets. Each has an original cover, a schematic route, a contents list, and a printable view. The shop is coming soon. Prices are placeholders. The Complete Collection is 30% off the sum of those prices, computed from the config, not stored as its own amount.
- Dish pages: recipe, print full recipe, print ingredients only, Recipe JSON-LD. Print views omit ads.
- Fire 101 and a glossary.
- Community: 1–5 star reviews, comments, hearts, twists (“My additions”), and a form to submit a dish.
- About, guidelines, affiliate disclosure, draft privacy, draft terms, and a 404 page.

Until Supabase is connected, a banner says that community notes stay in this browser.

## Run it locally

```bash
npm test
npm run preview
```

Open http://127.0.0.1:4173/flying-bbq/

`npm test` rebuilds the pages and checks the catalog.

## Demo mode and Supabase

Leave `SUPABASE_URL` and `SUPABASE_ANON_KEY` empty in `config.js`. The site then uses `localStorage`.

Passwords are hashed in the browser. That only keeps them out of plain text. Demo mode is for trying the kitchen, not for a private multi-user site.

To turn on Supabase:

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the SQL editor.
3. Set the site URL to `https://jonldavis-coder.github.io/flying-bbq/` and the redirect to `https://jonldavis-coder.github.io/flying-bbq/login.html`.
4. Copy the project URL and the anon key into `config.js`. Never commit the service-role key.
5. After you create an account, insert your user id into `public.owners`.

Ads stay off while `ads-config.js` says `provider: "none"`. Slots are omitted from print views.

## Food

Recipes are home cooking. They are not professional food-safety or medical advice. Whole cuts of beef, pork, and lamb are cooked to at least 145°F (63°C) with a rest; poultry to 165°F (74°C); ground meat to 160°F (71°C); fish to 145°F (63°C). Pulled pork and brisket are taken hotter than the safety line so the meat becomes tender. Diet tags match the written recipe. Earth-oven pages say when a covered pot is only a home version.
