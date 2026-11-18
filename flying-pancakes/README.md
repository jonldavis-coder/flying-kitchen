# Flying Pancakes of the World

Pancakes and their griddled relatives, from around the world. This issue’s count is the number of edited entries. The journal is growing to **1,000**.

Each pancake has a workable home recipe, an origin, a history, a cultural note, and a **Why it tastes this way** section that ties grain, climate, trade, migration, or a feast day to the flavor. An **Authentic touch** is the cooking tip. Disputed origin stories are labeled or left out.

The home page is a voyage invitation. The map is a route map: curated journeys draw a leg, and each leg carries a balloon, plane, train, or boat. A pancake page reads as a stop, with **Arriving in** and a **Next stop** link.

Illustrations are drawn for this site. The map uses Natural Earth shapes and Leaflet. No paid map key.

This is the sister site of [Flying Sauces of the World](https://jonldavis-coder.github.io/flying-sauces/).

The live site is GitHub Pages from `main`:

**https://jonldavis-coder.github.io/flying-pancakes/**

## Pages

- Home: search and filters for region, batter, heat, use, diet, and country.
- Route map: journey lines with a vehicle on each leg, plus a country list that works without JavaScript.
- Journeys: curated routes.
- Explore: by region, by batter, and by use.
- Recipe books: flagship collections, regional books, and breakfast, savory, and dessert booklets. Each has a cover, a schematic route, a contents list, and a printable view. The shop is coming soon. Prices are placeholders. The Complete Collection is 30% off the sum of those prices, computed from the config, not stored as its own amount.
- Pancake pages: recipe, print full recipe, print ingredients only, Recipe JSON-LD. Print views omit ad slots.
- Who settled the flavor: a United States essay on settlers, immigrants, and older corn traditions.
- Pancake 101 and a glossary.
- Community: 1–5 star reviews, comments, hearts, twists (“My additions”), and a form to submit a pancake.
- About, guidelines, affiliate disclosure, draft privacy, draft terms, and a 404 page.

Until Supabase is connected, a banner says that community notes stay in this browser.

## Run it locally

```bash
npm test
npm run preview
```

Open http://127.0.0.1:4173/flying-pancakes/

`npm test` rebuilds the pages and checks the catalog.

## Demo mode and Supabase

Leave `SUPABASE_URL` and `SUPABASE_ANON_KEY` empty in `config.js`. The site then uses `localStorage`.

Passwords are hashed in the browser. That only keeps them out of plain text. Demo mode is for trying the kitchen, not for a private multi-user site.

To turn on Supabase:

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the SQL editor.
3. Set the site URL to `https://jonldavis-coder.github.io/flying-pancakes/` and the redirect to `https://jonldavis-coder.github.io/flying-pancakes/login.html`.
4. Copy the project URL and the anon key into `config.js`. Never commit the service-role key.
5. After you create an account, insert your user id into `public.owners`.

Ads stay off while `ads-config.js` says `provider: "none"`. Slots are omitted from print views.

## Food

Recipes are home cooking. They are not professional food-safety or medical advice. Diet tags match the written recipe. Cassava pages use commercial cassava flour, not raw bitter cassava.
