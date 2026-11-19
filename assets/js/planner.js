import { SLOTS, countriesDiffer, parsePlan, recipesFor, serializePlan } from "./planner-model.mjs";

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

function qrMatrix(text) {
  const data = Array.from(new TextEncoder().encode(text)).slice(0, 80);
  const size = 21 + Math.floor(data.length / 14) * 4;
  const grid = Array.from({ length: size }, () => Array(size).fill(false));
  function finder(x, y) {
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const edge = row === 0 || col === 0 || row === 6 || col === 6;
        const core = row >= 2 && row <= 4 && col >= 2 && col <= 4;
        if (x + col < size && y + row < size) grid[y + row][x + col] = edge || core;
      }
    }
  }
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  data.forEach((byte, index) => {
    const col = 8 + (index % (size - 16));
    const row = 8 + Math.floor(index / (size - 16));
    if (row < size - 8) grid[row][col] = Boolean(byte & 1);
  });
  return grid;
}

function drawQr(canvas, text) {
  const grid = qrMatrix(text);
  const cell = Math.floor(canvas.width / grid.length);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f0e8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1a1a1a";
  grid.forEach((row, y) => row.forEach((on, x) => { if (on) ctx.fillRect(x * cell, y * cell, cell, cell); }));
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
  const lands = document.getElementById("kk-plan-lands");
  const pins = document.getElementById("kk-plan-pins");
  const flight = document.getElementById("kk-plan-flight");
  if (!lands || !pins || !flight) return;
  const chosen = new Set(SLOTS.map((slot) => slots[slot.key]?.country).filter(Boolean));
  lands.innerHTML = data.countries.map((country) => {
    const on = chosen.has(country.slug) ? " is-on" : "";
    const shape = country.d ? `<path data-iso="${country.slug}" class="${on.trim()}" d="${country.d}" tabindex="0" role="button" aria-label="${country.name}"><title>${country.name}</title></path>` : "";
    return shape;
  }).join("");
  const points = SLOTS.map((slot, index) => {
    const stop = slots[slot.key];
    if (!stop) return "";
    const country = countryBySlug(data, stop.country);
    if (!country) return "";
    const [x, y] = project(country.lon, country.lat);
    return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="#e2b007" stroke="#1a1a1a"/><text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-family="Georgia, serif">${index + 1}</text></g>`;
  }).join("");
  pins.innerHTML = points;
  const line = SLOTS.map((slot) => slots[slot.key]).filter(Boolean).map((stop) => countryBySlug(data, stop.country)).filter(Boolean);
  if (line.length >= 2) {
    flight.setAttribute("d", line.map((country, index) => {
      const [x, y] = project(country.lon, country.lat);
      return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" "));
    flight.classList.toggle("kk-flight-draw", !motion);
  } else flight.setAttribute("d", "");
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
  const tagged = data.recipes.filter((recipe) => recipe.country === country && (recipe.meals || []).includes(slot.meal));
  const list = recipesFor(data.recipes, country, slot.meal);
  if (status) {
    status.textContent = tagged.length
      ? `${place?.name || country}: ${slot.meal.toLowerCase()} recipes.`
      : `${place?.name || country} has no ${slot.meal.toLowerCase()} tag. Showing every recipe from there.`;
  }
  host.innerHTML = list.map((recipe) => {
    const media = recipe.thumb
      ? `<img src="${recipe.thumb}" alt="" width="120" height="80">`
      : `<svg class="kk-plan-plate" viewBox="0 0 120 80" aria-hidden="true"><rect width="120" height="80" fill="#f4f0e8"/><circle cx="60" cy="40" r="6" fill="#e2b007" stroke="#1a1a1a"/></svg>`;
    const meta = [recipe.minutes ? `${recipe.minutes} min` : "", recipe.ingredients ? `${recipe.ingredients} ingredients` : ""].filter(Boolean).join(" · ");
    return `<button type="button" class="kk-plan-card" data-recipe="${recipe.slug}">${media}<span><strong>${recipe.title}</strong><span class="kk-meta">${meta}</span></span></button>`;
  }).join("");
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
  if (urlNode) urlNode.textContent = decodeURIComponent(share).replace(location.origin, "kitekitchen.com");
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
        ? `<img src="${recipe.thumb}" alt="" width="84" height="56">`
        : `<svg viewBox="0 0 84 56" aria-hidden="true"><rect width="84" height="56" fill="#f4f0e8"/><circle cx="42" cy="28" r="5" fill="#e2b007" stroke="#1a1a1a"/></svg>`;
      const meta = [recipe?.minutes ? `${recipe.minutes} min` : "", recipe?.ingredients ? `${recipe.ingredients} ingredients` : ""].filter(Boolean).join(" · ");
      return `<li>${media}<span><span class="kk-kicker">${slot.meal}</span><strong>${recipe?.title || stop.recipe}</strong><span class="kk-meta">${country?.name || stop.country}${meta ? ` · ${meta}` : ""}</span></span></li>`;
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
  selects.forEach((select) => {
    select.innerHTML = `<option value="">Choose a country</option>${data.countries.map((country) => `<option value="${country.slug}">${country.name}</option>`).join("")}`;
    if (slots[select.getAttribute("data-slot")]?.country) select.value = slots[select.getAttribute("data-slot")].country;
  });
  function usedElsewhere(slug, key) {
    return SLOTS.some((slot) => slot.key !== key && slots[slot.key]?.country === slug);
  }
  function refresh() {
    selects.forEach((select) => {
      const key = select.getAttribute("data-slot");
      [...select.options].forEach((option) => {
        option.disabled = Boolean(option.value) && usedElsewhere(option.value, key);
      });
    });
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
  document.getElementById("kk-card-close")?.addEventListener("click", () => document.getElementById("kk-card-dialog")?.removeAttribute("open"));
    refresh();
  if (SLOTS.some((slot) => slots[slot.key])) renderRecipes(data, slots, active);
  const ready = SLOTS.every((slot) => slots[slot.key]?.recipe) && countriesDiffer(slots);
  if (ready && (opening === "#card" || opening === "#print")) {
    openCard(data, slots);
    if (opening === "#print") document.body.classList.add("kk-printing");
  }
}

function openCard(data, slots) {
  const dialog = document.getElementById("kk-card-dialog");
  if (!dialog) return;
  fillCard(data, slots);
  dialog.setAttribute("open", "");
  const plan = document.getElementById("plan");
  if ((location.hash === "#card" || location.hash === "#print") && plan) plan.prepend(dialog);
}

function downloadCard(data, slots) {
  const canvas = document.createElement("canvas");
  const five = document.getElementById("kk-card-size")?.value === "5x7";
  canvas.width = five ? 750 : 1100;
  canvas.height = five ? 1050 : 1400;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f0e8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#c6a15b";
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "42px Georgia, serif";
  const title = document.getElementById("kk-card-title")?.value || "A Day Around the World";
  ctx.fillText(title, 48, 100);
  ctx.font = "22px Georgia, serif";
  SLOTS.forEach((slot, index) => {
    const stop = slots[slot.key];
    const country = stop ? countryBySlug(data, stop.country) : null;
    const recipe = stop ? recipeBySlug(data, stop.recipe) : null;
    const y = 220 + index * 90;
    ctx.fillText(`${index + 1}. ${slot.meal}`, 48, y);
    ctx.fillText(`${recipe?.title || ""} · ${country?.name || ""}`, 48, y + 36);
  });
  ctx.font = "18px sans-serif";
  ctx.fillText("kitekitchen.com", 48, canvas.height - 80);
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
