/** Shared search ranking for the browser and the tests. */

export function fold(value) {
  return String(value || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function words(value) {
  return fold(value).split(/[^a-z0-9]+/).filter(Boolean);
}

function levenshtein(a, b) {
  let prev = Array.from({ length: a.length + 1 }, (_, index) => index);
  for (let j = 1; j <= b.length; j += 1) {
    const cur = [j];
    for (let i = 1; i <= a.length; i += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[i] = Math.min(prev[i] + 1, cur[i - 1] + 1, prev[i - 1] + cost);
    }
    prev = cur;
  }
  return prev[a.length];
}

function typo(queryWord, word) {
  if (queryWord === word) return true;
  if (queryWord.length < 5 || word.length < 5) return false;
  if (queryWord[0] !== word[0]) return false;
  if (Math.abs(queryWord.length - word.length) > 1) return false;
  return levenshtein(queryWord, word) <= 1;
}

function placeMatch(token, place) {
  if (!token || !place) return false;
  const placeWords = words(place);
  if (placeWords.some((word) => word === token || typo(token, word))) return true;
  return placeWords.some((word) => {
    const limit = Math.min(token.length, word.length);
    let shared = 0;
    while (shared < limit && token[shared] === word[shared]) shared += 1;
    return shared >= 4 && shared >= limit - 1;
  });
}

function hasWord(token, value) {
  return words(value).some((word) => word === token);
}

/** Dish-type words also match a category, a tag, or a main-ingredient name. */
const DISH_TYPES = {
  pasta: ["pasta", "spaghetti", "penne", "rigatoni", "bucatini", "fettuccine", "linguine", "tagliatelle", "macaroni", "lasagna", "lasagne", "ravioli", "gnocchi", "trofie", "trenette", "tonnarelli"],
  noodle: ["noodle", "noodles", "ramen", "udon", "soba", "yakisoba"],
  soup: ["soup", "soups", "bisque", "chowder"],
  curry: ["curry", "curries"],
  bread: ["bread", "breads", "flatbread"],
  pancake: ["pancake", "pancakes", "crepe", "crepes"],
  sauce: ["sauce", "sauces"],
  salad: ["salad", "salads"],
  cake: ["cake", "cakes"]
};

function dishWords(token) {
  const stem = token.endsWith("s") && token.length > 4 ? token.slice(0, -1) : token;
  for (const list of Object.values(DISH_TYPES)) {
    if (list.includes(token) || list.includes(stem)) return list;
  }
  return null;
}

/** A one-word dish search keeps sauces in their own group, under this heading. */
export function sauceGroupLabel(query) {
  const tokens = words(query);
  if (tokens.length !== 1) return "";
  const token = tokens[0];
  if (!dishWords(token) || token === "sauce" || token === "sauces") return "";
  return `Sauces for ${token}`;
}

/** Filed under Flying Sauces: a condiment page rather than the dish it accompanies. */
export function isCondiment(item) {
  return /sauce/i.test(item.section || "");
}

function taggedCondiment(item, token) {
  return isCondiment(item) && token !== "sauce" && token !== "sauces";
}

function dishTypeScore(item, token) {
  const list = dishWords(token);
  if (!list) return 0;
  const has = (value) => words(value).some((word) => list.includes(word));
  const inTitle = has(item.title);
  const inIngredients = has(item.ingredients);
  const inTags = (item.tags || []).some((tag) => has(tag));
  const inSection = has(item.section);
  if (!inTitle && !inIngredients && !inTags && !inSection) return 0;
  if (taggedCondiment(item, token)) return 280;
  return inTitle ? 800 : 700;
}

/** Higher is a closer match. A photograph adds one point, so it wins only a tie. */
export function rankScore(item, query) {
  const q = fold(query).trim();
  if (!q) return item.thumb ? 1 : 0;
  const tokens = words(q);
  if (!tokens.length) return 0;
  const title = fold(item.title);
  const titleWords = words(title);
  const parts = tokens.map((token) => {
    if (titleWords.some((word) => word === token)) return dishWords(token) && taggedCondiment(item, token) ? 420 : 1000;
    if (!dishWords(token) && titleWords.some((word) => typo(token, word))) return 850;
    if (hasWord(token, item.section)) return 600;
    if (placeMatch(token, item.country) || placeMatch(token, item.region)) return 1200;
    if (token === "quick" && Number.isFinite(item.minutes) && item.minutes > 0 && item.minutes <= 30) return 350;
    if ((item.diets || []).some((diet) => hasWord(token, diet))) return 350;
    if ((item.meals || []).some((meal) => hasWord(token, meal))) return 350;
    if (hasWord(token, (item.collections || []).join(" "))) return 350;
    const dish = dishTypeScore(item, token);
    if (dish) return dish;
    if (dishWords(token)) return 0;
    if (hasWord(token, item.ingredients)) return 200;
    if (hasWord(token, item.text)) return 100;
    return 0;
  });
  if (parts.some((part) => part <= 0)) return 0;
  let score = parts.reduce((sum, part) => sum + part, 0);
  if (title === q) score += 5000;
  if (tokens.every((token) => titleWords.some((word) => word === token || typo(token, word)))) score += 1500;
  return score * 10 + (item.thumb ? 1 : 0);
}

export function rankItems(items, query) {
  return items
    .filter((item) => rankScore(item, query) > 0)
    .sort((a, b) => rankScore(b, query) - rankScore(a, query) || a.title.localeCompare(b.title));
}
