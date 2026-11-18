const list = document.getElementById("results");
const status = document.getElementById("search-status");
const input = document.getElementById("q");
if (list && input) {
  fetch("/assets/search-index.json").then((response) => response.json()).then((items) => {
    function esc(value) {
      return String(value).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
    }
    function render() {
      const query = input.value.trim().toLowerCase();
      const found = items.filter((item) => !query || `${item.title} ${item.text} ${item.section}`.toLowerCase().includes(query)).slice(0, 40);
      status.textContent = `${found.length} shown`;
      list.innerHTML = found.map((item) => `<li><a href="${esc(item.href)}">${esc(item.title)}</a> <span class="kk-meta">${esc(item.section)}</span></li>`).join("");
    }
    const params = new URLSearchParams(location.search);
    if (params.get("q")) input.value = params.get("q");
    input.addEventListener("input", render);
    document.getElementById("search-form").addEventListener("submit", (event) => {
      event.preventDefault();
      render();
    });
    render();
  });
}
