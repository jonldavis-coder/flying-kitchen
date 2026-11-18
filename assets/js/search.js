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

  function atlas(lat, lon) {
    var mark = "";
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      var x = ((lon + 180) / 360) * 160;
      var y = ((90 - lat) / 180) * 80;
      mark = '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6.5" fill="#e2b007" stroke="#1a1a1a" stroke-width="0.8"/>';
    }
    var inner = land ? land.innerHTML : '<rect width="160" height="80" fill="#f4f0e8"/>';
    return '<svg class="kk-pin" viewBox="0 0 160 80" aria-hidden="true">' + inner + mark + "</svg>";
  }

  function thumb(item) {
    if (item.thumb) return '<img src="' + esc(item.thumb) + '" alt="" width="160" height="120">';
    return atlas(item.lat, item.lon);
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
