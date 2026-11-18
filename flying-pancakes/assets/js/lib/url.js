export function basePath() {
  return window.FLYING_PANCAKES_CONFIG?.BASE_PATH || "/flying-pancakes/";
}

export function siteUrl(rel) {
  const clean = String(rel || "").replace(/^\//, "");
  return `${location.origin}${basePath()}${clean}`;
}

export function herePath() {
  const base = basePath();
  let path = location.pathname;
  if (path.startsWith(base)) path = path.slice(base.length);
  else path = path.replace(/^\//, "");
  if (!path) path = "index.html";
  return path + location.search;
}
