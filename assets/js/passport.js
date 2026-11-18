(function () {
  var KEY = "kk-passport";

  function read() {
    try {
      var list = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(list) ? list.filter(function (href) { return typeof href === "string"; }) : [];
    } catch (error) {
      return [];
    }
  }

  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (error) { /* keep the choice for this page */ }
  }

  function paintSave(button, saved) {
    button.textContent = saved ? "Saved" : "Save";
    button.classList.toggle("is-on", saved);
    button.setAttribute("aria-pressed", saved ? "true" : "false");
  }

  var save = document.querySelector("[data-save]");
  if (save) {
    var href = location.pathname.endsWith("/") ? location.pathname : location.pathname + "/";
    paintSave(save, read().indexOf(href) >= 0);
    save.addEventListener("click", function () {
      var list = read();
      var index = list.indexOf(href);
      if (index >= 0) list.splice(index, 1);
      else list.unshift(href);
      write(list);
      paintSave(save, index < 0);
    });
  }

  var plate = document.querySelector(".kk-passport-plate");
  if (!plate) return;
  var stamps = document.getElementById("kk-stamps");
  var listEl = document.querySelector("[data-passport-list]");
  var empty = document.querySelector("[data-passport-empty]");
  var countEl = document.querySelector("[data-passport-count]");
  var caption = document.querySelector("[data-passport-caption]");
  var lede = document.querySelector("[data-passport-lede]");

  fetch("/assets/passport-index.json").then(function (response) {
    return response.json();
  }).then(function (index) {
    var byHref = {};
    index.forEach(function (item) { byHref[item.href] = item; });
    function render() {
      var saved = read().map(function (href) { return byHref[href]; }).filter(Boolean);
      var countries = {};
      saved.forEach(function (item) {
        if (item.country) countries[item.country] = item;
      });
      var names = Object.keys(countries);
      if (stamps) {
        stamps.innerHTML = names.map(function (name) {
          var item = countries[name];
          if (item.lat == null || item.lon == null) return "";
          var x = ((item.lon + 180) / 360) * 640;
          var y = ((90 - item.lat) / 180) * 360;
          return '<g class="kk-stamp" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><circle r="8" fill="#e2b007" stroke="#fffdfb" stroke-width="2"/><circle r="8" fill="none" stroke="#1a1a1a" stroke-width="1.2"/><title>' + name.replace(/</g, "") + "</title></g>";
        }).join("");
      }
      if (!saved.length) {
        if (empty) empty.hidden = false;
        if (listEl) listEl.hidden = true;
        if (countEl) countEl.hidden = true;
        if (caption) caption.textContent = "No stamps yet.";
        if (lede) lede.textContent = "Save a recipe and it earns a stamp. The list stays in this browser. Nothing is sent on.";
        return;
      }
      if (empty) empty.hidden = true;
      if (listEl) {
        listEl.hidden = false;
        listEl.innerHTML = saved.map(function (item) {
          return "<li><a href=\"" + item.href + "\">" + item.title.replace(/</g, "") + "</a> <span class=\"kk-meta\">" + [item.country, item.section].filter(Boolean).join(" · ").replace(/</g, "") + "</span></li>";
        }).join("");
      }
      if (countEl) {
        countEl.hidden = false;
        countEl.textContent = names.length + (names.length === 1 ? " country tasted" : " countries tasted") + " · " + saved.length + (saved.length === 1 ? " recipe" : " recipes");
      }
      if (caption) caption.textContent = names.join(" · ") + ".";
      if (lede) lede.textContent = "Saved in this browser. Nothing is sent on.";
    }
    render();
    window.addEventListener("storage", function (event) {
      if (event.key === KEY) render();
    });
  });
})();
