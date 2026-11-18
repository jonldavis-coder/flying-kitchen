# Flying Sauces of the World

An editorial field guide to the world’s sauces. This issue has **278 sauces**. The shelf is growing to **1,000**. Every count on the site is the number of edited entries. The home page is a voyage by balloon, plane, train, and boat. Sauce pages open with “Arriving in…”, and each one links a next stop.

Each sauce has a full recipe, an origin, a cultural note, and a **Why it tastes this way** section that ties climate, trade, preservation, migration, or kitchen practice to the flavor. An **Authentic touch** is the tradition’s cooking tip. Histories leave out claims that are not solid.

Illustrations are drawn for this site. The map uses Natural Earth shapes and Leaflet. No paid map key.

The live site is GitHub Pages from `main`:

**https://jonldavis-coder.github.io/flying-sauces/**

## Pages

- Home: search and filters for region, base type, heat, use, diet, and country.
- Map: a route map. Countries are shaded, and each curated journey is a line with a balloon, plane, train, or boat on every leg.
- Journeys: Silk Road by train, the Caribbean by boat, the American South by train, the Mediterranean by balloon, and Mexico to the Andes by plane.
- Places: Southern, Eastern, and Northern United States; Ireland; England; Africa; India; South Korea; Japan; China; Cuba; Mexico; Spain; South America.
- Who settled the flavor: eight United States chapters, from Louisiana and New England through the Upper Midwest.
- Explore: by region, by type, and by use.
- Recipe books: flagship collections, regional books, and use-based booklets. Each has a cover, a schematic route, a contents list, and a printable view. The shop is coming soon. Prices are placeholders. The Complete Collection is 30% off the sum of those prices, computed from the config, not stored as its own amount.
- Sauce pages: recipe, print full recipe, print ingredients only, Recipe JSON-LD.
- Sauce 101 and a glossary.
- Community: 1–5 star reviews, comments, hearts, twists (“My additions”), and a form to submit a sauce.
- About, guidelines, affiliate disclosure, draft privacy, draft terms, and a 404 page.

Until Supabase is connected, a banner says that community notes stay in this browser.

## Run it locally

```bash
npm test
npm run preview
```

Open http://127.0.0.1:4173/flying-sauces/

`npm test` rebuilds the pages and checks the catalog.

## Demo mode and Supabase

Leave `SUPABASE_URL` and `SUPABASE_ANON_KEY` empty in `config.js`. The site then uses `localStorage`.

Passwords are hashed in the browser. That only keeps them out of plain text. Demo mode is for trying the kitchen, not for a private multi-user site.

To turn on Supabase:

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the SQL editor.
3. Set the site URL to `https://jonldavis-coder.github.io/flying-sauces/` and the redirect to `https://jonldavis-coder.github.io/flying-sauces/login.html`.
4. Copy the project URL and the anon key into `config.js`. Never commit the service-role key.
5. After you create an account, insert your user id into `public.owners`.

Ads stay off while `ads-config.js` says `provider: "none"`. Slots are omitted from print views.

## Food

Recipes are home cooking. They are not professional food-safety or medical advice. Diet tags match the written recipe. Refrigerator chutneys are not canning instructions. Cassava pages, if added later, must use a commercial product.
