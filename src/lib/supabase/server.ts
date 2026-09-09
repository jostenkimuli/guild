import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { cookieDomain } from "@/lib/subdomain";
import type { Database } from "./database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { domain: cookieDomain() },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The cookie store is immutable when called from a Server
            // Component. The proxy refreshes the session for those cases.
          }
        },
      },
    },
  );
}
