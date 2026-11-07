import { el, friendlyError } from "../lib/dom.js";
import { armForm, readFormMeta } from "../lib/human.js";
import { formatWhen } from "../lib/format.js";

export async function init(adapter) {
  const form = document.getElementById("suggest-form");
  const list = document.getElementById("suggestion-list");
  const session = await adapter.getSession();
  if (list) {
    const mine = await adapter.listSuggestions();
    list.replaceChildren();
    if (!session) {
      list.append(el("p", {}, ["Sign in to keep a suggestion in this browser. ", el("a", { href: "login.html?next=submit.html" }, "Sign in")]));
    } else if (!mine.length) {
      list.append(el("p", {}, "You have no suggestions stored in this browser."));
    } else {
      for (const item of mine) {
        list.append(el("li", {}, [
          el("a", { href: item.url }, item.title),
          ` · ${formatWhen(item.createdAt)}`,
          item.note ? el("p", {}, item.note) : ""
        ]));
      }
    }
  }
  if (!form) return;
  armForm(form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = form.querySelector(".form-error");
    error.textContent = "";
    if (!session) {
      error.textContent = "Sign in first. Suggestions stay in this browser.";
      return;
    }
    const data = new FormData(form);
    try {
      await adapter.addSuggestion({
        title: data.get("title"),
        url: data.get("url"),
        note: data.get("note")
      }, readFormMeta(form));
      location.reload();
    } catch (err) {
      error.textContent = friendlyError(err);
    }
  });
}
