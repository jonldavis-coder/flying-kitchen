(function () {
  var links = document.querySelectorAll(".kk-map a");
  if (!links.length) return;
  var tip = document.createElement("div");
  tip.className = "kk-tip";
  tip.setAttribute("role", "status");
  tip.hidden = true;
  document.body.appendChild(tip);

  function label(el) {
    var name = el.getAttribute("data-place") || "";
    var count = el.getAttribute("data-count") || "0";
    return name + " · " + count + (count === "1" ? " recipe" : " recipes");
  }

  function place(ev) {
    var x = (ev.clientX || 24) + 14;
    var y = (ev.clientY || 24) + 16;
    tip.style.left = Math.max(8, Math.min(x, window.innerWidth - tip.offsetWidth - 8)) + "px";
    tip.style.top = Math.max(8, Math.min(y, window.innerHeight - 48)) + "px";
  }

  var list = Array.prototype.slice.call(links);
  links.forEach(function (link) {
    if (!link.getAttribute("aria-label")) link.setAttribute("aria-label", label(link));
    link.addEventListener("pointerenter", function (ev) {
      tip.textContent = label(link);
      tip.hidden = false;
      place(ev);
    });
    link.addEventListener("pointermove", function (ev) {
      if (!tip.hidden && ev.pointerType === "mouse") place(ev);
    });
    link.addEventListener("pointerleave", function () { tip.hidden = true; });
    link.addEventListener("focus", function () {
      tip.textContent = label(link);
      tip.hidden = false;
      var box = link.getBoundingClientRect();
      tip.style.left = Math.max(8, box.left) + "px";
      tip.style.top = Math.min(window.innerHeight - 48, box.bottom + 8) + "px";
    });
    link.addEventListener("blur", function () { tip.hidden = true; });
    link.addEventListener("keydown", function (ev) {
      var key = ev.key;
      if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "ArrowDown" && key !== "ArrowUp") return;
      var index = list.indexOf(link);
      var next = key === "ArrowRight" || key === "ArrowDown" ? index + 1 : index - 1;
      if (next < 0) next = list.length - 1;
      if (next >= list.length) next = 0;
      ev.preventDefault();
      list[next].focus();
    });
    link.addEventListener("click", function (ev) {
      if (ev.pointerType !== "touch") return;
      if (link.dataset.armed !== "1") {
        ev.preventDefault();
        link.dataset.armed = "1";
        tip.textContent = label(link) + " · tap again to open";
        tip.hidden = false;
        place(ev);
      }
    });
  });
})();
