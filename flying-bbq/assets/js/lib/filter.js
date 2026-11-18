export function matchesDish(item, filters = {}) {
  const query = String(filters.query || "").trim().toLowerCase();
  if (query) {
    const hay = String(item.search || "").toLowerCase();
    if (!hay.includes(query)) return false;
  }
  if (filters.region && item.region !== filters.region) return false;
  if (filters.baseType && item.baseType !== filters.baseType) return false;
  if (filters.heat && item.heat !== filters.heat) return false;
  if (filters.use && !(item.uses || []).includes(filters.use)) return false;
  if (filters.diet && !(item.diets || []).includes(filters.diet)) return false;
  if (filters.country && !(item.countries || []).includes(filters.country)) return false;
  return true;
}

export function readFilters(params) {
  return {
    query: params.get("q") || "",
    region: params.get("region") || "",
    baseType: params.get("type") || "",
    heat: params.get("heat") || "",
    use: params.get("use") || "",
    diet: params.get("diet") || "",
    country: params.get("country") || ""
  };
}

export function writeFilters(filters) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.region) params.set("region", filters.region);
  if (filters.baseType) params.set("type", filters.baseType);
  if (filters.heat) params.set("heat", filters.heat);
  if (filters.use) params.set("use", filters.use);
  if (filters.diet) params.set("diet", filters.diet);
  if (filters.country) params.set("country", filters.country);
  const text = params.toString();
  const path = location.pathname;
  history.replaceState(null, "", text ? `${path}?${text}` : path);
}
