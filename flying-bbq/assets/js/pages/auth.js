import { armForm, readFormMeta } from "../lib/human.js";
import { friendlyError } from "../lib/dom.js";
import { safeNextPath } from "../lib/validate.js";
import { siteUrl } from "../lib/url.js";

export async function init(adapter) {
  const params = new URLSearchParams(location.search);
  const next = safeNextPath(params.get("next") || "index.html");
  const session = await adapter.getSession();
  if (session && !params.get("magic")) {
    location.replace(siteUrl(next));
    return;
  }
  if (params.get("magic") && adapter.mode === "demo") {
    const box = document.getElementById("auth-status");
    try {
      await adapter.completeMagicLink(params.get("magic"));
      box.textContent = "You are signed in.";
      location.replace(siteUrl(next));
      return;
    } catch (error) {
      box.textContent = friendlyError(error);
    }
  }

  for (const form of document.querySelectorAll("form[data-auth]")) armForm(form);

  document.getElementById("signin-form")?.addEventListener("submit", (event) => submit(event, async (data, meta) => {
    await adapter.signIn({ email: data.get("email"), password: data.get("password") }, meta);
    location.href = siteUrl(next);
  }));

  document.getElementById("signup-form")?.addEventListener("submit", (event) => submit(event, async (data, meta) => {
    const result = await adapter.signUp({
      email: data.get("email"),
      password: data.get("password"),
      displayName: data.get("displayName")
    }, meta);
    if (result?.pendingConfirmation) {
      document.getElementById("auth-status").textContent = "Check your email to confirm the account, then sign in.";
      return;
    }
    location.href = siteUrl(next);
  }));

  document.getElementById("magic-form")?.addEventListener("submit", (event) => submit(event, async (data, meta) => {
    const result = await adapter.requestMagicLink({ email: data.get("email") }, meta);
    const box = document.getElementById("auth-status");
    box.textContent = "";
    box.append(result.message);
    if (result.demo && result.token) {
      const link = document.createElement("a");
      const returnTo = params.get("next");
      const href = `login.html?magic=${encodeURIComponent(result.token)}${returnTo ? `&next=${encodeURIComponent(returnTo)}` : ""}`;
      link.href = href;
      link.textContent = "Open the one-time sign-in link";
      box.append(document.createElement("br"), link);
    }
  }));
}

async function submit(event, action) {
  event.preventDefault();
  const form = event.currentTarget;
  const error = form.querySelector(".form-error");
  error.textContent = "";
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    await action(new FormData(form), readFormMeta(form));
  } catch (err) {
    error.textContent = friendlyError(err);
    button.disabled = false;
  }
}
