// The home feature follows the UTC date of the build.
// November 1–26: the Thanksgiving table.
// November 27 through January 1: the December holiday table.
// January 2 through February: winter warmers.
// March through May: breakfast.
// June through August: street food.
// September through October: weeknight.
const WINDOWS = [
  { slug: "holiday-table", from: 1101, to: 1126 },
  { slug: "december-table", from: 1127, to: 1231 },
  { slug: "december-table", from: 101, to: 101 },
  { slug: "winter-warmers", from: 102, to: 229 },
  { slug: "breakfast", from: 301, to: 531 },
  { slug: "street-food", from: 601, to: 831 },
  { slug: "weeknight", from: 901, to: 1031 }
];

export function isoWeekSerial(date) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  const epoch = Date.UTC(1970, 0, 5);
  return Math.round((utc.getTime() - epoch) / 604800000);
}

export function weekPick(hrefs, date) {
  const list = hrefs.slice().sort();
  if (!list.length) throw new Error("No recipes with a dish photograph");
  const index = ((isoWeekSerial(date) % list.length) + list.length) % list.length;
  return list[index];
}

export function isoWeekLabel(serial) {
  const monday = new Date(Date.UTC(1970, 0, 5) + serial * 604800000);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const year = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1));
  const week = Math.round((monday.getTime() - week1Monday.getTime()) / 604800000) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// Existing weeks stay as written. Missing weeks after the last entry are appended
// through `throughSerial`, skipping any slug used in the previous 25 weeks.
export function extendWeekSchedule(entries, slugs, throughSerial) {
  const list = entries.map((row) => ({ serial: row.serial, week: row.week, slug: row.slug }));
  const known = new Map(list.map((row) => [row.serial, row.slug]));
  const pool = [...new Set(slugs)].filter(Boolean).sort();
  if (!pool.length) throw new Error("No recipes with a dish photograph");
  const cursor = list.length ? Math.max(...list.map((row) => row.serial)) + 1 : throughSerial;
  for (let serial = cursor; serial <= throughSerial; serial += 1) {
    const recent = new Set();
    for (let prev = serial - 25; prev < serial; prev += 1) {
      if (known.has(prev)) recent.add(known.get(prev));
    }
    const open = pool.filter((slug) => !recent.has(slug));
    const choices = open.length ? open : pool;
    const slug = choices[((serial % choices.length) + choices.length) % choices.length];
    known.set(serial, slug);
    list.push({ serial, week: isoWeekLabel(serial), slug });
  }
  return list;
}

export function featureForDate(date) {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const key = month * 100 + day;
  const found = WINDOWS.find((window) => key >= window.from && key <= window.to);
  if (!found) throw new Error(`No home feature for month ${month} day ${day}`);
  return found.slug;
}
