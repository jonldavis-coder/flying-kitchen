import { el, friendlyError } from "../lib/dom.js";
import { formatWhen } from "../lib/format.js";

export async function init(adapter) {
  const root = document.getElementById("moderate-root");
  if (!root) return;
  const session = await adapter.getSession();
  if (!session) {
    root.append(el("p", {}, ["Sign in with the owner account. ", el("a", { href: "login.html?next=moderate.html" }, "Sign in")]));
    return;
  }
  if (!session.isOwner) {
    root.append(el("p", {}, "This desk is for the owner account."));
    return;
  }
  try {
    const data = await adapter.listModeration();
    root.append(section("Reports", data.reports, (item) => el("li", {}, [
      el("strong", {}, `${item.reason} · ${item.targetType || item.target_type}`),
      el("p", {}, item.note || item.slug || item.sauce_slug || ""),
      el("p", { class: "meta" }, `${item.reporterName || item.reporter_name} · ${formatWhen(item.createdAt || item.created_at)}`)
    ])));
    root.append(section("Comments", data.comments, (item) => row(item.body, item, () => adapter.setCommentHidden(item.id, !item.hidden))));
    root.append(section("Twists", data.twists, (item) => row(`${item.title}: ${item.body}`, item, () => adapter.setTwistHidden(item.id, !item.hidden))));
    root.append(section("Submitted sauces", data.sauces, (item) => row(item.name, item, () => adapter.setHidden(item.slug, !item.hidden))));
  } catch (error) {
    root.append(el("p", { role: "alert" }, friendlyError(error)));
  }
}

function section(title, items, render) {
  const list = el("ul", { class: "mod-list" });
  if (!items?.length) list.append(el("li", {}, "Nothing here."));
  for (const item of items || []) list.append(render(item));
  return el("section", {}, [el("h2", {}, title), list]);
}

function row(text, item, action) {
  const button = el("button", { type: "button" }, item.hidden ? "Unhide" : "Hide");
  button.addEventListener("click", async () => {
    button.disabled = true;
    await action();
    location.reload();
  });
  return el("li", {}, [
    el("p", {}, text),
    el("p", { class: "meta" }, `${item.authorName || item.author_name || ""} · ${item.slug || ""}`),
    button
  ]);
}
