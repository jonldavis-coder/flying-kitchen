export function pricesTreatedAsFinal(config) {
  return config?.pricesAreFinal === true && config?.openingSoon !== true;
}

export function formatMoney(amount) {
  const number = Number(amount);
  if (!Number.isFinite(number)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(number);
}

export function priceLabel(raw, config) {
  const money = formatMoney(raw);
  if (!money) return "";
  if (pricesTreatedAsFinal(config)) return money;
  return `Placeholder price ${money}, not final`;
}

export function roundMoney(amount) {
  return Math.round(Number(amount) * 100) / 100;
}

export function boxSetQuote(prices, discountRate = 0.3) {
  const list = (prices || []).map(Number).filter((n) => Number.isFinite(n));
  const sum = roundMoney(list.reduce((total, n) => total + n, 0));
  const rate = Number(discountRate);
  const savings = roundMoney(sum * rate);
  const total = roundMoney(sum - savings);
  return { sum, savings, total, rate, count: list.length };
}

export function notifyHref(config, title) {
  const email = String(config?.notifyEmail || "").trim();
  const subject = `Coming soon: ${title}`;
  const body = `Please tell me when “${title}” is available.\n\nSent from Flying BBQ.`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
