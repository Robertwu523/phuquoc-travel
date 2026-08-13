import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Lazily-created browser Supabase client.
 *
 * We don't create it at module load time: during static prerender (e.g. on
 * Netlify's build server) the env vars aren't present, and createBrowserClient
 * throws. Build-time imports touch this module, so we defer creation to the
 * first real (client-side, vars-present) call. If the vars are genuinely
 * missing at runtime the getter throws there instead.
 */
let _client: SupabaseClient | null = null;

function create() {
  if (!url || !key) {
    throw new Error(
      "Supabase URL/key missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createBrowserClient(url, key);
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    _client ??= create();
    return Reflect.get(_client, prop);
  },
}) as SupabaseClient;
