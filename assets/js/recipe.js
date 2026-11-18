(function () {
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-print]");
    if (button) window.print();
  });

  document.querySelectorAll(".ingredients li").forEach(function (item) {
    if (item.querySelector(".kk-check")) return;
    var box = document.createElement("input");
    box.type = "checkbox";
    box.className = "kk-check";
    box.setAttribute("aria-label", "Mark ingredient");
    item.prepend(box);
  });

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

  function render(next) {
    var servings = Math.max(1, Math.min(24, next));
    count.textContent = servings + (servings === 1 ? " serving" : " servings");
    var factor = servings / base;
    list.querySelectorAll("li").forEach(function (item) {
      var box = item.querySelector(".kk-check");
      var text = scale(item.dataset.base, factor);
      item.textContent = "";
      if (box) item.appendChild(box);
      item.appendChild(document.createTextNode(text));
    });
  }

  control.addEventListener("click", function (event) {
    var step = event.target.closest("[data-serves]");
    if (!step) return;
    var current = Number((count.textContent.match(/(\d+)/) || [0, base])[1]);
    render(current + Number(step.getAttribute("data-serves")));
  });
  render(base);
})();
