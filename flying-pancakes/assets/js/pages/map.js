import { CATALOG, COUNTRY_NAMES } from "../catalog.js";
import { ROUTES } from "../route-data.js";
import { matchesPancake, readFilters, writeFilters } from "../lib/filter.js";
import { el } from "../lib/dom.js";
import { siteUrl } from "../lib/url.js";
import { EXTRA_CENTROIDS, ISO_ALIASES } from "../../../data/extra-centroids.js";
import { labelOf, BASE_TYPES, HEATS } from "../../../data/vocabulary.js";

function countriesOf(pancake) {
  return [pancake.countryCode, ...(pancake.alsoCountries || [])].filter(Boolean);
}

function record(pancake) {
  return {
    region: pancake.region,
    baseType: pancake.baseType,
    heat: pancake.heat,
    uses: pancake.uses || [],
    diets: pancake.diets || [],
    countries: countriesOf(pancake),
    search: pancake.search || ""
  };
}

function featureIso(iso) {
  return ISO_ALIASES[iso] || iso;
}

export async function init() {
  const form = document.getElementById("filters");
  const list = document.getElementById("country-results");
  const status = document.getElementById("map-status");
  if (!form || !list) return;

  const params = new URLSearchParams(location.search);
  const initial = readFilters(params);
  for (const [key, value] of Object.entries({
    q: initial.query,
    region: initial.region,
    type: initial.baseType,
    heat: initial.heat,
    use: initial.use,
    diet: initial.diet,
    country: initial.country
  })) {
    const field = form.elements[key];
    if (field && value) field.value = value;
  }

  const state = { country: initial.country || "", layer: null, geo: null };

  function currentFilters() {
    const data = new FormData(form);
    return {
      query: String(data.get("q") || ""),
      region: String(data.get("region") || ""),
      baseType: String(data.get("type") || ""),
      heat: String(data.get("heat") || ""),
      use: String(data.get("use") || ""),
      diet: String(data.get("diet") || ""),
      country: state.country
    };
  }

  function visiblePancakes() {
    const filters = currentFilters();
    return CATALOG.filter((pancake) => matchesPancake(record(pancake), filters));
  }

  function countsFor(pancakes) {
    const counts = new Map();
    for (const pancake of pancakes) {
      const filters = { ...currentFilters(), country: "" };
      if (!matchesPancake(record(pancake), filters)) continue;
      for (const code of countriesOf(pancake)) {
        counts.set(code, (counts.get(code) || 0) + 1);
      }
    }
    return counts;
  }

  function pancakeItem(pancake) {
    return el("li", {}, [
      el("a", { href: `pancakes/${pancake.slug}/` }, pancake.name),
      el("span", { class: "meta" }, ` ${pancake.country} · ${labelOf(BASE_TYPES, pancake.baseType)} · ${labelOf(HEATS, pancake.heat)}`)
    ]);
  }

  function renderList() {
    const pancakes = visiblePancakes().sort((a, b) => a.name.localeCompare(b.name));
    list.replaceChildren();
    list.append(el("h2", {}, state.country
      ? `Pancakes linked to ${countryName(state.country)}`
      : "Pancakes by country"));
    if (!pancakes.length) {
      list.append(el("p", {}, "No pancakes match these filters."));
      if (status) status.textContent = "No pancakes match these filters.";
      return;
    }
    if (state.country) {
      const ul = el("ul", { class: "pancake-links" });
      for (const pancake of pancakes) ul.append(pancakeItem(pancake));
      list.append(ul);
    } else {
      const groups = new Map();
      for (const pancake of pancakes) {
        if (!groups.has(pancake.country)) groups.set(pancake.country, []);
        groups.get(pancake.country).push(pancake);
      }
      for (const [country, items] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const ul = el("ul", { class: "pancake-links" });
        for (const pancake of items) ul.append(pancakeItem(pancake));
        list.append(el("section", { class: "country-group" }, [
          el("h3", {}, `${country} · ${items.length}`),
          ul
        ]));
      }
    }
    if (status) {
      const label = state.country ? countryName(state.country) : "all countries";
      status.textContent = `${pancakes.length} pancakes for ${label}.`;
    }
  }

  function countryName(code) {
    if (COUNTRY_NAMES[code]) return COUNTRY_NAMES[code];
    const named = CATALOG.find((item) => item.countryCode === code);
    return named ? named.country : code;
  }

  function shade(count, max) {
    if (!count) return "#d9d0c1";
    const t = Math.min(1, count / Math.max(3, max));
    const light = [232, 214, 176];
    const deep = [140, 42, 28];
    const mix = light.map((channel, index) => Math.round(channel + (deep[index] - channel) * t));
    return `rgb(${mix.join(",")})`;
  }

  function restyle() {
    if (!state.layer) return;
    const counts = countsFor(CATALOG);
    let max = 1;
    for (const value of counts.values()) max = Math.max(max, value);
    state.layer.setStyle((feature) => {
      const code = featureIso(feature.properties.iso);
      const count = counts.get(code) || 0;
      const selected = state.country && state.country === code;
      return {
        fillColor: shade(count, max),
        fillOpacity: count ? 0.92 : 0.55,
        color: selected ? "#1c1915" : "#5c5346",
        weight: selected ? 2.2 : 0.6
      };
    });
  }

  function selectCountry(code) {
    state.country = code || "";
    const select = form.elements.country;
    if (select) select.value = state.country;
    writeFilters(currentFilters());
    restyle();
    renderList();
    if (code) list.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  form.addEventListener("input", () => {
    writeFilters(currentFilters());
    restyle();
    renderList();
  });
  form.addEventListener("change", () => {
    if (form.elements.country) state.country = form.elements.country.value || "";
    writeFilters(currentFilters());
    restyle();
    renderList();
  });
  form.addEventListener("submit", (event) => event.preventDefault());

  renderList();

  const mapNode = document.getElementById("world-map");
  if (!mapNode || !window.L) {
    if (status) status.textContent = "The country list is ready. The shaded map did not load.";
    return;
  }

  const map = window.L.map(mapNode, {
    scrollWheelZoom: false,
    minZoom: 1,
    worldCopyJump: true,
    attributionControl: true
  }).setView([18, 8], 2);
  map.attributionControl.addAttribution("Map shapes: Natural Earth");

  try {
    const response = await fetch(siteUrl("assets/maps/countries.geojson"));
    if (!response.ok) throw new Error("map");
    state.geo = await response.json();
  } catch {
    if (status) status.textContent = "The country list is ready. The map file did not load.";
    return;
  }

  state.layer = window.L.geoJSON(state.geo, {
    onEachFeature(feature, layer) {
      const code = featureIso(feature.properties.iso);
      const name = feature.properties.name || code;
      layer.bindTooltip(name, { sticky: true });
      layer.on("click", () => selectCountry(code));
    }
  }).addTo(map);

  const pinned = new Set();
  for (const pancake of CATALOG) {
    for (const code of countriesOf(pancake)) pinned.add(code);
  }
  const present = new Set(state.geo.features.map((feature) => featureIso(feature.properties.iso)));
  for (const code of pinned) {
    if (present.has(code) || !EXTRA_CENTROIDS[code]) continue;
    const [lat, lng] = EXTRA_CENTROIDS[code];
    const marker = window.L.circleMarker([lat, lng], {
      radius: 7,
      color: "#1c1915",
      weight: 1,
      fillColor: "#e2b007",
      fillOpacity: 1
    }).addTo(map);
    marker.bindTooltip(countryName(code), { sticky: true });
    marker.on("click", () => selectCountry(code));
  }

  const colors = ["#e2b007", "#1e4d5c", "#e07a2f", "#2f6f8f", "#c2412d", "#6b4a1b", "#3f6f4a", "#6b3fa0"];
  const legend = document.getElementById("route-legend");
  ROUTES.forEach((route, index) => {
    const color = colors[index % colors.length];
    const points = (route.stops || []).filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng));
    if (points.length < 2) return;
    const line = window.L.polyline(points.map((stop) => [stop.lat, stop.lng]), {
      color,
      weight: 3,
      opacity: 0.95,
      dashArray: "8 8"
    }).addTo(map);
    line.bindTooltip(route.title, { sticky: true });
    for (let leg = 0; leg < points.length - 1; leg += 1) {
      const from = points[leg];
      const to = points[leg + 1];
      const mid = [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2];
      const icon = window.L.divIcon({
        className: "vehicle-icon",
        html: `<span class="vehicle-pin" data-vehicle="${route.vehicle}" title="${route.vehicle}">${vehicleGlyph(route.vehicle)}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      window.L.marker(mid, { icon, keyboard: false }).addTo(map).bindTooltip(`${route.title}: ${from.name} to ${to.name}`, { sticky: true });
    }
    points.forEach((stop) => {
      window.L.circleMarker([stop.lat, stop.lng], {
        radius: 5,
        color: "#1c1915",
        weight: 1,
        fillColor: color,
        fillOpacity: 1
      }).addTo(map).bindTooltip(`${stop.name} · ${stop.place || stop.country}`, { sticky: true });
    });
    if (legend) {
      const item = document.createElement("a");
      item.href = `journeys/${route.slug}/`;
      item.className = "legend-item";
      item.innerHTML = `<span class="legend-swatch" style="background:${color}"></span> ${route.title}`;
      legend.append(item);
    }
  });

  restyle();
  if (state.country) selectCountry(state.country);
}

function vehicleGlyph(vehicle) {
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">`;
  if (vehicle === "balloon") return `${open}<ellipse cx="14" cy="11" rx="7" ry="8" fill="#e2b007"/><path d="M11 18h6l-1.5 4h-3z" fill="#1c1915"/></svg>`;
  if (vehicle === "train") return `${open}<rect x="4" y="10" width="20" height="8" rx="2" fill="#f7f1e4"/><circle cx="9" cy="20" r="2" fill="#1c1915"/><circle cx="19" cy="20" r="2" fill="#1c1915"/></svg>`;
  if (vehicle === "boat") return `${open}<path d="M4 16h20l-3 5H7z" fill="#f7f1e4"/><path d="M14 16V6h1.2l6 10" stroke="#1c1915" fill="none" stroke-width="1.4"/></svg>`;
  return `${open}<path d="M4 16l10-2-4-6 1.4 6.2 5 .8-6 1.6 4 5.4-1.4-6z" fill="#e2b007"/></svg>`;
}
