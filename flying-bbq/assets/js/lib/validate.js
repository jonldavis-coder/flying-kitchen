import { BASE_TYPE_IDS, DIET_IDS, HEAT_IDS, REGION_NAMES, USE_IDS } from "../../../data/vocabulary.js";

const LINK_PATTERN = /https?:\/\/|www\./gi;

export function countLinks(text) {
  return (String(text || "").match(LINK_PATTERN) || []).length;
}

function cleanLines(list, { maxItems, maxLen, label }) {
  if (!Array.isArray(list)) return { ok: false, message: `Add ${label}.` };
  const lines = list.map((item) => String(item || "").trim()).filter(Boolean);
  if (!lines.length) return { ok: false, message: `Add at least one ${label}.` };
  if (lines.length > maxItems) return { ok: false, message: `Use ${maxItems} ${label} or fewer.` };
  if (lines.some((line) => line.length > maxLen)) {
    return { ok: false, message: `Each ${label} line must be ${maxLen} characters or fewer.` };
  }
  return { ok: true, lines };
}

export function validateEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    return { ok: false, message: "Enter a valid email address." };
  }
  return { ok: true, value: email };
}

export function validatePassword(value) {
  const password = String(value || "");
  if (password.length < 8) return { ok: false, message: "Use a password of at least 8 characters." };
  if (password.length > 200) return { ok: false, message: "That password is too long." };
  return { ok: true, value: password };
}

export function validateDisplayName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 40) {
    return { ok: false, message: "Use a display name of 1 to 40 characters." };
  }
  if (!/^[a-zA-Z0-9 ._-]+$/.test(name)) {
    return { ok: false, message: "Use letters, numbers, spaces, periods, underscores, or hyphens in the name." };
  }
  return { ok: true, value: name };
}

export function validateComment(body) {
  const text = String(body || "").trim();
  if (text.length < 2) return { ok: false, message: "Write a comment of at least 2 characters." };
  if (text.length > 2000) return { ok: false, message: "Keep the comment to 2000 characters or fewer." };
  if (countLinks(text) > 2) return { ok: false, message: "Keep the comment to two links or fewer." };
  if (/^(https?:\/\/|www\.)\S+$/i.test(text)) {
    return { ok: false, message: "Write the comment in words. A bare link is not enough." };
  }
  return { ok: true, value: text };
}

export function validateTwist(input) {
  const title = String(input?.title || "").trim();
  const body = String(input?.body || "").trim();
  if (title.length < 3) return { ok: false, message: "Name the twist in at least 3 characters." };
  if (title.length > 120) return { ok: false, message: "Keep the twist name to 120 characters or fewer." };
  if (countLinks(title) > 0) return { ok: false, message: "Keep links out of the twist name." };
  if (body.length < 2) return { ok: false, message: "Describe the twist." };
  if (body.length > 2000) return { ok: false, message: "Keep the twist to 2000 characters or fewer." };
  if (countLinks(body) > 2) return { ok: false, message: "Keep the twist to two links or fewer." };
  return { ok: true, value: { title, body } };
}

export function validateReport({ reason, note }) {
  const why = String(reason || "").trim();
  const extra = String(note || "").trim();
  const allowed = ["Spam", "Harassment", "Dangerous instructions", "Incorrect recipe", "Other"];
  if (!allowed.includes(why)) return { ok: false, message: "Choose a reason." };
  if (extra.length > 1000) return { ok: false, message: "Keep the note to 1000 characters or fewer." };
  if (countLinks(extra) > 2) return { ok: false, message: "Keep the note to two links or fewer." };
  return { ok: true, value: { reason: why, note: extra } };
}

export function validateDish(input) {
  const name = String(input?.name || "").trim();
  const story = String(input?.story || "").trim();
  const country = String(input?.country || "").trim();
  const region = String(input?.region || "").trim();
  const baseType = String(input?.baseType || "").trim();
  const heat = String(input?.heat || "").trim();
  const flavor = String(input?.flavor || "").trim();
  const funFact = String(input?.funFact || "").trim();
  const yieldText = String(input?.yieldText || "").trim();
  const prepMinutes = Number(input?.prepMinutes);
  const cookMinutes = Number(input?.cookMinutes);
  const servings = Number(input?.servings);
  const uses = Array.isArray(input?.uses) ? input.uses.filter((item) => USE_IDS.includes(item)) : [];
  const diets = Array.isArray(input?.diets) ? input.diets.filter((item) => DIET_IDS.includes(item)) : [];

  if (name.length < 3) return { ok: false, message: "Give the dish a name of at least 3 characters." };
  if (name.length > 120) return { ok: false, message: "Keep the name to 120 characters or fewer." };
  if (countLinks(name) > 0) return { ok: false, message: "Keep links out of the name." };
  if (country.length < 2 || country.length > 60) return { ok: false, message: "Enter the country." };
  if (!REGION_NAMES.includes(region)) return { ok: false, message: "Choose a region." };
  if (!BASE_TYPE_IDS.includes(baseType)) return { ok: false, message: "Choose a base type." };
  if (!HEAT_IDS.includes(heat)) return { ok: false, message: "Choose a heat level." };
  if (flavor.length < 8 || flavor.length > 400) return { ok: false, message: "Add a short flavor line." };
  if (story.length < 20 || story.length > 2000) return { ok: false, message: "Add a short origin note, up to 2000 characters." };
  if (countLinks(story) > 2) return { ok: false, message: "Keep the origin note to two links or fewer." };
  if (funFact.length < 8 || funFact.length > 400) return { ok: false, message: "Add one fun fact." };
  if (yieldText.length < 2 || yieldText.length > 80) return { ok: false, message: "Add a yield, such as about 1 cup." };
  if (!Number.isInteger(prepMinutes) || prepMinutes < 0 || prepMinutes > 1440) {
    return { ok: false, message: "Enter prep time in whole minutes, from 0 to 1440." };
  }
  if (!Number.isInteger(cookMinutes) || cookMinutes < 0 || cookMinutes > 1440) {
    return { ok: false, message: "Enter cook time in whole minutes, from 0 to 1440." };
  }
  if (prepMinutes + cookMinutes < 1) return { ok: false, message: "Enter a prep time or a cook time." };
  if (!Number.isInteger(servings) || servings < 1 || servings > 100) {
    return { ok: false, message: "Enter servings from 1 to 100." };
  }
  if (!uses.length) return { ok: false, message: "Choose at least one use." };

  const ingredients = cleanLines(input?.ingredients, { maxItems: 40, maxLen: 200, label: "ingredient" });
  if (!ingredients.ok) return ingredients;
  const steps = cleanLines(input?.steps, { maxItems: 30, maxLen: 1000, label: "step" });
  if (!steps.ok) return steps;

  return {
    ok: true,
    value: {
      name,
      story,
      country,
      region,
      baseType,
      heat,
      flavor,
      funFact,
      yieldText,
      prepMinutes,
      cookMinutes,
      servings,
      uses,
      diets,
      ingredients: ingredients.lines,
      steps: steps.lines
    }
  };
}

export function safeNextPath(value) {
  const raw = String(value || "index.html").trim();
  if (!raw || raw.includes("://") || raw.startsWith("//") || raw.includes("\\") || raw.includes("..")) {
    return "index.html";
  }
  const withoutOrigin = raw.replace(/^\/+/, "");
  if (withoutOrigin.length > 300) return "index.html";
  return withoutOrigin || "index.html";
}
