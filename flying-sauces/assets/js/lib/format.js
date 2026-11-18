export function formatMinutes(mins) {
  const n = Math.max(0, Number(mins) || 0);
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function isoDuration(mins) {
  const n = Math.max(0, Number(mins) || 0);
  const h = Math.floor(n / 60);
  const m = n % 60;
  let out = "PT";
  if (h) out += `${h}H`;
  out += `${m}M`;
  return out;
}

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
