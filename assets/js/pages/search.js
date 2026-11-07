export async function init() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("q");
  const list = document.getElementById("results");
  const status = document.getElementById("search-status");
  if (!form || !input || !list) return;
  const params = new URLSearchParams(location.search);
  if (params.get("q")) input.value = params.get("q");

  function apply() {
    const query = input.value.trim().toLowerCase();
    let shown = 0;
    for (const item of list.querySelectorAll("[data-search]")) {
      const hay = item.dataset.search || "";
      const match = !query || hay.includes(query);
      item.hidden = !match;
      if (match) shown += 1;
    }
    if (status) {
      status.textContent = query
        ? `${shown} ${shown === 1 ? "entry" : "entries"} for “${input.value.trim()}”.`
        : `${shown} entries across the Flying sites that have published a catalog.`;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = new URL(location.href);
    const query = input.value.trim();
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    history.replaceState(null, "", url);
    apply();
  });
  input.addEventListener("input", apply);
  apply();
}
