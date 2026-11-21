// DMF Records website -> DMF app backend (Supabase project "dmf-music platform").
// The publishable key is the public browser key (same one the DMF app at /app/ ships).
// Row-level security in the database decides what it can do: insert promo requests, call the public
// site_roster()/site_releases() read functions. Never put a secret/service key in this site.
export const SUPABASE_URL = "https://akqonumkjrfxhncidygl.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tlxjQHv4ho9KqCWgc1k6yA_eScKf8Dt";
export const APP_URL = "/app/";
export const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm";

let client = null;
/** Lazily load supabase-js from the CDN and create one shared client (no session: the site never signs in). */
export async function supabase() {
  if (client) return client;
  const { createClient } = await import(SUPABASE_JS);
  client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
