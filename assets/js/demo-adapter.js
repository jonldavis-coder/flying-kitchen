import { KNOWN } from "./catalog.js";
import { summarizeRatings } from "./lib/ratings.js";
import { LIMITS, checkRateLimit } from "./lib/ratelimit.js";
import { assertHuman } from "./lib/human.js";
import {
  validateComment,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateReport,
  validateSuggestion
} from "./lib/validate.js";

const KEY = "flying-kitchen-demo-v1";

function emptyState() {
  return {
    users: [],
    sessionUserId: null,
    magicLinks: [],
    comments: [],
    hearts: [],
    ratings: [],
    reports: [],
    suggestions: [],
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
  return KNOWN.includes(slug);
}

export function createDemoAdapter(config = {}, options = {}) {
  const storage = options.storage || defaultStorage();
  const now = options.now || (() => Date.now());
  const listeners = new Set();

  function read() {
    const loaded = storage.load() || emptyState();
    return {
      ...emptyState(),
      ...loaded,
      comments: loaded.comments || [],
      hearts: loaded.hearts || [],
      ratings: loaded.ratings || [],
      reports: loaded.reports || [],
      suggestions: loaded.suggestions || [],
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

  function requireKnown(slug) {
    if (!knownSlug(slug)) fail("That page is not on this hub.", "validation");
  }

  function decorate(state, slug, session) {
    const hearts = state.hearts.filter((item) => item.slug === slug);
    const stars = state.ratings.filter((item) => item.slug === slug).map((item) => item.stars);
    const summary = summarizeRatings(stars);
    const mine = session ? state.ratings.find((item) => item.slug === slug && item.userId === session.id) : null;
    return {
      heartCount: hearts.length,
      ratingAvg: summary.ratingAvg,
      ratingCount: summary.ratingCount,
      heartedByMe: Boolean(session && hearts.some((item) => item.userId === session.id)),
      myRating: mine ? mine.stars : null
    };
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
      return { pendingConfirmation: false };
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
      if (!user) fail("That email and password did not match.", "auth");
      const hash = await sha256(`${user.salt}:${parsedPassword.value}`);
      if (hash !== user.passwordHash) fail("That email and password did not match.", "auth");
      state.sessionUserId = user.id;
      write(state);
      emit();
    },
    async signOut() {
      const state = read();
      state.sessionUserId = null;
      write(state);
      emit();
    },
    async requestMagicLink({ email }, meta) {
      assertHuman(meta, now());
      const state = read();
      takeLimit(state, "auth");
      const parsedEmail = validateEmail(email);
      if (!parsedEmail.ok) fail(parsedEmail.message, "validation");
      const user = state.users.find((item) => item.email === parsedEmail.value);
      if (!user) fail("No demo account uses that email yet.", "auth");
      const token = randomId();
      state.magicLinks.push({ token, userId: user.id, expiresAt: now() + 15 * 60 * 1000 });
      write(state);
      return {
        demo: true,
        token,
        message: "Demo mode has no email server. Use the one-time link on this page."
      };
    },
    async completeMagicLink(token) {
      const state = read();
      const link = state.magicLinks.find((item) => item.token === token);
      if (!link || link.expiresAt < now()) fail("That sign-in link has expired.", "auth");
      state.magicLinks = state.magicLinks.filter((item) => item.token !== token);
      state.sessionUserId = link.userId;
      write(state);
      emit();
    },
    async getCommunity(slug) {
      const state = read();
      return decorate(state, slug, currentSession(state));
    },
    async setHeart(slug, on) {
      const state = read();
      const session = requireUser(state);
      requireKnown(slug);
      state.hearts = state.hearts.filter((item) => !(item.slug === slug && item.userId === session.id));
      if (on) state.hearts.push({ slug, userId: session.id, createdAt: new Date(now()).toISOString() });
      write(state);
      return decorate(state, slug, session);
    },
    async setRating(slug, stars) {
      const state = read();
      const session = requireUser(state);
      requireKnown(slug);
      const value = Number(stars);
      if (!Number.isInteger(value) || value < 1 || value > 5) fail("Choose a rating from 1 to 5.", "validation");
      state.ratings = state.ratings.filter((item) => !(item.slug === slug && item.userId === session.id));
      state.ratings.push({ slug, userId: session.id, stars: value, updatedAt: new Date(now()).toISOString() });
      write(state);
      return decorate(state, slug, session);
    },
    async listComments(slug) {
      const state = read();
      const session = currentSession(state);
      return state.comments
        .filter((item) => item.slug === slug)
        .filter((item) => !item.hidden || session?.isOwner || item.authorId === session?.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async addComment(slug, body, meta) {
      assertHuman(meta, now());
      const state = read();
      const session = requireUser(state);
      requireKnown(slug);
      takeLimit(state, "comment");
      const parsed = validateComment(body);
      if (!parsed.ok) fail(parsed.message, "validation");
      const comment = {
        id: randomId(),
        slug,
        body: parsed.value,
        authorId: session.id,
        authorName: session.displayName,
        createdAt: new Date(now()).toISOString(),
        hidden: false
      };
      state.comments.push(comment);
      write(state);
      return comment;
    },
    async reportComment({ slug, commentId, reason, note }, meta) {
      assertHuman(meta, now());
      const state = read();
      const session = requireUser(state);
      takeLimit(state, "report");
      const parsed = validateReport({ reason, note });
      if (!parsed.ok) fail(parsed.message, "validation");
      state.reports.push({
        id: randomId(),
        slug,
        commentId,
        ...parsed.value,
        reporterId: session.id,
        createdAt: new Date(now()).toISOString()
      });
      write(state);
    },
    async listModeration() {
      const state = read();
      const session = requireUser(state);
      if (!session.isOwner) fail("Owner tools stay off until an owner email is set and that account is signed in.", "auth");
      return {
        comments: state.comments.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        reports: state.reports.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      };
    },
    async setCommentHidden(id, hidden) {
      const state = read();
      const session = requireUser(state);
      if (!session.isOwner) fail("Owner tools stay off for this account.", "auth");
      const comment = state.comments.find((item) => item.id === id);
      if (!comment) fail("That comment is not in this browser.", "validation");
      comment.hidden = Boolean(hidden);
      write(state);
    },
    async listSuggestions() {
      const state = read();
      const session = currentSession(state);
      if (!session) return [];
      return state.suggestions.filter((item) => item.authorId === session.id);
    },
    async addSuggestion(input, meta) {
      assertHuman(meta, now());
      const state = read();
      const session = requireUser(state);
      takeLimit(state, "suggest");
      const parsed = validateSuggestion(input);
      if (!parsed.ok) fail(parsed.message, "validation");
      const suggestion = {
        id: randomId(),
        ...parsed.value,
        authorId: session.id,
        createdAt: new Date(now()).toISOString()
      };
      state.suggestions.push(suggestion);
      write(state);
      return suggestion;
    }
  };

  return api;
}
