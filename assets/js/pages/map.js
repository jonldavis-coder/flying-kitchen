const COLORS = {
  balloon: "#d65009",
  plane: "#022d5a",
  train: "#e5a635",
  boat: "#0e3256"
};

export async function init() {
  const holder = document.getElementById("route-map");
  const dataNode = document.getElementById("route-data");
  const status = document.getElementById("map-status");
  if (!holder || !dataNode || !window.L) {
    if (status) status.textContent = "The route map needs JavaScript.";
    return;
  }
  let routes = [];
  try {
    routes = JSON.parse(dataNode.textContent || "[]");
  } catch {
    routes = [];
  }
  const map = window.L.map(holder, {
    scrollWheelZoom: false,
    attributionControl: true
  });
  map.attributionControl.setPrefix("");
  map.attributionControl.addAttribution("Country shapes: Natural Earth. Routes are the published journey legs.");
  try {
    const geo = await fetch("assets/maps/countries.geojson").then((res) => {
      if (!res.ok) throw new Error("map");
      return res.json();
    });
    window.L.geoJSON(geo, {
      style: { color: "#022d5a", weight: 0.6, fillColor: "#f4ead4", fillOpacity: 1 },
      interactive: false
    }).addTo(map);
  } catch {
    if (status) status.textContent = "Country shapes did not load. The route list below is still the published record.";
  }

  const siteFilter = document.getElementById("map-site");
  const vehicleFilter = document.getElementById("map-vehicle");
  const layers = [];
  let fitted = false;

  function draw() {
    for (const layer of layers) map.removeLayer(layer);
    layers.length = 0;
    const site = siteFilter?.value || "";
    const vehicle = vehicleFilter?.value || "";
    const bounds = [];
    let shown = 0;
    for (const route of routes) {
      const hide = (site && route.site !== site) || (vehicle && route.vehicle !== vehicle) || !route.points?.length;
      document.querySelectorAll(`[data-route="${CSS.escape(route.id)}"]`).forEach((node) => {
        node.hidden = hide;
      });
      if (hide) continue;
      const latlngs = route.points.map(([lat, lng]) => [lat, lng]);
      const color = COLORS[route.vehicle] || "#022d5a";
      const line = window.L.polyline(latlngs, {
        color,
        weight: 4,
        opacity: 0.9,
        dashArray: route.vehicle === "boat" ? "8 8" : null
      }).addTo(map);
      line.bindPopup(`<strong>${escapeText(route.title)}</strong><br>${escapeText(route.vehicleLabel || route.vehicle)} · ${escapeText(route.siteName)}`);
      layers.push(line);
      for (const point of latlngs) bounds.push(point);
      shown += 1;
    }
    if (status) {
      status.textContent = shown
        ? `${shown} ${shown === 1 ? "route" : "routes"} on the map.`
        : "No published route matches those filters.";
    }
    if (!fitted && bounds.length) {
      map.fitBounds(bounds, { padding: [24, 24] });
      fitted = true;
    }
  }

  siteFilter?.addEventListener("change", draw);
  vehicleFilter?.addEventListener("change", draw);
  if (!routes.length) map.setView([20, 0], 2);
  draw();
  if (!fitted) map.setView([20, 0], 2);
}

function escapeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
