import { el, friendlyError } from "../lib/dom.js";
import { formatHearts, formatRating, formatWhen } from "../lib/format.js";
import { armForm, readFormMeta } from "../lib/human.js";
import { boxSetQuote, priceLabel } from "../lib/shop.js";
import { herePath } from "../lib/url.js";

const REASONS = ["Spam", "Harassment", "Dangerous instructions", "Incorrect note", "Other"];

function loginHref() {
  return `login.html?next=${encodeURIComponent(herePath())}`;
}

export async function init(adapter) {
  const root = document.getElementById("entry-root");
  const slug = root?.dataset.slug || "";
  const preview = new URLSearchParams(location.search).get("preview");
  if (preview === "print" || preview === "ingredients") {
    document.body.classList.add("is-print-preview");
    document.body.dataset.print = preview === "ingredients" ? "ingredients" : "full";
  }
  mountPrint();
  mountBoxQuote();
  if (!slug || !root) return;
  const session = await adapter.getSession();
  const stats = await adapter.getCommunity(slug);
  paintStats(stats);
  mountActions(adapter, slug, session, stats);
  await mountComments(adapter, slug, session);
}

function mountBoxQuote() {
  const node = document.getElementById("box-quote");
  const shop = window.FLYING_KITCHEN_SHOP;
  if (!node || !shop?.books) return;
  const quote = boxSetQuote(shop.books.map((book) => book.pricePlaceholder), shop.boxSetDiscount);
  const sum = node.querySelector("span[data-sum]");
  const savings = node.querySelector("span[data-savings]");
  const total = node.querySelector("span[data-total]");
  if (sum) sum.textContent = priceLabel(quote.sum, shop);
  if (savings) savings.textContent = priceLabel(quote.savings, shop);
  if (total) total.textContent = priceLabel(quote.total, shop);
  node.dataset.total = String(quote.total);
  node.dataset.sum = String(quote.sum);
  node.dataset.savings = String(quote.savings);
}

function paintStats(stats) {
  const rating = document.getElementById("rating-summary");
  const hearts = document.getElementById("heart-summary");
  if (rating && stats) rating.textContent = formatRating(stats.ratingAvg, stats.ratingCount);
  if (hearts && stats) hearts.textContent = formatHearts(stats.heartCount);
}

function mountPrint() {
  const slot = document.getElementById("print-actions");
  if (!slot) return;
  const full = el("button", { type: "button" }, "Print this page");
  full.addEventListener("click", () => {
    document.body.dataset.print = "full";
    window.print();
  });
  slot.replaceChildren(full);
}

function mountActions(adapter, slug, session, stats) {
  const slot = document.getElementById("community-actions");
  if (!slot) return;
  slot.replaceChildren();
  if (!session) {
    slot.append(el("p", {}, ["Sign in to rate, leave a heart, or comment. ", el("a", { href: loginHref() }, "Sign in")]));
    return;
  }
  const stars = el("fieldset", { class: "stars" }, [el("legend", {}, "Your rating")]);
  for (let value = 1; value <= 5; value += 1) {
    const id = `star-${value}`;
    const input = el("input", { type: "radio", name: "stars", id, value: String(value) });
    if (stats?.myRating === value) input.checked = true;
    input.addEventListener("change", async () => {
      try {
        paintStats(await adapter.setRating(slug, value));
      } catch (error) {
        slot.querySelector(".form-error")?.replaceChildren(friendlyError(error));
      }
    });
    stars.append(input, el("label", { for: id }, String(value)));
  }
  const heart = el("button", {
    type: "button",
    class: "heart",
    "aria-pressed": stats?.heartedByMe ? "true" : "false"
  }, stats?.heartedByMe ? "Hearted" : "Heart");
  heart.addEventListener("click", async () => {
    heart.disabled = true;
    try {
      const next = await adapter.setHeart(slug, heart.getAttribute("aria-pressed") !== "true");
      paintStats(next);
      heart.setAttribute("aria-pressed", next.heartedByMe ? "true" : "false");
      heart.textContent = next.heartedByMe ? "Hearted" : "Heart";
    } catch (error) {
      slot.querySelector(".form-error")?.replaceChildren(friendlyError(error));
    }
    heart.disabled = false;
  });
  slot.append(stars, heart, el("p", { class: "form-error", role: "alert" }));
}

async function mountComments(adapter, slug, session) {
  const slot = document.getElementById("comments");
  if (!slot) return;
  const comments = await adapter.listComments(slug);
  const list = el("div", { class: "comment-list" });
  if (!comments.length) list.append(el("p", {}, "No comments yet."));
  for (const comment of comments) {
    const block = el("article", { class: "comment" }, [
      el("h3", {}, comment.authorName || "Reader"),
      el("p", { class: "meta" }, formatWhen(comment.createdAt)),
      el("p", {}, comment.body)
    ]);
    if (comment.hidden) block.append(el("p", { class: "meta" }, "Hidden from the public list in this browser."));
    if (session) block.append(reportForm(adapter, slug, comment.id));
    list.append(block);
  }
  const pieces = [el("h2", {}, "Comments"), el("p", { class: "note" }, "A comment is a note from a signed-in reader. It is not a verified purchase and it is not a Flying Kitchen testimonial."), list];
  if (session) {
    const form = el("form", { class: "stack" }, [
      el("label", { for: "comment-body" }, "Add a comment"),
      el("textarea", { id: "comment-body", name: "body", required: "true", maxlength: "2000", rows: "4" }),
      el("label", { class: "hp" }, ["Website", el("input", { name: "website", tabindex: "-1", autocomplete: "off" })]),
      el("button", { type: "submit" }, "Post comment"),
      el("p", { class: "form-error", role: "alert" })
    ]);
    armForm(form);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const error = form.querySelector(".form-error");
      error.textContent = "";
      try {
        await adapter.addComment(slug, new FormData(form).get("body"), readFormMeta(form));
        await mountComments(adapter, slug, session);
      } catch (err) {
        error.textContent = friendlyError(err);
      }
    });
    pieces.push(form);
  }
  slot.replaceChildren(...pieces);
}

function reportForm(adapter, slug, commentId) {
  const form = el("form", { class: "report-form no-print" }, [
    el("label", {}, ["Report", el("select", { name: "reason" }, REASONS.map((reason) => el("option", { value: reason }, reason)))]),
    el("input", { name: "note", maxlength: "1000", placeholder: "Optional note" }),
    el("button", { type: "submit", class: "button-quiet" }, "Report"),
    el("span", { class: "form-error", role: "alert" })
  ]);
  armForm(form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const error = form.querySelector(".form-error");
    try {
      await adapter.reportComment({
        slug,
        commentId,
        reason: data.get("reason"),
        note: data.get("note")
      }, readFormMeta(form));
      error.textContent = "Report saved in this browser.";
    } catch (err) {
      error.textContent = friendlyError(err);
    }
  });
  return form;
}
