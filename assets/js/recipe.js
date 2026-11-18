(function () {
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-print]");
    if (button) window.print();
  });

  function markable(item, label) {
    var box = item.querySelector(".kk-check");
    if (!box) {
      box = document.createElement("input");
      box.type = "checkbox";
      box.className = "kk-check";
      box.setAttribute("aria-label", label);
      item.prepend(box);
    }
    if (item.dataset.markable) return box;
    item.dataset.markable = "1";
    box.addEventListener("change", function () {
      item.classList.toggle("is-done", box.checked);
    });
    item.addEventListener("click", function (event) {
      if (event.target === box || event.target.closest("a, button")) return;
      box.checked = !box.checked;
      item.classList.toggle("is-done", box.checked);
    });
    return box;
  }

  document.querySelectorAll(".ingredients li").forEach(function (item) {
    markable(item, "Mark ingredient");
  });
  document.querySelectorAll("ol.steps > li").forEach(function (item) {
    if (!item.querySelector(".kk-step-text")) {
      var span = document.createElement("span");
      span.className = "kk-step-text";
      while (item.firstChild) span.appendChild(item.firstChild);
      item.appendChild(span);
    }
    markable(item, "Mark step done");
  });

  var cook = document.querySelector("[data-cook]");
  var tools = document.querySelector(".kk-tools");
  if (!cook && tools) {
    cook = document.createElement("button");
    cook.type = "button";
    cook.className = "kk-button quiet";
    cook.setAttribute("data-cook", "");
    cook.setAttribute("aria-pressed", "false");
    cook.textContent = "Cook mode";
    tools.appendChild(cook);
  }
  if (cook) {
    var note = document.createElement("p");
    note.className = "kk-cook-note no-print";
    note.setAttribute("data-cook-note", "");
    note.hidden = true;
    note.textContent = "This browser will not hold the screen awake. Leave the display on while you cook.";
    cook.closest("p").after(note);
    var sentinel = null;
    var wanted = false;
    function showFallback() {
      note.hidden = false;
    }
    function holdScreen() {
      if (!navigator.wakeLock || !navigator.wakeLock.request) {
        showFallback();
        return;
      }
      navigator.wakeLock.request("screen").then(function (lock) {
        sentinel = lock;
        note.hidden = true;
        lock.addEventListener("release", function () { sentinel = null; });
      }).catch(function () {
        showFallback();
      });
    }
    function setCook(on) {
      wanted = on;
      cook.classList.toggle("is-on", on);
      cook.setAttribute("aria-pressed", on ? "true" : "false");
      document.body.classList.toggle("kk-cooking", on);
      if (!on) {
        note.hidden = true;
        if (sentinel) sentinel.release();
        return;
      }
      holdScreen();
    }
    cook.addEventListener("click", function () {
      setCook(cook.getAttribute("aria-pressed") !== "true");
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && wanted && !sentinel) holdScreen();
    });
  }

  var serves = Array.prototype.find.call(document.querySelectorAll(".kk-info li"), function (item) {
    return /^Serves\s+\d+/i.test(item.textContent.trim());
  });
  var list = document.querySelector(".ingredients");
  if (!serves || !list) return;
  var base = Number((serves.textContent.match(/(\d+)/) || [])[1]);
  if (!base) return;
  list.querySelectorAll("li").forEach(function (item) {
    item.dataset.base = item.textContent.replace(/\s+/g, " ").trim();
  });
  var control = document.querySelector(".kk-servings");
  if (!control) {
    control = document.createElement("p");
    control.className = "kk-servings no-print";
    control.innerHTML = '<button type="button" class="kk-button quiet" data-serves="-1" aria-label="Fewer servings">−</button><span data-serves-count></span><button type="button" class="kk-button quiet" data-serves="1" aria-label="More servings">+</button>';
    serves.closest(".kk-info").after(control);
  }
  var count = control.querySelector("[data-serves-count]");

  function parseAmount(token) {
    var mixed = token.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    var frac = token.match(/^(\d+)\/(\d+)$/);
    if (frac) return Number(frac[1]) / Number(frac[2]);
    return Number(token);
  }

  function formatAmount(value) {
    if (!Number.isFinite(value) || value <= 0) return String(value);
    var whole = Math.floor(value + 1e-6);
    var rest = value - whole;
    var fracs = [[1, 8], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4]];
    var best = null;
    fracs.forEach(function (pair) {
      var diff = Math.abs(rest - pair[0] / pair[1]);
      if (!best || diff < best.diff) best = { diff: diff, text: pair[0] + "/" + pair[1] };
    });
    if (best && best.diff < 0.04) {
      if (whole && best.text !== "0/1") return whole + " " + best.text;
      return best.text;
    }
    var rounded = Math.round(value * 100) / 100;
    return String(rounded);
  }

  function scale(text, factor) {
    return text.replace(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(?!\s*°)/g, function (token) {
      return formatAmount(parseAmount(token) * factor);
    });
  }

  var units = "us";
  try { units = localStorage.getItem("kk-units") === "metric" ? "metric" : "us"; } catch (error) { units = "us"; }

  function roundMetric(value, unit) {
    if (unit === "ml" || unit === "g") {
      if (value >= 100) return Math.round(value / 5) * 5;
      if (value >= 15) return Math.round(value);
      return Math.round(value * 2) / 2;
    }
    return Math.round(value);
  }

  function toMetric(text) {
    return text.replace(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(fl\.?\s*oz|fluid ounces?|tablespoons?|teaspoons?|cups?|pounds?|ounces?|°\s*F|degrees?\s+F|inches?)/gi, function (all, num, unit, offset) {
      if (/°|degrees/i.test(unit) && /°\s*C/i.test(text.slice(offset, offset + all.length + 14))) return all;
      var value = parseAmount(num);
      var key = unit.toLowerCase().replace(/\./g, "");
      var amount;
      var name;
      if (key === "teaspoon" || key === "teaspoons") { amount = value * 5; name = "ml"; }
      else if (key === "tablespoon" || key === "tablespoons") { amount = value * 15; name = "ml"; }
      else if (key === "cup" || key === "cups") { amount = value * 240; name = "ml"; }
      else if (key === "fl oz" || key === "fluid ounce" || key === "fluid ounces") { amount = value * 30; name = "ml"; }
      else if (key === "pound" || key === "pounds") { amount = value * 454; name = "g"; }
      else if (key === "ounce" || key === "ounces") { amount = value * 28; name = "g"; }
      else if (key === "inch" || key === "inches") { amount = value * 2.54; name = "cm"; }
      else { amount = (value - 32) * 5 / 9; name = "°C"; }
      var shown = name === "cm" ? (Math.round(amount * 10) / 10) : name === "°C" ? Math.round(amount) : roundMetric(amount, name);
      return shown + " " + name;
    });
  }

  function render(next) {
    var servings = Math.max(1, Math.min(24, next));
    count.textContent = servings + (servings === 1 ? " serving" : " servings");
    var factor = servings / base;
    list.querySelectorAll("li").forEach(function (item) {
      var box = item.querySelector(".kk-check");
      var text = scale(item.dataset.base, factor);
      if (units === "metric") text = toMetric(text);
      item.textContent = "";
      if (box) item.appendChild(box);
      item.appendChild(document.createTextNode(text));
    });
    document.querySelectorAll(".kk-units [data-units]").forEach(function (button) {
      var on = button.getAttribute("data-units") === units;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  document.querySelectorAll(".kk-units [data-units]").forEach(function (button) {
    button.addEventListener("click", function () {
      units = button.getAttribute("data-units");
      try { localStorage.setItem("kk-units", units); } catch (error) { /* keep the choice for this page */ }
      var current = Number((count.textContent.match(/(\d+)/) || [0, base])[1]);
      render(current);
    });
  });

  control.addEventListener("click", function (event) {
    var step = event.target.closest("[data-serves]");
    if (!step) return;
    var current = Number((count.textContent.match(/(\d+)/) || [0, base])[1]);
    render(current + Number(step.getAttribute("data-serves")));
  });
  render(base);
})();
