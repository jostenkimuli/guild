import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Server-only client using the service role key — bypasses RLS. Used
 * exclusively by dev playground pages that read reference-standard tables
 * (`curriculum_nodes`) the `anon` role has no grants on. Never import this
 * module from client components; the key lives in server env only.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}