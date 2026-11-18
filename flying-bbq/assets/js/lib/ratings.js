export function summarizeRatings(stars) {
  const list = (stars || []).map(Number).filter((n) => n >= 1 && n <= 5);
  if (!list.length) return { ratingAvg: 0, ratingCount: 0 };
  const sum = list.reduce((total, n) => total + n, 0);
  return {
    ratingAvg: Math.round((sum / list.length) * 10) / 10,
    ratingCount: list.length
  };
}
