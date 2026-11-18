(function () {
  var list = document.getElementById("results");
  var status = document.getElementById("search-status");
  var empty = document.getElementById("search-empty");
  var input = document.getElementById("q");
  var land = document.getElementById("kk-land");
  var form = document.getElementById("search-form");
  if (!list || !input || !form) return;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }

  function atlas(item) {
    var mark = "";
    if (Number.isFinite(item.lat) && Number.isFinite(item.lon)) {
      var x = ((item.lon + 180) / 360) * 144 + 8;
      var y = ((90 - item.lat) / 180) * 72 + 4;
      mark = '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4.2" fill="#e2b007" stroke="#1a1a1a" stroke-width="0.7"/>';
    }
    var inner = land ? land.innerHTML : '<rect width="160" height="80" fill="#f4f0e8"/>';
    var size = item.title.length > 18 ? 11 : 14;
    var compass = '<g transform="translate(128 6) scale(0.34)"><circle cx="32" cy="32" r="28" fill="#f4f0e8" stroke="#1a1a1a" stroke-width="1.4"/><path d="M32 6 L36 32 L32 26 L28 32 Z" fill="#c6a15b"/><path d="M32 58 L28 32 L32 38 L36 32 Z" fill="#1a1a1a"/></g>';
    return '<svg class="kk-plate-svg" viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#f4f0e8"/><g transform="translate(8 2) scale(0.9)">' + inner + "</g>" + mark + compass + '<text x="8" y="82" fill="#1a1a1a" font-family="Georgia, serif" font-size="' + size + '">' + esc(item.title) + "</text></svg>";
  }

  function thumb(item) {
    if (item.thumb) return '<img src="' + esc(item.thumb) + '" alt="" width="160" height="90">';
    return atlas(item);
  }

  fetch("/assets/search-index.json").then(function (response) { return response.json(); }).then(function (items) {
    function render() {
      var raw = input.value.trim();
      var query = raw.toLowerCase();
      if (!query) {
        list.innerHTML = "";
        if (empty) empty.hidden = true;
        if (status) status.textContent = items.length + " recipes. Type a dish, a country, or a guide.";
        return;
      }
      var found = items.filter(function (item) {
        return (item.title + " " + item.text + " " + item.section + " " + (item.country || "") + " " + (item.region || "")).toLowerCase().includes(query);
      }).slice(0, 24);
      if (status) status.textContent = found.length + (found.length === 1 ? " recipe" : " recipes") + " for “" + raw + "”.";
      if (empty) empty.hidden = found.length > 0;
      list.innerHTML = found.map(function (item) {
        var place = [item.country, item.region].filter(Boolean).join(" · ");
        return '<a class="kk-hit" href="' + esc(item.href) + '">' + thumb(item) +
          '<span><span class="kk-kicker">' + esc(item.section) + '</span><strong>' + esc(item.title) +
          '</strong>' + (place ? '<span class="kk-meta">' + esc(place) + "</span>" : "") + "</span></a>";
      }).join("");
    }

    function sync() {
      var url = new URL(location.href);
      var query = input.value.trim();
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      history.replaceState(null, "", url);
      render();
    }

    var params = new URLSearchParams(location.search);
    if (params.get("q")) input.value = params.get("q");
    input.addEventListener("input", sync);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      sync();
    });
    render();
  });
})();
