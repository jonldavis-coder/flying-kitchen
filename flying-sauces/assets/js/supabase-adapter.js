import { CATALOG } from "./catalog.js";
import { uniqueSlug } from "./lib/slug.js";
import { LIMITS, checkRateLimit } from "./lib/ratelimit.js";
import { assertHuman } from "./lib/human.js";
import {
  validateComment,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateReport,
  validateSauce,
  validateTwist
} from "./lib/validate.js";

function fail(message, code) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

const LIMIT_KEY = "flying-sauces-limits";

export async function createSupabaseAdapter(config) {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm");
  const redirect = `${location.origin}${config.BASE_PATH || "/"}login.html`;
  const client = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  function loadLimits() {
    try {
      return JSON.parse(localStorage.getItem(LIMIT_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function takeLimit(bucket) {
    const limits = loadLimits();
    const rule = LIMITS[bucket];
    const result = checkRateLimit(limits[bucket] || [], rule);
    if (!result.ok) fail(result.message, "rate");
    limits[bucket] = [...result.recent, Date.now()];
    localStorage.setItem(LIMIT_KEY, JSON.stringify(limits));
  }

  async function sessionUser() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    const user = data.session?.user;
    if (!user) return null;
    const { data: owner } = await client.rpc("am_i_owner");
    const metaName = user.user_metadata?.display_name;
    return {
      id: user.id,
      email: user.email,
      displayName: metaName || String(user.email || "Cook").split("@")[0],
      isOwner: owner === true
    };
  }

  async function requireUser() {
    const session = await sessionUser();
    if (!session) fail("Sign in to do that.", "auth");
    return session;
  }

  function knownSlug(slug) {
    return CATALOG.some((sauce) => sauce.slug === slug);
  }

  async function statsFor(slug) {
    const [{ data: stats, error: statsError }, { data: mine, error: mineError }, { data: flag }] = await Promise.all([
      client.rpc("sauce_stats"),
      client.rpc("my_sauce_activity"),
      client.from("sauce_flags").select("slug, hidden, deleted").eq("slug", slug).maybeSingle()
    ]);
    if (statsError) throw statsError;
    if (mineError) throw mineError;
    const row = (stats || []).find((item) => item.sauce_slug === slug) || {};
    const hearted = new Set(mine?.hearts || []);
    const ratings = new Map((mine?.ratings || []).map((item) => [item.slug, item.stars]));
    return {
      heartCount: row.heart_count || 0,
      ratingAvg: Number(row.rating_avg || 0),
      ratingCount: row.rating_count || 0,
      heartedByMe: hearted.has(slug),
      myRating: ratings.has(slug) ? ratings.get(slug) : null,
      hidden: Boolean(flag?.hidden),
      deleted: Boolean(flag?.deleted)
    };
  }

  async function slugExists(slug) {
    if (knownSlug(slug)) return true;
    const { data, error } = await client.from("sauces").select("slug").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  return {
    mode: "supabase",
    fallbackReason: "",
    async getSession() {
      return sessionUser();
    },
    onChange(listener) {
      const { data } = client.auth.onAuthStateChange(async () => {
        listener(await sessionUser());
      });
      return () => data.subscription.unsubscribe();
    },
    async signUp({ email, password, displayName }, meta) {
      assertHuman(meta);
      takeLimit("auth");
      const parsedEmail = validateEmail(email);
      if (!parsedEmail.ok) fail(parsedEmail.message, "validation");
      const parsedPassword = validatePassword(password);
      if (!parsedPassword.ok) fail(parsedPassword.message, "validation");
      const parsedName = validateDisplayName(displayName);
      if (!parsedName.ok) fail(parsedName.message, "validation");
      const { data, error } = await client.auth.signUp({
        email: parsedEmail.value,
        password: parsedPassword.value,
        options: {
          emailRedirectTo: redirect,
          data: { display_name: parsedName.value }
        }
      });
      if (error) fail(error.message, "auth");
      if (!data.session) return { pendingConfirmation: true };
      return sessionUser();
    },
    async signIn({ email, password }, meta) {
      assertHuman(meta);
      takeLimit("auth");
      const parsedEmail = validateEmail(email);
      if (!parsedEmail.ok) fail(parsedEmail.message, "validation");
      const parsedPassword = validatePassword(password);
      if (!parsedPassword.ok) fail(parsedPassword.message, "validation");
      const { error } = await client.auth.signInWithPassword({
        email: parsedEmail.value,
        password: parsedPassword.value
      });
      if (error) fail("That email and password do not match.", "auth");
      return sessionUser();
    },
    async requestMagicLink({ email }, meta) {
      assertHuman(meta);
      takeLimit("auth");
      const parsedEmail = validateEmail(email);
      if (!parsedEmail.ok) fail(parsedEmail.message, "validation");
      const { error } = await client.auth.signInWithOtp({
        email: parsedEmail.value,
        options: { emailRedirectTo: redirect }
      });
      if (error) fail(error.message, "auth");
      return { demo: false, message: "Check your email for a one-time sign-in link." };
    },
    async completeMagicLink() {
      return sessionUser();
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
    async getCommunity(slug) {
      if (!(await slugExists(slug))) return null;
      const stats = await statsFor(slug);
      if (stats.deleted) return null;
      return stats;
    },
    async listActivity() {
      const { data, error } = await client.rpc("sauce_stats");
      if (error) throw error;
      return (data || []).map((row) => ({
        slug: row.sauce_slug,
        heartCount: row.heart_count || 0,
        ratingAvg: Number(row.rating_avg || 0),
        ratingCount: row.rating_count || 0
      }));
    },
    async listUserSauces() {
      const session = await sessionUser();
      const { data, error } = await client.from("sauces").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const { data: flags } = await client.from("sauce_flags").select("slug, hidden, deleted");
      const flagMap = new Map((flags || []).map((row) => [row.slug, row]));
      return (data || [])
        .filter((row) => !flagMap.get(row.slug)?.deleted)
        .filter((row) => !row.hidden || session?.isOwner || row.author_id === session?.id)
        .map((row) => ({
          slug: row.slug,
          name: row.name,
          story: row.story || "",
          country: row.country,
          region: row.region,
          baseType: row.base_type,
          heat: row.heat,
          flavor: row.flavor || "",
          funFact: row.fun_fact || "",
          yieldText: row.yield_text,
          servings: row.servings,
          prepMinutes: row.prep_minutes,
          cookMinutes: row.cook_minutes,
          uses: row.uses || [],
          diets: row.diets || [],
          ingredients: row.ingredients || [],
          steps: row.steps || [],
          photo: row.photo_url || "",
          sample: false,
          authorId: row.author_id,
          authorName: row.author_name || "Cook",
          createdAt: row.created_at,
          hidden: Boolean(row.hidden)
        }));
    },
    async submitSauce(input, meta) {
      assertHuman(meta);
      const session = await requireUser();
      takeLimit("sauce");
      const parsed = validateSauce(input);
      if (!parsed.ok) fail(parsed.message, "validation");
      const lowered = parsed.value.name.toLowerCase();
      if (CATALOG.some((sauce) => sauce.name.toLowerCase() === lowered)) {
        fail("That sauce is already in the field guide. Add a twist on its page instead.", "validation");
      }
      const slug = uniqueSlug(parsed.value.name, new Set(CATALOG.map((sauce) => sauce.slug)));
      let photoUrl = null;
      if (input.photoDataUrl && String(input.photoDataUrl).startsWith("data:image/")) {
        const blob = await (await fetch(input.photoDataUrl)).blob();
        if (blob.size > 800000) fail("That picture is too large.", "validation");
        const ext = blob.type.includes("png") ? "png" : "jpg";
        const path = `${session.id}/${slug}.${ext}`;
        const { error: uploadError } = await client.storage.from("sauce-photos").upload(path, blob, {
          upsert: true,
          contentType: blob.type
        });
        if (uploadError) fail(uploadError.message, "validation");
        photoUrl = client.storage.from("sauce-photos").getPublicUrl(path).data.publicUrl;
      }
      const row = {
        slug,
        author_id: session.id,
        author_name: session.displayName,
        name: parsed.value.name,
        story: parsed.value.story,
        country: parsed.value.country,
        region: parsed.value.region,
        base_type: parsed.value.baseType,
        heat: parsed.value.heat,
        flavor: parsed.value.flavor,
        fun_fact: parsed.value.funFact,
        yield_text: parsed.value.yieldText,
        servings: parsed.value.servings,
        prep_minutes: parsed.value.prepMinutes,
        cook_minutes: parsed.value.cookMinutes,
        uses: parsed.value.uses,
        diets: parsed.value.diets,
        ingredients: parsed.value.ingredients,
        steps: parsed.value.steps,
        photo_url: photoUrl,
        hidden: false
      };
      const { error } = await client.from("sauces").insert(row);
      if (error) fail(error.message, "validation");
      return { ...parsed.value, slug, sample: false, authorName: session.displayName, photo: photoUrl || "" };
    },
    async setHeart(slug, on) {
      const session = await requireUser();
      if (!(await slugExists(slug))) fail("That sauce was not found.", "validation");
      if (on) {
        const { error } = await client.from("hearts").insert({ user_id: session.id, sauce_slug: slug });
        if (error && error.code !== "23505") fail(error.message, "validation");
      } else {
        const { error } = await client.from("hearts").delete().eq("user_id", session.id).eq("sauce_slug", slug);
        if (error) fail(error.message, "validation");
      }
      return statsFor(slug);
    },
    async setRating(slug, stars) {
      const session = await requireUser();
      const value = Number(stars);
      if (!Number.isInteger(value) || value < 1 || value > 5) fail("Choose a rating from 1 to 5.", "validation");
      if (!(await slugExists(slug))) fail("That sauce was not found.", "validation");
      const { error } = await client.from("ratings").upsert({
        user_id: session.id,
        sauce_slug: slug,
        stars: value,
        updated_at: new Date().toISOString()
      });
      if (error) fail(error.message, "validation");
      return statsFor(slug);
    },
    async listComments(slug) {
      const { data, error } = await client.from("comments").select("*").eq("sauce_slug", slug).order("created_at");
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        slug: row.sauce_slug,
        authorId: row.author_id,
        authorName: row.author_name,
        body: row.body,
        hidden: row.hidden,
        createdAt: row.created_at
      }));
    },
    async addComment(slug, body, meta) {
      assertHuman(meta);
      const session = await requireUser();
      takeLimit("comment");
      const parsed = validateComment(body);
      if (!parsed.ok) fail(parsed.message, "validation");
      if (!(await slugExists(slug))) fail("That sauce was not found.", "validation");
      const { data, error } = await client.from("comments").insert({
        sauce_slug: slug,
        author_id: session.id,
        author_name: session.displayName,
        body: parsed.value
      }).select("*").single();
      if (error) fail(error.message, "validation");
      return {
        id: data.id,
        slug: data.sauce_slug,
        authorId: data.author_id,
        authorName: data.author_name,
        body: data.body,
        hidden: data.hidden,
        createdAt: data.created_at
      };
    },
    async deleteComment(id) {
      await requireUser();
      const { error } = await client.from("comments").delete().eq("id", id);
      if (error) fail(error.message, "auth");
    },
    async listTwists(slug) {
      const { data, error } = await client.from("twists").select("*").eq("sauce_slug", slug).order("created_at");
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        slug: row.sauce_slug,
        authorId: row.author_id,
        authorName: row.author_name,
        title: row.title,
        body: row.body,
        hidden: row.hidden,
        createdAt: row.created_at
      }));
    },
    async addTwist(slug, input, meta) {
      assertHuman(meta);
      const session = await requireUser();
      takeLimit("twist");
      const parsed = validateTwist(input);
      if (!parsed.ok) fail(parsed.message, "validation");
      if (!(await slugExists(slug))) fail("That sauce was not found.", "validation");
      const { data, error } = await client.from("twists").insert({
        sauce_slug: slug,
        author_id: session.id,
        author_name: session.displayName,
        title: parsed.value.title,
        body: parsed.value.body
      }).select("*").single();
      if (error) fail(error.message, "validation");
      return {
        id: data.id,
        slug: data.sauce_slug,
        authorId: data.author_id,
        authorName: data.author_name,
        title: data.title,
        body: data.body,
        hidden: data.hidden,
        createdAt: data.created_at
      };
    },
    async deleteTwist(id) {
      await requireUser();
      const { error } = await client.from("twists").delete().eq("id", id);
      if (error) fail(error.message, "auth");
    },
    async report(input, meta) {
      assertHuman(meta);
      const session = await requireUser();
      takeLimit("report");
      const parsed = validateReport(input || {});
      if (!parsed.ok) fail(parsed.message, "validation");
      const targetType = input?.targetType === "comment" || input?.targetType === "twist" ? input.targetType : "sauce";
      const { error } = await client.from("reports").insert({
        reporter_id: session.id,
        reporter_name: session.displayName,
        target_type: targetType,
        target_id: String(input?.targetId || input?.slug || ""),
        sauce_slug: String(input?.slug || ""),
        reason: parsed.value.reason,
        note: parsed.value.note
      });
      if (error) fail(error.message, "validation");
    },
    async listModeration() {
      const session = await requireUser();
      if (!session.isOwner) fail("Only the owner can open the desk.", "auth");
      const [reports, comments, twists, sauces] = await Promise.all([
        client.from("reports").select("*").order("created_at", { ascending: false }).limit(50),
        client.from("comments").select("*").order("created_at", { ascending: false }).limit(40),
        client.from("twists").select("*").order("created_at", { ascending: false }).limit(40),
        client.from("sauces").select("*").order("created_at", { ascending: false }).limit(40)
      ]);
      for (const result of [reports, comments, twists, sauces]) {
        if (result.error) throw result.error;
      }
      return {
        reports: reports.data || [],
        comments: (comments.data || []).map((row) => ({ ...row, slug: row.sauce_slug, authorName: row.author_name, createdAt: row.created_at })),
        twists: (twists.data || []).map((row) => ({ ...row, slug: row.sauce_slug, authorName: row.author_name, createdAt: row.created_at })),
        sauces: (sauces.data || []).map((row) => ({ ...row, authorName: row.author_name, createdAt: row.created_at }))
      };
    },
    async setHidden(slug, hidden) {
      const session = await requireUser();
      if (!session.isOwner) fail("Only the owner can hide a sauce.", "auth");
      const { error } = await client.from("sauce_flags").upsert({
        slug,
        hidden: Boolean(hidden),
        deleted: false,
        updated_at: new Date().toISOString()
      });
      if (error) fail(error.message, "auth");
      await client.from("sauces").update({ hidden: Boolean(hidden) }).eq("slug", slug);
    },
    async setCommentHidden(id, hidden) {
      const session = await requireUser();
      if (!session.isOwner) fail("Only the owner can hide a comment.", "auth");
      const { error } = await client.from("comments").update({ hidden: Boolean(hidden) }).eq("id", id);
      if (error) fail(error.message, "auth");
    },
    async setTwistHidden(id, hidden) {
      const session = await requireUser();
      if (!session.isOwner) fail("Only the owner can hide a twist.", "auth");
      const { error } = await client.from("twists").update({ hidden: Boolean(hidden) }).eq("id", id);
      if (error) fail(error.message, "auth");
    }
  };
}
