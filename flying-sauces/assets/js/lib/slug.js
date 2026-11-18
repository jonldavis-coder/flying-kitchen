export function slugify(title) {
  const base = String(title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base || "sauce";
}

export function uniqueSlug(title, existing) {
  const taken = existing instanceof Set ? existing : new Set(existing || []);
  const base = slugify(title);
  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const next = `${base}-${i}`.slice(0, 80);
    if (!taken.has(next)) return next;
  }
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}
