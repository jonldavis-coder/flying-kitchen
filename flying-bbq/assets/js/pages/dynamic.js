import { el } from "../lib/dom.js";
import { labelOf, BASE_TYPES, HEATS } from "../../../data/vocabulary.js";
import { formatMinutes } from "../lib/format.js";

export async function init(adapter) {
  const root = document.getElementById("dish-root");
  const slug = new URLSearchParams(location.search).get("slug") || root?.dataset.slug || "";
  if (!root) return;
  if (root.querySelector(".dish-title")) return;
  const dishes = await adapter.listUserDishes();
  const dish = dishes.find((item) => item.slug === slug);
  if (!dish) {
    root.replaceChildren(
      el("h1", {}, "That dish is not on this shelf"),
      el("p", {}, "It may live in another browser, or the link may be mistyped."),
      el("p", {}, [el("a", { class: "button", href: "index.html" }, "Back to the field guide")])
    );
    return;
  }
  document.title = `${dish.name} · Flying BBQ`;
  root.dataset.slug = dish.slug;
  root.replaceChildren(
    el("p", { class: "print-only print-brand" }, "Flying BBQ of the World"),
    el("p", { class: "badge badge-inline" }, "Community submission"),
    el("p", { class: "eyebrow" }, `${dish.country} · ${dish.region}`),
    el("h1", { class: "dish-title" }, dish.name),
    el("p", { class: "dek" }, dish.flavor || ""),
    el("p", { class: "meta" }, `${labelOf(BASE_TYPES, dish.baseType)} · ${labelOf(HEATS, dish.heat)} · ${formatMinutes(dish.prepMinutes)} prep · ${formatMinutes(dish.cookMinutes)} cook · ${dish.yieldText}`),
    el("p", { class: "meta", id: "rating-summary" }, "No ratings yet"),
    el("p", { class: "meta", id: "heart-summary" }, "No hearts yet"),
    dish.photo ? el("img", { class: "user-photo", src: dish.photo, alt: "" }) : null,
    el("h2", {}, "Origin note"),
    el("p", {}, dish.story || ""),
    el("aside", { class: "fun-facts" }, [
      el("h2", {}, "Field note"),
      el("ul", {}, [el("li", {}, dish.funFact || "")])
    ]),
    el("h2", {}, "Ingredients"),
    el("ul", { class: "ingredients" }, (dish.ingredients || []).map((item) => el("li", {}, item))),
    el("h2", { class: "steps-heading" }, "Steps"),
    el("ol", { class: "steps" }, (dish.steps || []).map((item) => el("li", {}, item))),
    el("p", { class: "note" }, "Community recipe. Use your own judgment on food safety."),
    el("div", { id: "print-actions", class: "no-print button-row" }),
    el("div", { id: "community-actions", class: "no-print" }),
    el("section", { id: "twists", class: "no-print" }),
    el("section", { id: "comments", class: "no-print" })
  );
  const dishPage = await import("./dish.js");
  await dishPage.init(adapter);
}
