export function assertHuman(meta = {}, now = Date.now()) {
  if (meta?.honeypot) {
    const error = new Error("Could not submit that.");
    error.code = "spam";
    throw error;
  }
  const openedAt = Number(meta?.openedAt);
  if (!openedAt || now - openedAt < 1200) {
    const error = new Error("Please take a moment and try again.");
    error.code = "fast";
    throw error;
  }
}

export function readFormMeta(form) {
  const data = new FormData(form);
  const honeypot = String(data.get("website") || "").trim();
  return {
    honeypot,
    openedAt: Number(form.dataset.openedAt || 0)
  };
}

export function armForm(form) {
  if (!form.dataset.openedAt) form.dataset.openedAt = String(Date.now());
}
