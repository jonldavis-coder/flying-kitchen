(function () {
  var root = document.getElementById("kk-days");
  if (!root) return;
  var cards = Array.prototype.slice.call(root.querySelectorAll("[data-day]"));
  var count = document.querySelector("[data-day-count]");
  var current = "all";

  function apply() {
    var shown = 0;
    cards.forEach(function (card) {
      var continents = (card.getAttribute("data-continents") || "").split(/\s+/);
      var ok = current === "all" || continents.indexOf(current) !== -1;
      card.hidden = !ok;
      if (ok) shown += 1;
    });
    if (count) count.textContent = shown + (shown === 1 ? " day" : " days");
  }

  document.addEventListener("click", function (event) {
    var chip = event.target.closest("[data-day-continent]");
    if (chip) {
      current = chip.getAttribute("data-day-continent");
      document.querySelectorAll("[data-day-continent]").forEach(function (button) {
        var on = button === chip;
        button.classList.toggle("is-on", on);
        button.setAttribute("aria-pressed", on ? "true" : "false");
      });
      apply();
      return;
    }
    if (event.target.closest("[data-surprise]")) {
      var visible = cards.filter(function (card) { return !card.hidden; });
      if (!visible.length) return;
      var pick = visible[Math.floor(Math.random() * visible.length)];
      var link = pick.querySelector("a");
      if (link) location.href = link.href;
    }
  });
  apply();
})();
