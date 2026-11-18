import { el } from "./lib/dom.js";

const DEMO_TEXT = "Demo mode: comments, hearts, ratings, twists, and submitted sauces are saved only in this browser.";

export function mountChrome(adapter) {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const banner = document.getElementById("demo-banner");
  if (banner) {
    if (adapter.mode === "demo") {
      banner.hidden = false;
      banner.textContent = adapter.fallbackReason ? `${DEMO_TEXT} ${adapter.fallbackReason}` : DEMO_TEXT;
    } else {
      banner.hidden = true;
    }
  }

  const modeNote = document.getElementById("mode-note");
  if (modeNote) {
    modeNote.textContent = adapter.mode === "demo"
      ? "Demo mode: community notes stay in this browser until Supabase is connected."
      : "Community notes are stored in the shared project.";
  }

  const ads = window.FLYING_SAUCES_ADS || { provider: "none" };
  const enabled = ads.provider && ads.provider !== "none";
  document.querySelectorAll(".ad-slot").forEach((slot) => {
    if (!enabled) {
      slot.hidden = true;
      return;
    }
    slot.hidden = false;
    if (!slot.childElementCount) {
      const label = document.createElement("p");
      label.className = "ad-label";
      label.textContent = "Advertisement";
      slot.append(label);
    }
  });

  return refreshAuth(adapter);
}

export async function refreshAuth(adapter) {
  const slot = document.getElementById("auth-slot");
  if (!slot) return null;
  const session = await adapter.getSession();
  slot.replaceChildren();
  if (!session) {
    const link = el("a", { href: "login.html" }, "Sign in");
    if (document.body.dataset.page === "auth") link.setAttribute("aria-current", "page");
    slot.append(link);
    return null;
  }
  if (session.isOwner && document.body.dataset.page !== "moderate") {
    slot.append(el("a", { href: "moderate.html" }, "Moderate"));
  }
  slot.append(el("span", { class: "who" }, session.displayName));
  const button = el("button", { type: "button", class: "linkish" }, "Sign out");
  button.addEventListener("click", async () => {
    button.disabled = true;
    await adapter.signOut();
    location.reload();
  });
  slot.append(button);
  return session;
}
