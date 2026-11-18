(function () {
  document.querySelectorAll("[data-kk-filter]").forEach(function (root) {
    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-continent]"));
    var status = root.querySelector("[data-kk-count]");
    var select = root.querySelector("select");

    function apply() {
      var on = root.querySelector("[data-continent-value].is-on");
      var continent = on ? on.getAttribute("data-continent-value") : "all";
      var region = select ? select.value : "all";
      var shown = 0;
      cards.forEach(function (card) {
        var ok = (continent === "all" || card.getAttribute("data-continent") === continent) &&
          (region === "all" || card.getAttribute("data-region") === region);
        card.hidden = !ok;
        if (ok) shown += 1;
      });
      var noun = root.getAttribute("data-kk-noun") || "recipe";
      var label = shown === 1 ? noun : (noun === "title" ? "titles" : "recipes");
      if (status) status.textContent = shown + " " + label;
    }

    var wanted = new URLSearchParams(location.search).get("continent");
    if (wanted) {
      var match = Array.prototype.find.call(root.querySelectorAll("[data-continent-value]"), function (button) {
        return button.getAttribute("data-continent-value") === wanted;
      });
      if (match) {
        root.querySelectorAll("[data-continent-value]").forEach(function (item) {
          item.classList.toggle("is-on", item === match);
          item.setAttribute("aria-pressed", item === match ? "true" : "false");
        });
      }
    }
    root.addEventListener("click", function (ev) {
      var button = ev.target.closest("[data-continent-value]");
      if (!button || !root.contains(button)) return;
      root.querySelectorAll("[data-continent-value]").forEach(function (item) {
        item.classList.toggle("is-on", item === button);
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      apply();
    });
    if (select) select.addEventListener("change", apply);
    apply();
  });
})();
