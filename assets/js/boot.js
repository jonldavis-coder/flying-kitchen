import { getAdapter } from "./adapter.js";
import { mountChrome } from "./chrome.js";

const pages = {
  auth: () => import("./pages/auth.js"),
  entry: () => import("./pages/entry.js"),
  search: () => import("./pages/search.js"),
  map: () => import("./pages/map.js"),
  moderate: () => import("./pages/moderate.js"),
  submit: () => import("./pages/submit.js")
};

async function start() {
  const adapter = await getAdapter();
  await mountChrome(adapter);
  const name = document.body.dataset.page || "static";
  if (!pages[name]) return;
  const mod = await pages[name]();
  await mod.init(adapter);
}

start().catch((error) => {
  console.error(error);
  const banner = document.getElementById("demo-banner");
  if (banner) {
    banner.hidden = false;
    banner.textContent = "This page did not finish loading. Refresh and try again.";
  }
});
