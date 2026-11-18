import { el, friendlyError } from "../lib/dom.js";
import { formatHearts, formatRating, formatWhen } from "../lib/format.js";
import { armForm, readFormMeta } from "../lib/human.js";
import { herePath, siteUrl } from "../lib/url.js";

const REASONS = ["Spam", "Harassment", "Dangerous instructions", "Incorrect recipe", "Other"];

function loginHref() {
  return `login.html?next=${encodeURIComponent(herePath())}`;
}

export async function init(adapter) {
  const root = document.getElementById("dish-root");
  const slug = root?.dataset.slug || new URLSearchParams(location.search).get("slug") || "";
  const preview = new URLSearchParams(location.search).get("preview");
  if (preview === "print" || preview === "ingredients") {
    document.body.classList.add("is-print-preview");
    document.body.dataset.print = preview === "ingredients" ? "ingredients" : "full";
  }
  if (!slug || !root) return;

  const session = await adapter.getSession();
  const stats = await adapter.getCommunity(slug);
  if (stats?.deleted || (stats?.hidden && !session?.isOwner)) {
    root.replaceChildren(
      el("h1", {}, "This dish is hidden"),
      el("p", {}, "It is not on the public shelf right now."),
      el("p", {}, [el("a", { class: "button", href: "index.html" }, "Back to the field guide")])
    );
    return;
  }
  if (stats) paintStats(stats);
  mountPrint();
  mountActions(adapter, slug, session, stats);
  await mountTwists(adapter, slug, session);
  await mountComments(adapter, slug, session);
}

function paintStats(stats) {
  const rating = document.getElementById("rating-summary");
  const hearts = document.getElementById("heart-summary");
  if (rating) rating.textContent = formatRating(stats.ratingAvg, stats.ratingCount);
  if (hearts) hearts.textContent = formatHearts(stats.heartCount);
}

function mountPrint() {
  const slot = document.getElementById("print-actions");
  if (!slot) return;
  const full = el("button", { type: "button" }, "Print full recipe");
  const list = el("button", { type: "button", class: "button-quiet" }, "Print ingredients only");
  full.addEventListener("click", () => printMode("full"));
  list.addEventListener("click", () => printMode("ingredients"));
  slot.replaceChildren(full, list);
}

function printMode(mode) {
  document.body.dataset.print = mode;
  const reset = () => {
    document.body.dataset.print = "full";
    window.removeEventListener("afterprint", reset);
  };
  window.addEventListener("afterprint", reset);
  window.print();
}

function mountActions(adapter, slug, session, stats) {
  const slot = document.getElementById("community-actions");
  if (!slot) return;
  slot.replaceChildren();
  if (!session) {
    slot.append(el("p", {}, ["Sign in to rate, leave a heart, comment, or add a twist. ", el("a", { href: loginHref() }, "Sign in")]));
    return;
  }

  const stars = el("fieldset", { class: "stars" }, [el("legend", {}, "Your rating")]);
  for (let value = 1; value <= 5; value += 1) {
    const id = `star-${value}`;
    const input = el("input", { type: "radio", name: "stars", id, value: String(value) });
    if (stats?.myRating === value) input.checked = true;
    input.addEventListener("change", async () => {
      try {
        const next = await adapter.setRating(slug, value);
        paintStats(next);
      } catch (error) {
        slot.querySelector(".form-error").textContent = friendlyError(error);
      }
    });
    stars.append(input, el("label", { for: id }, `${value} star${value === 1 ? "" : "s"}`));
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
      heart.setAttribute("aria-pressed", next.heartedByMe ? "true" : "false");
      heart.textContent = next.heartedByMe ? "Hearted" : "Heart";
      paintStats(next);
    } catch (error) {
      slot.querySelector(".form-error").textContent = friendlyError(error);
    } finally {
      heart.disabled = false;
    }
  });

  const error = el("p", { class: "form-error", role: "alert" }, "");
  slot.append(stars, heart, reportButton(adapter, { targetType: "dish", targetId: slug, slug }), error);

  if (session.isOwner) {
    const hide = el("button", { type: "button", class: "button-quiet" }, "Hide this dish");
    hide.addEventListener("click", async () => {
      hide.disabled = true;
      await adapter.setHidden(slug, true);
      location.reload();
    });
    slot.append(hide);
  }
}

async function mountTwists(adapter, slug, session) {
  const slot = document.getElementById("twists");
  if (!slot) return;
  const twists = await adapter.listTwists(slug);
  const list = el("div", { class: "stack" });
  if (!twists.length) list.append(el("p", { class: "meta" }, "No twists yet."));
  for (const twist of twists) list.append(twistCard(adapter, twist, session));
  const form = session ? twistForm(adapter, slug) : el("p", {}, [el("a", { href: loginHref() }, "Sign in"), " to share a twist."]);
  slot.replaceChildren(
    el("h2", {}, "My additions and twists"),
    el("p", {}, "A twist is your own change to this recipe. It does not replace the field-guide version."),
    list,
    form
  );
}

function twistCard(adapter, twist, session) {
  const block = el("article", { class: "note-card" }, [
    el("h3", {}, twist.title),
    el("p", {}, twist.body),
    el("p", { class: "meta" }, `${twist.authorName} · ${formatWhen(twist.createdAt)}`)
  ]);
  if (session && (session.id === twist.authorId || session.isOwner)) {
    const remove = el("button", { type: "button", class: "linkish" }, "Remove");
    remove.addEventListener("click", async () => {
      remove.disabled = true;
      await adapter.deleteTwist(twist.id);
      block.remove();
    });
    block.append(remove);
  }
  return block;
}

function twistForm(adapter, slug) {
  const form = el("form", { class: "form-card compact" }, [
    el("h3", {}, "Add your twist"),
    el("label", { for: "twist-title" }, "Name"),
    el("input", { id: "twist-title", name: "title", maxlength: "120", required: "true" }),
    el("label", { for: "twist-body" }, "What you changed"),
    el("textarea", { id: "twist-body", name: "body", maxlength: "2000", rows: "4", required: "true" }),
    honeypot(),
    el("p", { class: "form-error", role: "alert" }, ""),
    el("button", { type: "submit" }, "Save twist")
  ]);
  armForm(form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = form.querySelector(".form-error");
    error.textContent = "";
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      const data = new FormData(form);
      await adapter.addTwist(slug, { title: data.get("title"), body: data.get("body") }, readFormMeta(form));
      location.reload();
    } catch (err) {
      error.textContent = friendlyError(err);
      button.disabled = false;
    }
  });
  return form;
}

async function mountComments(adapter, slug, session) {
  const slot = document.getElementById("comments");
  if (!slot) return;
  const comments = await adapter.listComments(slug);
  const list = el("div", { class: "stack" });
  if (!comments.length) list.append(el("p", { class: "meta" }, "No comments yet."));
  for (const comment of comments) list.append(commentCard(adapter, comment, session, slug));
  const form = session ? commentForm(adapter, slug) : el("p", {}, [el("a", { href: loginHref() }, "Sign in"), " to comment."]);
  slot.replaceChildren(el("h2", {}, "Comments"), list, form);
}

function commentCard(adapter, comment, session, slug) {
  const block = el("article", { class: "note-card" }, [
    el("p", {}, comment.body),
    el("p", { class: "meta" }, `${comment.authorName} · ${formatWhen(comment.createdAt)}`)
  ]);
  const tools = el("p", { class: "tool-row" });
  if (session && (session.id === comment.authorId || session.isOwner)) {
    const remove = el("button", { type: "button", class: "linkish" }, "Delete");
    remove.addEventListener("click", async () => {
      remove.disabled = true;
      await adapter.deleteComment(comment.id);
      block.remove();
    });
    tools.append(remove);
  }
  if (session) tools.append(reportButton(adapter, { targetType: "comment", targetId: comment.id, slug }));
  block.append(tools);
  return block;
}

function commentForm(adapter, slug) {
  const form = el("form", { class: "form-card compact" }, [
    el("label", { for: "comment-body" }, "Comment"),
    el("textarea", { id: "comment-body", name: "body", maxlength: "2000", rows: "4", required: "true" }),
    honeypot(),
    el("p", { class: "form-error", role: "alert" }, ""),
    el("button", { type: "submit" }, "Post comment")
  ]);
  armForm(form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = form.querySelector(".form-error");
    error.textContent = "";
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      const data = new FormData(form);
      await adapter.addComment(slug, data.get("body"), readFormMeta(form));
      location.href = siteUrl(herePath().split("?")[0]);
      location.reload();
    } catch (err) {
      error.textContent = friendlyError(err);
      button.disabled = false;
    }
  });
  return form;
}

function reportButton(adapter, target) {
  const button = el("button", { type: "button", class: "linkish" }, "Report");
  button.addEventListener("click", () => {
    const form = el("form", { class: "report-form" }, [
      el("label", { for: `reason-${target.targetId}` }, "Reason"),
      el("select", { id: `reason-${target.targetId}`, name: "reason" }, REASONS.map((reason) => el("option", { value: reason }, reason))),
      el("label", { for: `note-${target.targetId}` }, "Note, optional"),
      el("textarea", { id: `note-${target.targetId}`, name: "note", maxlength: "1000", rows: "3" }),
      honeypot(),
      el("button", { type: "submit" }, "Send report"),
      el("p", { class: "form-error", role: "alert" }, "")
    ]);
    armForm(form);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      try {
        await adapter.report({
          ...target,
          reason: data.get("reason"),
          note: data.get("note")
        }, readFormMeta(form));
        form.replaceWith(el("p", { class: "meta" }, "Report sent."));
      } catch (error) {
        form.querySelector(".form-error").textContent = friendlyError(error);
      }
    });
    button.replaceWith(form);
  });
  return button;
}

function honeypot() {
  return el("p", { class: "visually-hidden" }, [
    el("label", { for: "website" }, "Leave this field empty"),
    el("input", { id: "website", name: "website", tabindex: "-1", autocomplete: "off" })
  ]);
}

export { reportButton, honeypot };
