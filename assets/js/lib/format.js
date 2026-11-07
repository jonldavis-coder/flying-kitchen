export function formatRating(avg, count) {
  const n = Number(count) || 0;
  if (!n) return "No ratings yet";
  const value = (Number(avg) || 0).toFixed(1);
  return `${value} out of 5 from ${n} ${n === 1 ? "rating" : "ratings"}`;
}

export function formatHearts(count) {
  const n = Number(count) || 0;
  if (!n) return "No hearts yet";
  return n === 1 ? "1 heart" : `${n} hearts`;
}

export function formatWhen(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
}
