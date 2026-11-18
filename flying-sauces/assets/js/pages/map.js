import { CATALOG, COUNTRY_NAMES } from "../catalog.js";
import { matchesSauce, readFilters, writeFilters } from "../lib/filter.js";
import { el } from "../lib/dom.js";
import { siteUrl } from "../lib/url.js";
import { EXTRA_CENTROIDS, ISO_ALIASES } from "../../../data/extra-centroids.js";
import { labelOf, BASE_TYPES, HEATS } from "../../../data/vocabulary.js";
import { JOURNEYS, VEHICLES } from "../../../data/journeys.js";

function countriesOf(sauce) {
  return [sauce.countryCode, ...(sauce.alsoCountries || [])].filter(Boolean);
}

function record(sauce) {
  return {
    region: sauce.region,
    baseType: sauce.baseType,
    heat: sauce.heat,
    uses: sauce.uses || [],
    diets: sauce.diets || [],
    countries: countriesOf(sauce),
    search: sauce.search || ""
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

  function visibleSauces() {
    const filters = currentFilters();
    return CATALOG.filter((sauce) => matchesSauce(record(sauce), filters));
  }

  function countsFor(sauces) {
    const counts = new Map();
    for (const sauce of sauces) {
      const filters = { ...currentFilters(), country: "" };
      if (!matchesSauce(record(sauce), filters)) continue;
      for (const code of countriesOf(sauce)) {
        counts.set(code, (counts.get(code) || 0) + 1);
      }
    }
    return counts;
  }

  function sauceItem(sauce) {
    return el("li", {}, [
      el("a", { href: `sauces/${sauce.slug}/` }, sauce.name),
      el("span", { class: "meta" }, ` ${sauce.country} · ${labelOf(BASE_TYPES, sauce.baseType)} · ${labelOf(HEATS, sauce.heat)}`)
    ]);
  }

  function renderList() {
    const sauces = visibleSauces().sort((a, b) => a.name.localeCompare(b.name));
    list.replaceChildren();
    list.append(el("h2", {}, state.country
      ? `Sauces linked to ${countryName(state.country)}`
      : "Sauces by country"));
    if (!sauces.length) {
      list.append(el("p", {}, "No sauces match these filters."));
      if (status) status.textContent = "No sauces match these filters.";
      return;
    }
    if (state.country) {
      const ul = el("ul", { class: "sauce-links" });
      for (const sauce of sauces) ul.append(sauceItem(sauce));
      list.append(ul);
    } else {
      const groups = new Map();
      for (const sauce of sauces) {
        if (!groups.has(sauce.country)) groups.set(sauce.country, []);
        groups.get(sauce.country).push(sauce);
      }
      for (const [country, items] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const ul = el("ul", { class: "sauce-links" });
        for (const sauce of items) ul.append(sauceItem(sauce));
        list.append(el("section", { class: "country-group" }, [
          el("h3", {}, `${country} · ${items.length}`),
          ul
        ]));
      }
    }
    if (status) {
      const label = state.country ? countryName(state.country) : "all countries";
      status.textContent = `${sauces.length} sauces for ${label}.`;
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
  for (const sauce of CATALOG) {
    for (const code of countriesOf(sauce)) pinned.add(code);
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

  restyle();
  drawRoutes(map);
  if (state.country) selectCountry(state.country);
}

function vehicleMarkup(vehicle) {
  if (vehicle === "train") {
    return `<svg viewBox="0 0 36 36" width="28" height="28" aria-hidden="true"><rect x="4" y="12" width="28" height="12" rx="2" fill="#1e4d5c"/><circle cx="12" cy="26" r="3" fill="#1c1915"/><circle cx="24" cy="26" r="3" fill="#1c1915"/></svg>`;
  }
  if (vehicle === "boat") {
    return `<svg viewBox="0 0 36 36" width="28" height="28" aria-hidden="true"><path d="M4 20h28l-4 8H8z" fill="#1e4d5c"/><path d="M18 20V8h2l8 12" stroke="#e2b007" fill="none" stroke-width="2"/></svg>`;
  }
  if (vehicle === "balloon") {
    return `<svg viewBox="0 0 36 36" width="28" height="28" aria-hidden="true"><ellipse cx="18" cy="14" rx="10" ry="12" fill="#e2b007"/><path d="M14 26h8l-2 6h-4z" fill="#1e4d5c"/></svg>`;
  }
  return `<svg viewBox="0 0 36 36" width="28" height="28" aria-hidden="true"><path d="M4 20l16-4-6-8 2 9 8 2-10 3 6 8-2-9z" fill="#e2b007"/></svg>`;
}

function drawRoutes(map) {
  for (const journey of JOURNEYS) {
    const line = journey.route.map(([lat, lng]) => [lat, lng]);
    window.L.polyline(line, { color: "#1c1915", weight: 5, opacity: 0.85 }).addTo(map);
    window.L.polyline(line, { color: "#e2b007", weight: 2 }).addTo(map);
    for (let index = 0; index < line.length - 1; index += 1) {
      const mid = [(line[index][0] + line[index + 1][0]) / 2, (line[index][1] + line[index + 1][1]) / 2];
      const icon = window.L.divIcon({
        className: "leaflet-div-icon vehicle-icon",
        html: vehicleMarkup(journey.vehicle),
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const marker = window.L.marker(mid, { icon, keyboard: true, title: `${journey.title}, ${VEHICLES[journey.vehicle]}` }).addTo(map);
      marker.bindTooltip(`${journey.title} · ${VEHICLES[journey.vehicle]}`);
      marker.on("click", (event) => {
        window.L.DomEvent.stopPropagation(event);
        location.href = siteUrl(`journeys/${journey.slug}/`);
      });
    }
  }
}
