import { CATALOG } from "./catalog.js";
import { summarizeRatings } from "./lib/ratings.js";
import { uniqueSlug } from "./lib/slug.js";
import { LIMITS, checkRateLimit } from "./lib/ratelimit.js";
import { assertHuman } from "./lib/human.js";
import {
  validateComment,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateReport,
  validateDish,
  validateTwist
} from "./lib/validate.js";

const KEY = "flying-bbq-demo-v1";

function emptyState() {
  return {
    users: [],
    sessionUserId: null,
    magicLinks: [],
    dishes: [],
    comments: [],
    twists: [],
    hearts: [],
    ratings: [],
    reports: [],
    flags: {},
    limits: {}
  };
}

function defaultStorage() {
  return {
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
      } catch {
        return emptyState();
      }
    },
    save(state) {
      localStorage.setItem(KEY, JSON.stringify(state));
    }
  };
}

function fail(message, code) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function knownSlug(slug) {
  return CATALOG.some((dish) => dish.slug === slug);
}

export function createDemoAdapter(config = {}, options = {}) {
  const storage = options.storage || defaultStorage();
  const now = options.now || (() => Date.now());
  const listeners = new Set();

  function read() {
    const loaded = storage.load();
    if (!loaded) return emptyState();
    return {
      ...emptyState(),
      ...loaded,
      comments: loaded.comments || [],
      twists: loaded.twists || [],
      hearts: loaded.hearts || [],
      ratings: loaded.ratings || [],
      reports: loaded.reports || [],
      dishes: loaded.dishes || [],
      flags: loaded.flags || {},
      limits: loaded.limits || {},
      users: loaded.users || [],
      magicLinks: loaded.magicLinks || []
    };
  }

  function write(state) {
    storage.save(state);
    return state;
  }

  function emit() {
    const session = currentSession(read());
    for (const listener of listeners) listener(session);
  }

  function currentSession(state) {
    const user = state.users.find((item) => item.id === state.sessionUserId);
    if (!user) return null;
    const ownerEmail = String(config.OWNER_EMAIL || "").trim().toLowerCase();
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isOwner: Boolean(ownerEmail) && user.email === ownerEmail
    };
  }

  function requireUser(state) {
    const session = currentSession(state);
    if (!session) fail("Sign in to do that.", "auth");
    return session;
  }

  function takeLimit(state, bucket) {
    const rule = LIMITS[bucket];
    const stamps = state.limits[bucket] || [];
    const result = checkRateLimit(stamps, { ...rule, now: now() });
    if (!result.ok) fail(result.message, "rate");
    state.limits[bucket] = [...result.recent, now()];
  }

  function flagFor(state, slug) {
    return state.flags[slug] || { hidden: false, deleted: false };
  }

  function decorateStats(state, slug, session) {
    const hearts = state.hearts.filter((item) => item.slug === slug);
    const stars = state.ratings.filter((item) => item.slug === slug).map((item) => item.stars);
    const summary = summarizeRatings(stars);
    const mine = session ? state.ratings.find((item) => item.slug === slug && item.userId === session.id) : null;
    const flag = flagFor(state, slug);
    return {
      heartCount: hearts.length,
      ratingAvg: summary.ratingAvg,
      ratingCount: summary.ratingCount,
      heartedByMe: Boolean(session && hearts.some((item) => item.userId === session.id)),
      myRating: mine ? mine.stars : null,
      hidden: Boolean(flag.hidden),
      deleted: Boolean(flag.deleted)
    };
  }

  function publicComments(state, slug, session) {
    return state.comments
      .filter((item) => item.slug === slug)
      .filter((item) => !item.hidden || session?.isOwner || item.authorId === session?.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  function publicTwists(state, slug, session) {
    return state.twists
      .filter((item) => item.slug === slug)
      .filter((item) => !item.hidden || session?.isOwner || item.authorId === session?.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  const api = {
    mode: "demo",
    fallbackReason: "",
    async getSession() {
      return currentSession(read());
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async signUp({ email, password, displayName }, meta) {
      assertHuman(meta, now());
      const state = read();
      takeLimit(state, "auth");
      const parsedEmail = validateEmail(email);
      if (!parsedEmail.ok) fail(parsedEmail.message, "validation");
      const parsedPassword = validatePassword(password);
      if (!parsedPassword.ok) fail(parsedPassword.message, "validation");
      const parsedName = validateDisplayName(displayName);
      if (!parsedName.ok) fail(parsedName.message, "validation");
      if (state.users.some((user) => user.email === parsedEmail.value)) {
        fail("An account with that email already exists. Sign in instead.", "auth");
      }
      const salt = randomId();
      const user = {
        id: randomId(),
        email: parsedEmail.value,
        displayName: parsedName.value,
        salt,
        passwordHash: await sha256(`${salt}:${parsedPassword.value}`),
        createdAt: new Date(now()).toISOString()
      };
      state.users.push(user);
      state.sessionUserId = user.id;
      write(state);
      emit();
      return currentSession(state);
    },
    async signIn({ email, password }, meta) {
      assertHuman(meta, now());
      const state = read();
      takeLimit(state, "auth");
      const parsedEmail = validateEmail(email);
      if (!parsedEmail.ok) fail(parsedEmail.message, "validation");
      const parsedPassword = validatePassword(password);
      if (!parsedPassword.ok) fail(parsedPassword.message, "validation");
      const user = state.users.find((item) => item.email === parsedEmail.value);
      const hash = user ? await sha256(`${user.salt}:${parsedPassword.value}`) : "";
      if (!user || hash !== user.passwordHash) fail("That email and password do not match.", "auth");
      state.sessionUserId = user.id;
      write(state);
      emit();
      return currentSession(state);
    },
    async requestMagicLink({ email }, meta) {
      assertHuman(meta, now());
      const state = read();
      takeLimit(state, "auth");
      const parsedEmail = validateEmail(email);
      if (!parsedEmail.ok) fail(parsedEmail.message, "validation");
      const user = state.users.find((item) => item.email === parsedEmail.value);
      if (!user) fail("No account uses that email yet. Create one first.", "auth");
      const token = randomId() + randomId();
      const tokenHash = await sha256(token);
      state.magicLinks = state.magicLinks.filter((item) => item.expiresAt > now());
      state.magicLinks.push({ tokenHash, userId: user.id, expiresAt: now() + 15 * 60 * 1000 });
      write(state);
      return {
        demo: true,
        token,
        message: "Demo mode has no email server. Use the one-time link on this page to finish signing in."
      };
    },
    async completeMagicLink(token) {
      const state = read();
      const tokenHash = await sha256(String(token || ""));
      const link = state.magicLinks.find((item) => item.tokenHash === tokenHash && item.expiresAt > now());
      if (!link) fail("That sign-in link is invalid or expired.", "auth");
      state.magicLinks = state.magicLinks.filter((item) => item !== link);
      state.sessionUserId = link.userId;
      write(state);
      emit();
      return currentSession(state);
    },
    async signOut() {
      const state = read();
      state.sessionUserId = null;
      write(state);
      emit();
    },
    async getCommunity(slug) {
      const state = read();
      const session = currentSession(state);
      const userDish = state.dishes.find((item) => item.slug === slug);
      if (!knownSlug(slug) && !userDish) return null;
      return decorateStats(state, slug, session);
    },
    async listActivity() {
      const state = read();
      const slugs = new Set([
        ...state.hearts.map((item) => item.slug),
        ...state.ratings.map((item) => item.slug)
      ]);
      return [...slugs].map((slug) => {
        const stats = decorateStats(state, slug, null);
        return { slug, heartCount: stats.heartCount, ratingAvg: stats.ratingAvg, ratingCount: stats.ratingCount };
      });
    },
    async listUserDishes() {
      const state = read();
      const session = currentSession(state);
      return state.dishes
        .filter((dish) => !flagFor(state, dish.slug).deleted)
        .filter((dish) => !dish.hidden || session?.isOwner || dish.authorId === session?.id)
        .map((dish) => ({ ...dish, ...decorateStats(state, dish.slug, session) }));
    },
    async submitDish(input, meta) {
      assertHuman(meta, now());
      const state = read();
      const session = requireUser(state);
      takeLimit(state, "dish");
      const parsed = validateDish(input);
      if (!parsed.ok) fail(parsed.message, "validation");
      const lowered = parsed.value.name.toLowerCase();
      if (CATALOG.some((dish) => dish.name.toLowerCase() === lowered)) {
        fail("That dish is already in the field guide. Add a twist on its page instead.", "validation");
      }
      if (state.dishes.some((dish) => dish.authorId === session.id && dish.name.toLowerCase() === lowered)) {
        fail("You already submitted a dish with that name.", "validation");
      }
      const slug = uniqueSlug(parsed.value.name, new Set([...CATALOG, ...state.dishes].map((dish) => dish.slug)));
      let photo = "";
      if (input.photoDataUrl) {
        if (typeof input.photoDataUrl !== "string" || !input.photoDataUrl.startsWith("data:image/")) {
          fail("The picture must be an image.", "validation");
        }
        if (input.photoDataUrl.length > 450000) fail("That picture is too large to save in this browser.", "validation");
        photo = input.photoDataUrl;
      }
      const dish = {
        slug,
        ...parsed.value,
        photo,
        sample: false,
        authorId: session.id,
        authorName: session.displayName,
        createdAt: new Date(now()).toISOString(),
        hidden: false
      };
      state.dishes.push(dish);
      write(state);
      return { ...dish, ...decorateStats(state, slug, session) };
    },
    async setHeart(slug, on) {
      const state = read();
      const session = requireUser(state);
      if (!knownSlug(slug) && !state.dishes.some((item) => item.slug === slug)) fail("That dish was not found.", "validation");
      state.hearts = state.hearts.filter((item) => !(item.slug === slug && item.userId === session.id));
      if (on) state.hearts.push({ slug, userId: session.id, createdAt: new Date(now()).toISOString() });
      write(state);
      return decorateStats(state, slug, session);
    },
    async setRating(slug, stars) {
      const state = read();
      const session = requireUser(state);
      const value = Number(stars);
      if (!Number.isInteger(value) || value < 1 || value > 5) fail("Choose a rating from 1 to 5.", "validation");
      if (!knownSlug(slug) && !state.dishes.some((item) => item.slug === slug)) fail("That dish was not found.", "validation");
      state.ratings = state.ratings.filter((item) => !(item.slug === slug && item.userId === session.id));
      state.ratings.push({ slug, userId: session.id, stars: value, updatedAt: new Date(now()).toISOString() });
      write(state);
      return decorateStats(state, slug, session);
    },
    async listComments(slug) {
      const state = read();
      return publicComments(state, slug, currentSession(state));
    },
    async addComment(slug, body, meta) {
      assertHuman(meta, now());
      const state = read();
      const session = requireUser(state);
      takeLimit(state, "comment");
      const parsed = validateComment(body);
      if (!parsed.ok) fail(parsed.message, "validation");
      if (!knownSlug(slug) && !state.dishes.some((item) => item.slug === slug)) fail("That dish was not found.", "validation");
      const duplicate = state.comments.some((item) => (
        item.slug === slug && item.authorId === session.id && item.body === parsed.value && Date.parse(item.createdAt) > now() - 86400000
      ));
      if (duplicate) fail("That comment was already posted.", "validation");
      const comment = {
        id: randomId(),
        slug,
        authorId: session.id,
        authorName: session.displayName,
        body: parsed.value,
        hidden: false,
        createdAt: new Date(now()).toISOString()
      };
      state.comments.push(comment);
      write(state);
      return comment;
    },
    async deleteComment(id) {
      const state = read();
      const session = requireUser(state);
      const comment = state.comments.find((item) => item.id === id);
      if (!comment) fail("That comment was not found.", "validation");
      if (comment.authorId !== session.id && !session.isOwner) fail("You can remove only your own comment.", "auth");
      state.comments = state.comments.filter((item) => item.id !== id);
      write(state);
    },
    async listTwists(slug) {
      const state = read();
      return publicTwists(state, slug, currentSession(state));
    },
    async addTwist(slug, input, meta) {
      assertHuman(meta, now());
      const state = read();
      const session = requireUser(state);
      takeLimit(state, "twist");
      const parsed = validateTwist(input);
      if (!parsed.ok) fail(parsed.message, "validation");
      if (!knownSlug(slug) && !state.dishes.some((item) => item.slug === slug)) fail("That dish was not found.", "validation");
      const twist = {
        id: randomId(),
        slug,
        authorId: session.id,
        authorName: session.displayName,
        title: parsed.value.title,
        body: parsed.value.body,
        hidden: false,
        createdAt: new Date(now()).toISOString()
      };
      state.twists.push(twist);
      write(state);
      return twist;
    },
    async deleteTwist(id) {
      const state = read();
      const session = requireUser(state);
      const twist = state.twists.find((item) => item.id === id);
      if (!twist) fail("That twist was not found.", "validation");
      if (twist.authorId !== session.id && !session.isOwner) fail("You can remove only your own twist.", "auth");
      state.twists = state.twists.filter((item) => item.id !== id);
      write(state);
    },
    async report(input, meta) {
      assertHuman(meta, now());
      const state = read();
      const session = requireUser(state);
      takeLimit(state, "report");
      const parsed = validateReport(input || {});
      if (!parsed.ok) fail(parsed.message, "validation");
      const targetType = input?.targetType === "comment" || input?.targetType === "twist" ? input.targetType : "dish";
      state.reports.push({
        id: randomId(),
        reporterId: session.id,
        reporterName: session.displayName,
        targetType,
        targetId: String(input?.targetId || input?.slug || ""),
        slug: String(input?.slug || ""),
        reason: parsed.value.reason,
        note: parsed.value.note,
        createdAt: new Date(now()).toISOString()
      });
      write(state);
    },
    async listModeration() {
      const state = read();
      const session = requireUser(state);
      if (!session.isOwner) fail("Only the owner can open the desk.", "auth");
      return {
        reports: state.reports.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        comments: state.comments.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40),
        twists: state.twists.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40),
        dishes: state.dishes.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      };
    },
    async setHidden(slug, hidden) {
      const state = read();
      const session = requireUser(state);
      if (!session.isOwner) fail("Only the owner can hide a dish.", "auth");
      if (!knownSlug(slug) && !state.dishes.some((item) => item.slug === slug)) fail("That dish was not found.", "validation");
      state.flags[slug] = { ...flagFor(state, slug), hidden: Boolean(hidden) };
      const stored = state.dishes.find((item) => item.slug === slug);
      if (stored) stored.hidden = Boolean(hidden);
      write(state);
    },
    async setCommentHidden(id, hidden) {
      const state = read();
      const session = requireUser(state);
      if (!session.isOwner) fail("Only the owner can hide a comment.", "auth");
      const comment = state.comments.find((item) => item.id === id);
      if (!comment) fail("That comment was not found.", "validation");
      comment.hidden = Boolean(hidden);
      write(state);
    },
    async setTwistHidden(id, hidden) {
      const state = read();
      const session = requireUser(state);
      if (!session.isOwner) fail("Only the owner can hide a twist.", "auth");
      const twist = state.twists.find((item) => item.id === id);
      if (!twist) fail("That twist was not found.", "validation");
      twist.hidden = Boolean(hidden);
      write(state);
    }
  };

  return api;
}
