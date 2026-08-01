import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// These are publishable browser values, not private credentials. Keeping them
// here makes auth work in both the live sandbox and the separately built
// id-preview deployment, where VITE_* injection can lag behind Cloud binding.
const CLOUD_URL = "https://cplxcmvyhngcypyvloss.supabase.co";
const CLOUD_PUBLISHABLE_KEY = "sb_publishable_E3fzb9OlssDjTxtSJZLCig_wPee3J6O";

function cloudFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(
    typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
  );

  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }

  if (headers.get("Authorization") === `Bearer ${CLOUD_PUBLISHABLE_KEY}`) {
    headers.delete("Authorization");
  }
  headers.set("apikey", CLOUD_PUBLISHABLE_KEY);

  return fetch(input, { ...init, headers });
}

export const cloudClient = createClient<Database>(CLOUD_URL, CLOUD_PUBLISHABLE_KEY, {
  global: { fetch: cloudFetch },
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});