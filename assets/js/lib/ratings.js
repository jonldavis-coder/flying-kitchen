export function summarizeRatings(list) {
  const stars = (list || []).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
  if (!stars.length) return { ratingAvg: 0, ratingCount: 0 };
  const sum = stars.reduce((total, n) => total + n, 0);
  return {
    ratingAvg: Math.round((sum / stars.length) * 10) / 10,
    ratingCount: stars.length
  };
}
