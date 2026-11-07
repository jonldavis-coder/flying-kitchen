import { el, friendlyError } from "../lib/dom.js";
import { formatWhen } from "../lib/format.js";

export async function init(adapter) {
  const slot = document.getElementById("moderate-root");
  if (!slot) return;
  try {
    const queue = await adapter.listModeration();
    const comments = el("div", { class: "stack" });
    if (!queue.comments.length) comments.append(el("p", {}, "No comments are stored in this browser."));
    for (const comment of queue.comments) {
      const button = el("button", { type: "button", class: "button-quiet" }, comment.hidden ? "Show" : "Hide");
      button.addEventListener("click", async () => {
        button.disabled = true;
        await adapter.setCommentHidden(comment.id, !comment.hidden);
        location.reload();
      });
      comments.append(el("article", { class: "comment" }, [
        el("h3", {}, comment.authorName || "Reader"),
        el("p", { class: "meta" }, `${comment.slug} · ${formatWhen(comment.createdAt)}${comment.hidden ? " · hidden" : ""}`),
        el("p", {}, comment.body),
        button
      ]));
    }
    const reports = el("ul", {});
    if (!queue.reports.length) reports.append(el("li", {}, "No reports are stored in this browser."));
    for (const report of queue.reports) {
      reports.append(el("li", {}, `${report.reason}: ${report.note || "No note."} (${formatWhen(report.createdAt)})`));
    }
    slot.replaceChildren(
      el("h2", {}, "Comments in this browser"),
      comments,
      el("h2", {}, "Reports in this browser"),
      reports
    );
  } catch (error) {
    slot.replaceChildren(el("p", {}, friendlyError(error)), el("p", {}, [el("a", { href: "login.html?next=moderate.html" }, "Sign in")]));
  }
}
