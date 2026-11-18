(function () {
  var list = document.getElementById("results");
  var status = document.getElementById("search-status");
  var empty = document.getElementById("search-empty");
  var input = document.getElementById("q");
  var land = document.getElementById("kk-land");
  var form = document.getElementById("search-form");
  var countrySelect = document.getElementById("search-country");
  var mealButtons = Array.prototype.slice.call(document.querySelectorAll("[data-meal]"));
  if (!list || !input || !form) return;
  var meal = "all";

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
    var compass = '<g transform="translate(128 6) scale(0.34)"><circle cx="32" cy="32" r="28" fill="#f4f0e8" stroke="#1a1a1a" stroke-width="1.4"/><path d="M32 6 L36 32 L32 26 L28 32 Z" fill="#c6a15b"/><path d="M32 58 L28 32 L32 38 L36 32 Z" fill="#1a1a1a"/></g>';
    return '<svg class="kk-plate-svg" viewBox="0 0 160 90" role="img" aria-label="Atlas plate for ' + esc(item.title) + '"><rect width="160" height="90" fill="#f4f0e8"/><g transform="translate(8 2) scale(0.9)">' + inner + "</g>" + mark + compass + "</svg>";
  }

  function thumb(item) {
    if (item.thumb) return '<img src="' + esc(item.thumb) + '" alt="' + esc(item.title) + '" width="320" height="180">';
    return atlas(item);
  }

  fetch("/assets/search-index.json").then(function (response) { return response.json(); }).then(function (items) {
    if (countrySelect) {
      var countries = [];
      items.forEach(function (item) {
        if (item.country && countries.indexOf(item.country) === -1) countries.push(item.country);
      });
      countries.sort();
      countrySelect.innerHTML = '<option value="">All countries</option>' + countries.map(function (name) {
        return '<option value="' + esc(name) + '">' + esc(name) + "</option>";
      }).join("");
    }

    function render() {
      var raw = input.value.trim();
      var query = raw.toLowerCase();
      var country = countrySelect ? countrySelect.value : "";
      var filtering = Boolean(query || country || meal !== "all");
      if (!filtering) {
        list.innerHTML = "";
        if (empty) empty.hidden = true;
        if (status) status.textContent = items.length + " recipes. Type a dish, choose a country, or choose a meal.";
        return;
      }
      var found = items.filter(function (item) {
        if (country && item.country !== country) return false;
        if (meal !== "all" && (item.meals || []).indexOf(meal) === -1) return false;
        if (!query) return true;
        return (item.title + " " + item.text + " " + item.section + " " + (item.country || "") + " " + (item.region || "") + " " + (item.meals || []).join(" ")).toLowerCase().includes(query);
      }).sort(function (a, b) { return (a.thumb ? 0 : 1) - (b.thumb ? 0 : 1); }).slice(0, 36);
      var bits = [];
      if (query) bits.push("“" + raw + "”");
      if (country) bits.push(country);
      if (meal !== "all") bits.push(meal);
      if (status) status.textContent = found.length + (found.length === 1 ? " recipe" : " recipes") + (bits.length ? " for " + bits.join(", ") : "") + ".";
      if (empty) empty.hidden = found.length > 0;
      list.innerHTML = found.map(function (item) {
        var place = [item.country, (item.meals || []).join(" · "), item.section].filter(Boolean).join(" · ");
        return '<a class="kk-hit" href="' + esc(item.href) + '">' + thumb(item) +
          '<span><span class="kk-kicker">' + esc(place) + '</span><strong>' + esc(item.title) +
          '</strong>' + (item.text ? '<span class="kk-dek">' + esc(item.text) + "</span>" : "") + "</span></a>";
      }).join("");
    }

    function sync() {
      var url = new URL(location.href);
      var query = input.value.trim();
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      if (countrySelect && countrySelect.value) url.searchParams.set("country", countrySelect.value);
      else url.searchParams.delete("country");
      if (meal !== "all") url.searchParams.set("meal", meal);
      else url.searchParams.delete("meal");
      history.replaceState(null, "", url);
      render();
    }

    var params = new URLSearchParams(location.search);
    if (params.get("q")) input.value = params.get("q");
    if (params.get("meal")) meal = params.get("meal");
    mealButtons.forEach(function (button) {
      var on = button.getAttribute("data-meal") === meal;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.addEventListener("click", function () {
        meal = button.getAttribute("data-meal");
        mealButtons.forEach(function (other) {
          var active = other === button;
          other.classList.toggle("is-on", active);
          other.setAttribute("aria-pressed", active ? "true" : "false");
        });
        sync();
      });
    });
    if (countrySelect) {
      if (params.get("country")) countrySelect.value = params.get("country");
      countrySelect.addEventListener("change", sync);
    }
    input.addEventListener("input", sync);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      sync();
    });
    render();
  });
})();
