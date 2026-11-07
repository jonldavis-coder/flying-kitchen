const LINK_PATTERN = /https?:\/\/|www\./gi;

export function countLinks(text) {
  return (String(text || "").match(LINK_PATTERN) || []).length;
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

export function validateReport({ reason, note }) {
  const why = String(reason || "").trim();
  const extra = String(note || "").trim();
  const allowed = ["Spam", "Harassment", "Dangerous instructions", "Incorrect note", "Other"];
  if (!allowed.includes(why)) return { ok: false, message: "Choose a reason." };
  if (extra.length > 1000) return { ok: false, message: "Keep the note to 1000 characters or fewer." };
  return { ok: true, value: { reason: why, note: extra } };
}

const ALLOWED_PREFIXES = [
  "https://jonldavis-coder.github.io/flying-sauces/",
  "https://jonldavis-coder.github.io/flying-pancakes/",
  "https://jonldavis-coder.github.io/flying-bbq/",
  "https://github.com/jonldavis-coder/flying-sauces",
  "https://github.com/jonldavis-coder/flying-pancakes",
  "https://github.com/jonldavis-coder/flying-bbq"
];

export function validateSuggestion({ title, url, note }) {
  const name = String(title || "").trim();
  const link = String(url || "").trim();
  const body = String(note || "").trim();
  if (name.length < 2 || name.length > 140) return { ok: false, message: "Name the entry in 2 to 140 characters." };
  let parsed;
  try {
    parsed = new URL(link);
  } catch {
    return { ok: false, message: "Enter the full https address from a Flying site." };
  }
  if (parsed.protocol !== "https:") return { ok: false, message: "Use an https address." };
  if (!ALLOWED_PREFIXES.some((prefix) => link.startsWith(prefix))) {
    return { ok: false, message: "Suggestions stay on the Flying Sauces, Flying Pancakes, and Flying BBQ sites." };
  }
  if (body.length > 500) return { ok: false, message: "Keep the note to 500 characters or fewer." };
  return { ok: true, value: { title: name, url: link, note: body } };
}

export function safeNextPath(value) {
  const next = String(value || "index.html");
  if (next.startsWith("http") || next.startsWith("//") || next.includes("..")) return "index.html";
  return next.replace(/^\//, "") || "index.html";
}
