import { SLOTS, countriesDiffer, countriesFor, parsePlan, recipesFor, serializePlan } from "./planner-model.mjs";
import { qrModules } from "./qr-card.mjs";

const KEY = "kk-journeys";
const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function project(lon, lat) {
  return [((Number(lon) + 180) / 360) * 960, ((90 - Number(lat)) / 180) * 480];
}

function savedJourneys() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function storeJourneys(list) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 12)));
}

function drawQr(canvas, text) {
  const grid = qrModules(text);
  const quiet = 2;
  const span = grid.length + quiet * 2;
  const cell = Math.floor(canvas.width / span);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f6f1e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1a1a1a";
  grid.forEach((row, y) => row.forEach((on, x) => {
    if (on) ctx.fillRect((x + quiet) * cell, (y + quiet) * cell, cell, cell);
  }));
}

async function loadData() {
  const response = await fetch("/assets/planner.json");
  return response.json();
}

function countryBySlug(data, slug) {
  return data.countries.find((country) => country.slug === slug);
}

function recipeBySlug(data, slug) {
  return data.recipes.find((recipe) => recipe.slug === slug);
}

function drawMap(data, slots) {
  const map = document.getElementById("kk-plan-map");
  const lands = document.getElementById("kk-plan-lands");
  const pins = document.getElementById("kk-plan-pins");
  const flight = document.getElementById("kk-plan-flight");
  if (!map || !lands || !pins || !flight) return;
  const chosen = new Set(SLOTS.map((slot) => slots[slot.key]?.country).filter(Boolean));
  lands.innerHTML = data.countries.map((country) => {
    if (!country.d) return "";
    const on = chosen.has(country.slug) ? " is-on" : "";
    return `<path data-iso="${country.slug}" class="${on.trim()}" d="${country.d}" tabindex="0" role="button" aria-label="${country.name}"><title>${country.name}</title></path>`;
  }).join("");
  const line = SLOTS.map((slot) => {
    const stop = slots[slot.key];
    if (!stop) return null;
    const country = countryBySlug(data, stop.country);
    return country ? { slot, country, xy: project(country.lon, country.lat) } : null;
  }).filter(Boolean);
  const ghosts = document.getElementById("kk-plan-ghosts");
  if (ghosts) {
    ghosts.innerHTML = line.length >= 2 ? "" : (data.routes || []).map((route) => {
      const d = route.map(([lon, lat], index) => {
        const [x, y] = project(lon, lat);
        return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(" ");
      return `<path d="${d}"/>`;
    }).join("");
  }
  const tryRow = document.getElementById("kk-plan-try");
  if (tryRow) tryRow.hidden = line.length > 0;
  fitMap(map, line.map((stop) => stop.xy));
  if (line.length >= 2) {
    flight.setAttribute("d", line.map((stop, index) => `${index ? "L" : "M"}${stop.xy[0].toFixed(1)} ${stop.xy[1].toFixed(1)}`).join(" "));
    flight.classList.toggle("kk-flight-draw", !motion);
  } else flight.setAttribute("d", "");
  const plane = line.length >= 2 ? planeMark(line[line.length - 2].xy, line[line.length - 1].xy) : "";
  pins.innerHTML = line.map((stop) => {
    const [x, y] = stop.xy;
    const letter = stop.slot.meal[0];
    return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="#e2b007" stroke="#1a1a1a" stroke-width="1.4"/><text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle" font-size="14" font-family="Georgia, serif" fill="#1a1a1a">${letter}</text></g>`;
  }).join("") + plane;
}

function fitMap(map, points) {
  if (points.length < 2) {
    map.setAttribute("viewBox", "0 0 960 480");
    return;
  }
  let minX = Math.min(...points.map((point) => point[0]));
  let maxX = Math.max(...points.map((point) => point[0]));
  let minY = Math.min(...points.map((point) => point[1]));
  let maxY = Math.max(...points.map((point) => point[1]));
  const padX = Math.max(90, (maxX - minX) * 0.45);
  const padY = Math.max(70, (maxY - minY) * 0.55);
  minX -= padX;
  maxX += padX;
  minY -= padY;
  maxY += padY;
  let width = Math.max(220, maxX - minX);
  let height = Math.max(140, maxY - minY);
  if (width / height < 1.7) width = height * 1.7;
  else height = width / 1.7;
  minX = Math.max(0, Math.min(minX, 960 - width));
  minY = Math.max(0, Math.min(minY, 480 - height));
  map.setAttribute("viewBox", `${minX.toFixed(1)} ${minY.toFixed(1)} ${Math.min(width, 960).toFixed(1)} ${Math.min(height, 480).toFixed(1)}`);
}

function planeMark(from, to) {
  const x = from[0] + (to[0] - from[0]) * 0.62;
  const y = from[1] + (to[1] - from[1]) * 0.62;
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI;
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})"><path d="M-8 0 L8 0 M2 -5 L8 0 L2 5" fill="none" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round"/></g>`;
}

function renderRecipes(data, slots, active) {
  const host = document.getElementById("kk-plan-recipes");
  const status = document.getElementById("kk-plan-status");
  if (!host) return;
  const slot = SLOTS.find((item) => item.key === active);
  const country = slots[active]?.country;
  if (!country || !slot) {
    host.innerHTML = "";
    return;
  }
  const place = countryBySlug(data, country);
  const grouped = recipesFor(data.recipes, country, slot.meal);
  const photos = grouped.primary.filter((recipe) => recipe.thumb);
  const showPlates = photos.length < 6;
  const visible = showPlates ? grouped.primary : photos;
  if (status) {
    status.textContent = grouped.primary.length
      ? `${place?.name || country}: ${slot.meal.toLowerCase()}.`
      : `${place?.name || country} has no ${slot.meal.toLowerCase()} dish that fits.`;
  }
  const tiles = visible.map((recipe) => recipeTile(recipe)).join("");
  const hidden = !showPlates && grouped.primary.length > photos.length
    ? `<p class="kk-plan-more"><button type="button" class="kk-button quiet" data-show-all>Show all</button></p>`
    : "";
  const more = grouped.more.length
    ? `<details class="kk-plan-sauces"><summary>More from ${place?.name || country}</summary><div class="kk-plan-recipes">${grouped.more.map((recipe) => recipeTile(recipe)).join("")}</div></details>`
    : "";
  host.innerHTML = `${tiles}${hidden}${more}`;
  host.querySelector("[data-show-all]")?.addEventListener("click", () => {
    const extra = grouped.primary.filter((recipe) => !recipe.thumb).map((recipe) => recipeTile(recipe)).join("");
    host.querySelector("[data-show-all]")?.parentElement?.remove();
    const sauces = host.querySelector(".kk-plan-sauces");
    if (sauces) sauces.insertAdjacentHTML("beforebegin", extra);
    else host.insertAdjacentHTML("beforeend", extra);
  });
}

function recipeTile(recipe) {
  const media = recipe.thumb
    ? `<img src="${recipe.thumb}" alt="" width="120" height="90">`
    : `<svg class="kk-plan-plate" viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="#f4f0e8"/><circle cx="60" cy="45" r="6" fill="#e2b007" stroke="#1a1a1a"/></svg>`;
  const meta = [recipe.minutes ? `${recipe.minutes} min` : "", recipe.ingredients ? `${recipe.ingredients} ingredients` : ""].filter(Boolean).join(" · ");
  return `<button type="button" class="kk-plan-card" data-recipe="${recipe.slug}">${media}<span class="kk-plan-copy"><strong>${recipe.title}</strong>${meta ? `<span class="kk-meta">${meta}</span>` : ""}</span></button>`;
}

function syncUrl(slots) {
  const query = serializePlan(slots);
  const hash = location.hash === "#card" ? "#card" : "#plan";
  history.replaceState(null, "", `${location.pathname}${query}${hash}`);
}

function fillCard(data, slots, title) {
  const list = document.getElementById("kk-card-stops");
  const mapHost = document.getElementById("kk-card-map");
  const urlNode = document.getElementById("kk-card-url");
  const titleInput = document.getElementById("kk-card-title");
  if (titleInput && title) titleInput.value = title;
  const share = `${location.origin}/journeys/${serializePlan(slots)}`;
  if (urlNode) urlNode.textContent = "kitekitchen.com/journeys";
  const qr = document.getElementById("kk-card-qr");
  if (qr) drawQr(qr, share);
  if (mapHost) {
    const source = document.getElementById("kk-plan-map");
    mapHost.innerHTML = source ? source.outerHTML.replace('id="kk-plan-map"', "") : "";
  }
  if (list) {
    list.innerHTML = SLOTS.map((slot) => {
      const stop = slots[slot.key];
      if (!stop) return "";
      const country = countryBySlug(data, stop.country);
      const recipe = recipeBySlug(data, stop.recipe);
      const media = recipe?.thumb
        ? `<img src="${recipe.thumb}" alt="" width="72" height="72">`
        : `<svg viewBox="0 0 72 72" aria-hidden="true"><rect width="72" height="72" fill="#f4f0e8"/><circle cx="36" cy="36" r="6" fill="#e2b007" stroke="#1a1a1a"/></svg>`;
      const meta = [country?.name || stop.country, recipe?.minutes ? `${recipe.minutes} min` : "", recipe?.ingredients ? `${recipe.ingredients} ingredients` : ""].filter(Boolean).join(" · ");
      return `<li><span class="kk-pin-num" aria-hidden="true">${SLOTS.indexOf(slot) + 1}</span><span class="kk-stop-copy"><span class="kk-meal">${slot.meal}</span><strong>${recipe?.title || stop.recipe}</strong><span class="kk-meta">${meta}</span></span>${media}</li>`;
    }).join("");
  }
  return share;
}

async function fillBook(slots, data) {
  const host = document.getElementById("kk-card-book");
  const box = document.getElementById("kk-card-booklet");
  if (!host) return;
  if (!box?.checked) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }
  const blocks = [];
  for (const slot of SLOTS) {
    const recipe = recipeBySlug(data, slots[slot.key]?.recipe);
    if (!recipe) continue;
    const html = await fetch(recipe.href).then((response) => response.text());
    const doc = new DOMParser().parseFromString(html, "text/html");
    const ingredients = doc.querySelector(".ingredients")?.innerText || "";
    const steps = doc.querySelector(".steps")?.innerText || "";
    blocks.push(`<section><h2>${slot.meal}: ${recipe.title}</h2><pre>${ingredients}</pre><pre>${steps}</pre></section>`);
  }
  host.innerHTML = blocks.join("");
  host.hidden = false;
}

function initPlan(data) {
  const slots = parsePlan(location.search);
  const opening = location.hash;
  let active = "b";
  const status = document.getElementById("kk-plan-status");
  const selects = [...document.querySelectorAll("[data-slot]")];
  function refillSelects() {
    selects.forEach((select) => {
      const key = select.getAttribute("data-slot");
      const meal = SLOTS.find((slot) => slot.key === key).meal;
      const taken = SLOTS.filter((slot) => slot.key !== key).map((slot) => slots[slot.key]?.country).filter(Boolean);
      const list = countriesFor(data.recipes, data.countries, meal, taken);
      const current = slots[key]?.country || "";
      const options = list.some((country) => country.slug === current) || !current
        ? list
        : list.concat(data.countries.filter((country) => country.slug === current));
      select.innerHTML = `<option value="">Choose a country</option>${options.map((country) => `<option value="${country.slug}">${country.name}</option>`).join("")}`;
      select.value = current;
    });
  }
  function usedElsewhere(slug, key) {
    return SLOTS.some((slot) => slot.key !== key && slots[slot.key]?.country === slug);
  }
  function refresh() {
    refillSelects();
    drawMap(data, slots);
    renderRecipes(data, slots, active);
    const ready = SLOTS.every((slot) => slots[slot.key]?.recipe) && countriesDiffer(slots);
    document.getElementById("kk-plan-card").disabled = !ready;
    document.getElementById("kk-plan-save").disabled = !ready;
    if (ready) syncUrl(slots);
    renderSaved();
  }
  function chooseCountry(slug) {
    if (!slug) {
      delete slots[active];
      refresh();
      return;
    }
    if (usedElsewhere(slug, active)) {
      if (status) status.textContent = "Choose three different countries.";
      return;
    }
    slots[active] = { country: slug, recipe: slots[active]?.country === slug ? slots[active].recipe : "" };
    const select = document.querySelector(`[data-slot="${active}"]`);
    if (select) select.value = slug;
    refresh();
  }
  document.getElementById("kk-plan-map")?.addEventListener("click", (event) => {
    const path = event.target.closest("[data-iso]");
    if (path) chooseCountry(path.getAttribute("data-iso"));
  });
  document.getElementById("kk-plan-map")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const path = event.target.closest("[data-iso]");
    if (!path) return;
    event.preventDefault();
    chooseCountry(path.getAttribute("data-iso"));
  });
  selects.forEach((select) => {
    select.addEventListener("change", () => {
      active = select.getAttribute("data-slot");
      document.querySelectorAll("[data-meal-slot]").forEach((button) => {
        const on = button.getAttribute("data-meal-slot") === active;
        button.classList.toggle("is-on", on);
        button.setAttribute("aria-pressed", on ? "true" : "false");
      });
      chooseCountry(select.value);
    });
  });
  document.querySelectorAll("[data-meal-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      active = button.getAttribute("data-meal-slot");
      document.querySelectorAll("[data-meal-slot]").forEach((other) => {
        const on = other === button;
        other.classList.toggle("is-on", on);
        other.setAttribute("aria-pressed", on ? "true" : "false");
      });
      renderRecipes(data, slots, active);
    });
  });
  document.getElementById("kk-plan-recipes")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-recipe]");
    if (!button || !slots[active]?.country) return;
    slots[active].recipe = button.getAttribute("data-recipe");
    const next = SLOTS[SLOTS.findIndex((slot) => slot.key === active) + 1];
    if (next && !slots[next.key]?.recipe) active = next.key;
    refresh();
  });
  document.getElementById("kk-plan-card")?.addEventListener("click", () => openCard(data, slots));
  document.getElementById("kk-plan-save")?.addEventListener("click", () => {
    const title = document.getElementById("kk-card-title")?.value || "A Day Around the World";
    const list = savedJourneys().filter((item) => item.query !== serializePlan(slots));
    list.unshift({ title, query: serializePlan(slots), at: Date.now() });
    storeJourneys(list);
    renderSaved();
    if (status) status.textContent = "Saved in this browser.";
  });
  function renderSaved() {
    const host = document.getElementById("kk-plan-saved");
    if (!host) return;
    const list = savedJourneys();
    host.innerHTML = list.length ? list.map((item) => `<li><a href="/journeys/${item.query}#plan">${item.title}</a></li>`).join("") : "<li>No saved journeys yet.</li>";
  }
  document.getElementById("kk-card-print")?.addEventListener("click", async () => {
    await fillBook(slots, data);
    document.body.classList.add("kk-printing");
    document.body.classList.toggle("kk-card-5x7", document.getElementById("kk-card-size")?.value === "5x7");
    window.print();
    document.body.classList.remove("kk-printing");
  });
  document.getElementById("kk-card-download")?.addEventListener("click", () => downloadCard(data, slots));
  document.getElementById("kk-card-close")?.addEventListener("click", () => document.getElementById("kk-card-dialog")?.close());
    refresh();
  if (SLOTS.some((slot) => slots[slot.key])) renderRecipes(data, slots, active);
  const ready = SLOTS.every((slot) => slots[slot.key]?.recipe) && countriesDiffer(slots);
  if (ready && opening === "#card") openCard(data, slots);
  if (ready && opening === "#png") downloadCard(data, slots, true);
  if (ready && opening === "#print") {
    const size = document.getElementById("kk-card-size");
    if (size) size.value = "5x7";
    fillCard(data, slots);
    document.getElementById("kk-card-title")?.blur();
    const dialog = document.getElementById("kk-card-dialog");
    document.body.replaceChildren(dialog);
    dialog.setAttribute("open", "");
    document.body.classList.add("kk-card-5x7");
  }
}

function openCard(data, slots) {
  const dialog = document.getElementById("kk-card-dialog");
  if (!dialog) return;
  fillCard(data, slots);
  document.body.classList.add("kk-card-open");
  if (!dialog.open) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }
  dialog.addEventListener("close", () => document.body.classList.remove("kk-card-open"), { once: true });
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

async function mapImage() {
  const svg = document.querySelector("#kk-card-map svg") || document.getElementById("kk-plan-map");
  if (!svg) return null;
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "880");
  clone.setAttribute("height", "440");
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  const image = await loadImage(url);
  URL.revokeObjectURL(url);
  return image;
}

async function paintCard(data, slots) {
  const images = await Promise.all(SLOTS.map((slot) => loadImage(recipeBySlug(data, slots[slot.key]?.recipe)?.thumb)));
  const map = await mapImage();
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1400;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f6f1e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#c6a15b";
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
  ctx.fillStyle = "#1a1a1a";
  ctx.textAlign = "center";
  ctx.font = "22px sans-serif";
  ctx.fillText("KITE KITCHEN", 500, 100);
  ctx.font = "48px Georgia, serif";
  const title = document.getElementById("kk-card-title")?.value || "A Day Around the World";
  ctx.fillText(title, 500, 160);
  if (map) {
    ctx.drawImage(map, 70, 190, 860, 360);
    ctx.strokeRect(70, 190, 860, 360);
  }
  SLOTS.forEach((slot, index) => {
    const stop = slots[slot.key];
    const country = stop ? countryBySlug(data, stop.country) : null;
    const recipe = stop ? recipeBySlug(data, stop.recipe) : null;
    const y = 640 + index * 150;
    ctx.beginPath();
    ctx.fillStyle = "#e2b007";
    ctx.arc(110, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "22px Georgia, serif";
    ctx.fillText(String(index + 1), 110, y + 8);
    ctx.textAlign = "left";
    ctx.font = "16px sans-serif";
    ctx.fillText(slot.meal.toUpperCase(), 160, y - 16);
    ctx.font = "36px Georgia, serif";
    ctx.fillText(recipe?.title || "", 160, y + 24);
    const meta = [country?.name, recipe?.minutes ? `${recipe.minutes} min` : "", recipe?.ingredients ? `${recipe.ingredients} ingredients` : ""].filter(Boolean).join(" · ");
    ctx.font = "18px sans-serif";
    ctx.fillText(meta, 160, y + 56);
    const image = images[index];
    if (image) ctx.drawImage(image, 760, y - 40, 120, 120);
    ctx.textAlign = "center";
  });
  const share = `${location.origin}/journeys/${serializePlan(slots)}`;
  paintQr(ctx, share, 820, 1165, 112);
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "18px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("KITEKITCHEN.COM/JOURNEYS", 80, 1230);
  return canvas;
}

function paintQr(ctx, text, x, y, size) {
  const grid = qrModules(text);
  const quiet = 2;
  const span = grid.length + quiet * 2;
  const cell = size / span;
  ctx.fillStyle = "#f6f1e6";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#1a1a1a";
  grid.forEach((row, py) => row.forEach((on, px) => {
    if (on) ctx.fillRect(x + (px + quiet) * cell, y + (py + quiet) * cell, cell, cell);
  }));
}

async function downloadCard(data, slots, preview = false) {
  const canvas = await paintCard(data, slots);
  if (preview) {
    document.body.replaceChildren(canvas);
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    return;
  }
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "kite-kitchen-journey.png";
  link.click();
}

loadData().then((data) => {
  if (document.getElementById("plan")) initPlan(data);
  document.querySelectorAll("[data-kk-card]").forEach((button) => {
    button.addEventListener("click", () => openCard(data, parsePlan(button.getAttribute("data-kk-card") || "")));
  });
}).catch(() => {
  const status = document.getElementById("kk-plan-status");
  if (status) status.textContent = "The planner did not load. Refresh and try again.";
});
