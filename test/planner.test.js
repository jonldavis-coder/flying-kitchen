import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import { countriesDiffer, parsePlan, recipesFor, serializePlan } from "../assets/js/planner-model.mjs";
import { rasterQr } from "../assets/js/qr-card.mjs";

const require = createRequire(import.meta.url);
const jsQR = require("jsqr");

test("planner url state round-trips and keeps three countries distinct", () => {
  const slots = {
    b: { country: "france", recipe: "crepes-suzette" },
    l: { country: "italy", recipe: "arrabbiata" },
    d: { country: "argentina", recipe: "argentine-asado" }
  };
  const again = parsePlan(serializePlan(slots));
  assert.deepEqual(again, slots);
  assert.equal(countriesDiffer(slots), true);
  assert.equal(countriesDiffer({
    b: { country: "france", recipe: "crepes-suzette" },
    l: { country: "france", recipe: "aioli" },
    d: { country: "japan", recipe: "ramen" }
  }), false);
  const breakfast = recipesFor([
    { title: "Béarnaise", country: "france", section: "Flying Sauces", meals: [], thumb: "/b.jpg" },
    { title: "Crêpes Suzette", country: "france", section: "Flying Pancakes", meals: ["Dessert"], thumb: "/c.jpg" },
    { title: "A", country: "france", section: "Flying Pancakes", meals: ["Breakfast"], thumb: "" }
  ], "france", "Breakfast");
  assert.deepEqual(breakfast.primary.map((item) => item.title), ["A", "Crêpes Suzette"]);
  assert.deepEqual(breakfast.more.map((item) => item.title), ["Béarnaise"]);
  const fallback = recipesFor([
    { title: "Z", country: "france", section: "Flying BBQ", meals: [], thumb: "" },
    { title: "Y", country: "france", section: "Flying BBQ", meals: [], thumb: "/y.jpg" }
  ], "france", "Lunch");
  assert.deepEqual(fallback.primary.map((item) => item.title), ["Y", "Z"]);
  assert.equal(fallback.more.length, 0);
});

test("journey planner markup, print layout, and home link exist", () => {
  const journeys = fs.readFileSync("journeys/index.html", "utf8");
  const css = fs.readFileSync("assets/css/kite.css", "utf8");
  const home = fs.readFileSync("index.html", "utf8");
  const day = fs.readFileSync("journeys/day-france-italy-argentina/index.html", "utf8");
  assert.match(journeys, /id="plan"/);
  assert.match(journeys, /id="kk-plan-map"/);
  assert.match(journeys, /data-slot="b"/);
  assert.match(journeys, /data-slot="l"/);
  assert.match(journeys, /data-slot="d"/);
  assert.match(journeys, /Recipe Journey Card/);
  assert.match(journeys, /src="\/assets\/js\/planner.js"/);
  assert.match(css, /@media print/);
  assert.match(css, /kk-journey-card/);
  assert.match(css, /@page kk57/);
  assert.match(css, /5in 7in/);
  assert.match(home, /href="\/journeys\/#plan"/);
  assert.match(day, /Customize this journey/);
  assert.match(day, /\/journeys\/\?b=/);
  assert.equal(fs.existsSync("assets/planner.json"), true);
  const data = JSON.parse(fs.readFileSync("assets/planner.json", "utf8"));
  assert.ok(data.countries.length >= 10);
  assert.ok(data.recipes.length >= 100);
  assert.ok(data.countries.every((country) => country.slug && country.name));
  assert.match(journeys, /class="kk-card-stops"/);
  assert.match(journeys, /class="kk-card-toolbar/);
  assert.match(journeys, /kk-plan-try/);
  assert.match(css, /#kk-card-stops/);
  assert.match(css, /list-style:\s*none/);
  assert.match(css, /72px/);
});

test("journey card QR decodes to the share URL", () => {
  const url = "https://kitekitchen.com/journeys/?b=france:crepes-suzette&l=italy:arrabbiata&d=argentina:argentine-asado";
  const { data, dim } = rasterQr(url, 8, 4);
  const found = jsQR(data, dim, dim);
  assert.ok(found, "jsQR could not read the card QR");
  assert.equal(found.data, url);
});
