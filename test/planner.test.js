import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { countriesDiffer, parsePlan, recipesFor, serializePlan } from "../assets/js/planner-model.mjs";

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
    { title: "B", country: "france", meals: ["Dessert"], thumb: "" },
    { title: "A", country: "france", meals: ["Breakfast"], thumb: "/a.jpg" },
    { title: "C", country: "italy", meals: ["Breakfast"], thumb: "/c.jpg" }
  ], "france", "Breakfast");
  assert.deepEqual(breakfast.map((item) => item.title), ["A"]);
  const fallback = recipesFor([
    { title: "Z", country: "france", meals: [], thumb: "" },
    { title: "Y", country: "france", meals: [], thumb: "/y.jpg" }
  ], "france", "Lunch");
  assert.deepEqual(fallback.map((item) => item.title), ["Y", "Z"]);
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
});
