import { el } from "../lib/dom.js";
import { labelOf, BASE_TYPES, HEATS } from "../../../data/vocabulary.js";
import { formatMinutes } from "../lib/format.js";

export async function init(adapter) {
  const root = document.getElementById("pancake-root");
  const slug = new URLSearchParams(location.search).get("slug") || root?.dataset.slug || "";
  if (!root) return;
  if (root.querySelector(".pancake-title")) return;
  const pancakes = await adapter.listUserPancakes();
  const pancake = pancakes.find((item) => item.slug === slug);
  if (!pancake) {
    root.replaceChildren(
      el("h1", {}, "That pancake is not in this journal"),
      el("p", {}, "It may live in another browser, or the link may be mistyped."),
      el("p", {}, [el("a", { class: "button", href: "index.html" }, "Back to the journal")])
    );
    return;
  }
  document.title = `${pancake.name} · Flying Pancakes`;
  root.dataset.slug = pancake.slug;
  root.replaceChildren(
    el("p", { class: "print-only print-brand" }, "Flying Pancakes of the World"),
    el("p", { class: "badge badge-inline" }, "Community submission"),
    el("p", { class: "eyebrow" }, `${pancake.country} · ${pancake.region}`),
    el("h1", { class: "pancake-title" }, pancake.name),
    el("p", { class: "dek" }, pancake.flavor || ""),
    el("p", { class: "meta" }, `${labelOf(BASE_TYPES, pancake.baseType)} · ${labelOf(HEATS, pancake.heat)} · ${formatMinutes(pancake.prepMinutes)} prep · ${formatMinutes(pancake.cookMinutes)} cook · ${pancake.yieldText}`),
    el("p", { class: "meta", id: "rating-summary" }, "No ratings yet"),
    el("p", { class: "meta", id: "heart-summary" }, "No hearts yet"),
    pancake.photo ? el("img", { class: "user-photo", src: pancake.photo, alt: "" }) : null,
    el("h2", {}, "Origin note"),
    el("p", {}, pancake.story || ""),
    el("aside", { class: "fun-facts" }, [
      el("h2", {}, "Field note"),
      el("ul", {}, [el("li", {}, pancake.funFact || "")])
    ]),
    el("h2", {}, "Ingredients"),
    el("ul", { class: "ingredients" }, (pancake.ingredients || []).map((item) => el("li", {}, item))),
    el("h2", { class: "steps-heading" }, "Steps"),
    el("ol", { class: "steps" }, (pancake.steps || []).map((item) => el("li", {}, item))),
    el("p", { class: "note" }, "Community recipe. Use your own judgment on food safety."),
    el("div", { id: "print-actions", class: "no-print button-row" }),
    el("div", { id: "community-actions", class: "no-print" }),
    el("section", { id: "twists", class: "no-print" }),
    el("section", { id: "comments", class: "no-print" })
  );
  const pancakePage = await import("./pancake.js");
  await pancakePage.init(adapter);
}
