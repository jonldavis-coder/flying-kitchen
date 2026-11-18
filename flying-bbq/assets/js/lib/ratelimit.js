export function checkRateLimit(stamps, { limit, windowMs, now = Date.now() }) {
  const recent = (stamps || []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    const oldest = recent[0];
    const wait = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return {
      ok: false,
      recent,
      message: `Please wait about ${wait} seconds before trying again.`
    };
  }
  return { ok: true, recent };
}

export const LIMITS = {
  dish: { limit: 3, windowMs: 60 * 60 * 1000 },
  comment: { limit: 8, windowMs: 10 * 60 * 1000 },
  twist: { limit: 6, windowMs: 10 * 60 * 1000 },
  report: { limit: 5, windowMs: 60 * 60 * 1000 },
  auth: { limit: 8, windowMs: 60 * 60 * 1000 }
};
