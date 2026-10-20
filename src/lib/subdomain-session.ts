import { createClient } from "@/lib/supabase/client";
import { APP_HOST } from "@/lib/subdomain";

function handoffHash(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number | undefined;
} | null): string {
  if (!session) return "";
  const params = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (session.expires_at) params.set("expires_at", String(session.expires_at));
  return params.toString();
}

/**
 * Navigates the browser to an ecosystem subdomain while carrying the current
 * session over, so the user is not asked to log in again.
 *
 * `localhost` is a public suffix in modern browsers, so a shared `Domain`
 * cookie cannot follow the user from `localhost` to `[slug].localhost`. We
 * land on `[slug]/login#access_token=…&refresh_token=…` instead; the login
 * page detects the tokens, restores the session on that origin via
 * `setSession`, and redirects to `/` (which rewrites to the school dashboard).
 */
export async function navigateToEcosystemSubdomain(
  subdomainUrl: string,
): Promise<void> {
  const base = subdomainUrl.replace(/\/?$/, "/");
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const hash = handoffHash(session);
  const target = hash ? `${base}login#${hash}` : base;
  window.location.assign(target);
}

/**
 * Moves a session from an ecosystem subdomain back to the main app host.
 * This is needed on localhost, where auth cookies are host-only and cannot
 * cross from `school.localhost` to `localhost`.
 */
export async function navigateToAppHost(): Promise<void> {
  const appUrl = new URL(window.location.origin);
  appUrl.hostname = APP_HOST;
  appUrl.pathname = "/login";
  appUrl.search = "";

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  appUrl.hash = handoffHash(session);
  window.location.assign(appUrl.toString());
}
