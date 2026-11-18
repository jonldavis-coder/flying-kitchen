import { createDemoAdapter } from "./demo-adapter.js";

export function isSupabaseConfigured(config) {
  const url = String(config?.SUPABASE_URL || "").trim();
  const key = String(config?.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
  } catch {
    return false;
  }
  return key.length >= 20;
}

let pending;

export function getAdapter() {
  if (!pending) pending = initAdapter();
  return pending;
}

async function initAdapter() {
  const config = window.FLYING_SAUCES_CONFIG || {};
  if (!isSupabaseConfigured(config)) return createDemoAdapter(config);
  try {
    const { createSupabaseAdapter } = await import("./supabase-adapter.js");
    return await createSupabaseAdapter(config);
  } catch (error) {
    console.warn("Supabase did not start; using demo mode.", error);
    const demo = createDemoAdapter(config);
    demo.fallbackReason = "Supabase could not be started, so this browser is in demo mode.";
    return demo;
  }
}
