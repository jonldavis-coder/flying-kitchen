import { CATALOG, COUNTRY_NAMES } from "../catalog.js";
import { JOURNEY_ROUTES } from "../routes.js";
import { matchesDish, readFilters, writeFilters } from "../lib/filter.js";
import { el } from "../lib/dom.js";
import { siteUrl } from "../lib/url.js";
import { EXTRA_CENTROIDS, ISO_ALIASES } from "../../../data/extra-centroids.js";
import { labelOf, BASE_TYPES, HEATS } from "../../../data/vocabulary.js";

function countriesOf(dish) {
  return [dish.countryCode, ...(dish.alsoCountries || [])].filter(Boolean);
}

function record(dish) {
  return {
    region: dish.region,
    baseType: dish.baseType,
    heat: dish.heat,
    uses: dish.uses || [],
    diets: dish.diets || [],
    countries: countriesOf(dish),
    search: dish.search || ""
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

  function visibleDishes() {
    const filters = currentFilters();
    return CATALOG.filter((dish) => matchesDish(record(dish), filters));
  }

  function countsFor(dishes) {
    const counts = new Map();
    for (const dish of dishes) {
      const filters = { ...currentFilters(), country: "" };
      if (!matchesDish(record(dish), filters)) continue;
      for (const code of countriesOf(dish)) {
        counts.set(code, (counts.get(code) || 0) + 1);
      }
    }
    return counts;
  }

  function dishItem(dish) {
    return el("li", {}, [
      el("a", { href: `dishes/${dish.slug}/` }, dish.name),
      el("span", { class: "meta" }, ` ${dish.country} · ${labelOf(BASE_TYPES, dish.baseType)} · ${labelOf(HEATS, dish.heat)}`)
    ]);
  }

  function renderList() {
    const dishes = visibleDishes().sort((a, b) => a.name.localeCompare(b.name));
    list.replaceChildren();
    list.append(el("h2", {}, state.country
      ? `Dishes linked to ${countryName(state.country)}`
      : "Dishes by country"));
    if (!dishes.length) {
      list.append(el("p", {}, "No dishes match these filters."));
      if (status) status.textContent = "No dishes match these filters.";
      return;
    }
    if (state.country) {
      const ul = el("ul", { class: "dish-links" });
      for (const dish of dishes) ul.append(dishItem(dish));
      list.append(ul);
    } else {
      const groups = new Map();
      for (const dish of dishes) {
        if (!groups.has(dish.country)) groups.set(dish.country, []);
        groups.get(dish.country).push(dish);
      }
      for (const [country, items] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const ul = el("ul", { class: "dish-links" });
        for (const dish of items) ul.append(dishItem(dish));
        list.append(el("section", { class: "country-group" }, [
          el("h3", {}, `${country} · ${items.length}`),
          ul
        ]));
      }
    }
    if (status) {
      const label = state.country ? countryName(state.country) : "all countries";
      status.textContent = `${dishes.length} dishes for ${label}.`;
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
  for (const dish of CATALOG) {
    for (const code of countriesOf(dish)) pinned.add(code);
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

  const vehicleSvg = {
    train: `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><rect x="4" y="10" width="24" height="12" rx="2" fill="#1e4d5c"/><circle cx="10" cy="24" r="2" fill="#e2b007"/><circle cx="22" cy="24" r="2" fill="#e2b007"/></svg>`,
    boat: `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M4 18h24l-3 6H7z" fill="#1e4d5c"/><path d="M16 18V8h2l6 10" stroke="#e2b007" fill="none" stroke-width="2"/></svg>`,
    balloon: `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><ellipse cx="16" cy="12" rx="8" ry="10" fill="#e2b007"/><path d="M12 22h8l-2 4h-4z" fill="#1e4d5c"/></svg>`,
    plane: `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M2 18l18-6-8-8 2 10 8 2-10 2 8 8-2-10z" fill="#1e4d5c"/></svg>`
  };
  function unwrapLongitudes(points) {
    const unwrapped = [{ ...points[0] }];
    for (let index = 1; index < points.length; index += 1) {
      let lng = points[index].lng;
      const previous = unwrapped[index - 1].lng;
      while (lng - previous > 180) lng -= 360;
      while (previous - lng > 180) lng += 360;
      unwrapped.push({ ...points[index], lng });
    }
    return unwrapped;
  }

  for (const route of JOURNEY_ROUTES || []) {
    const latlngs = unwrapLongitudes((route.points || []).filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)));
    if (latlngs.length < 2) continue;
    window.L.polyline(latlngs.map((point) => [point.lat, point.lng]), {
      color: "#8c2f1e",
      weight: 3,
      dashArray: "7 6"
    }).addTo(map);
    for (let index = 0; index < latlngs.length - 1; index += 1) {
      const midLat = (latlngs[index].lat + latlngs[index + 1].lat) / 2;
      const midLng = (latlngs[index].lng + latlngs[index + 1].lng) / 2;
      const icon = window.L.divIcon({
        className: "vehicle-icon",
        html: vehicleSvg[route.vehicle] || vehicleSvg.plane,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      window.L.marker([midLat, midLng], { icon, interactive: false, keyboard: false }).addTo(map);
    }
    latlngs.forEach((point, index) => {
      window.L.circleMarker([point.lat, point.lng], {
        radius: 5,
        color: "#1c1915",
        weight: 1,
        fillColor: "#e2b007",
        fillOpacity: 1
      }).addTo(map).bindTooltip(`${index + 1}. ${point.label || route.title}`, { sticky: true });
    });
  }

  restyle();
  if (state.country) selectCountry(state.country);
}
