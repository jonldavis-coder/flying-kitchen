// The home feature follows the UTC date of the build.
// November: holiday table, through the 30th.
// December through February: winter warmers.
// March through May: breakfast.
// June through August: street food.
// September through October: weeknight.
const WINDOWS = [
  { slug: "holiday-table", from: 1101, to: 1130 },
  { slug: "winter-warmers", from: 1201, to: 1231 },
  { slug: "winter-warmers", from: 101, to: 229 },
  { slug: "breakfast", from: 301, to: 531 },
  { slug: "street-food", from: 601, to: 831 },
  { slug: "weeknight", from: 901, to: 1031 }
];

export function featureForDate(date) {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const key = month * 100 + day;
  const found = WINDOWS.find((window) => key >= window.from && key <= window.to);
  if (!found) throw new Error(`No home feature for month ${month} day ${day}`);
  return found.slug;
}
