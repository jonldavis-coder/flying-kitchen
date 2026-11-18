import { el } from "../lib/dom.js";
import { labelOf, BASE_TYPES, HEATS } from "../../../data/vocabulary.js";
import { formatMinutes } from "../lib/format.js";

export async function init(adapter) {
  const root = document.getElementById("sauce-root");
  const slug = new URLSearchParams(location.search).get("slug") || root?.dataset.slug || "";
  if (!root) return;
  if (root.querySelector(".sauce-title")) return;
  const sauces = await adapter.listUserSauces();
  const sauce = sauces.find((item) => item.slug === slug);
  if (!sauce) {
    root.replaceChildren(
      el("h1", {}, "That sauce is not on this shelf"),
      el("p", {}, "It may live in another browser, or the link may be mistyped."),
      el("p", {}, [el("a", { class: "button", href: "index.html" }, "Back to the field guide")])
    );
    return;
  }
  document.title = `${sauce.name} · Flying Sauces`;
  root.dataset.slug = sauce.slug;
  root.replaceChildren(
    el("p", { class: "print-only print-brand" }, "Flying Sauces of the World"),
    el("p", { class: "badge badge-inline" }, "Community submission"),
    el("p", { class: "eyebrow" }, `${sauce.country} · ${sauce.region}`),
    el("h1", { class: "sauce-title" }, sauce.name),
    el("p", { class: "dek" }, sauce.flavor || ""),
    el("p", { class: "meta" }, `${labelOf(BASE_TYPES, sauce.baseType)} · ${labelOf(HEATS, sauce.heat)} · ${formatMinutes(sauce.prepMinutes)} prep · ${formatMinutes(sauce.cookMinutes)} cook · ${sauce.yieldText}`),
    el("p", { class: "meta", id: "rating-summary" }, "No ratings yet"),
    el("p", { class: "meta", id: "heart-summary" }, "No hearts yet"),
    sauce.photo ? el("img", { class: "user-photo", src: sauce.photo, alt: "" }) : null,
    el("h2", {}, "Origin note"),
    el("p", {}, sauce.story || ""),
    el("aside", { class: "fun-facts" }, [
      el("h2", {}, "Field note"),
      el("ul", {}, [el("li", {}, sauce.funFact || "")])
    ]),
    el("h2", {}, "Ingredients"),
    el("ul", { class: "ingredients" }, (sauce.ingredients || []).map((item) => el("li", {}, item))),
    el("h2", { class: "steps-heading" }, "Steps"),
    el("ol", { class: "steps" }, (sauce.steps || []).map((item) => el("li", {}, item))),
    el("p", { class: "note" }, "Community recipe. Use your own judgment on food safety."),
    el("div", { id: "print-actions", class: "no-print button-row" }),
    el("div", { id: "community-actions", class: "no-print" }),
    el("section", { id: "twists", class: "no-print" }),
    el("section", { id: "comments", class: "no-print" })
  );
  const saucePage = await import("./sauce.js");
  await saucePage.init(adapter);
}
