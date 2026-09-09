/**
 * The host that the main (non-subdomain) app is served on, e.g.
 * `localhost` in development or `theguild.com` in production.
 * Configurable so deployments don't hard-code the domain.
 */
export const APP_HOST: string =
  process.env.NEXT_PUBLIC_APP_HOST?.trim().toLowerCase() || "localhost";

/**
 * Given an incoming host value, return the ecosystem slug if the host is a
 * subdomain of `APP_HOST` (e.g. `my-school.localhost` -> `my-school`),
 * otherwise `null` for the main domain / unknown hosts.
 *
 * Accepts the raw `Host` header value (which may include a port, e.g.
 * `my-school.localhost:3000`). We derive from the `Host` header rather than
 * `NextRequest.nextUrl.hostname` because the dev server normalizes `nextUrl`
 * to the bound host, which breaks subdomain detection locally.
 */
export function ecosystemSlugFromHost(
  hostInput: string | null | undefined,
): string | null {
  if (!hostInput) return null;
  const host = hostInput.toLowerCase().replace(/:\d+$/, "");
  if (host === APP_HOST) return null;

  const suffix = `.${APP_HOST}`;
  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length);
    return validSlug(slug) ? slug : null;
  }

  return null;
}

function validSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,62}$/.test(slug);
}

/**
 * Computes the cookie `Domain` value needed so a session cookie set on the
 * main host is also sent to ecosystem subdomains.
 *
 * For real registration domains (e.g. `theguild.com`) we share auth cookies
 * across all subdomains by setting `Domain` to the leading-dot registrable
 * domain, so sessions follow the user between hosts without a handoff.
 *
 * `localhost` gets NO `Domain` attribute: Chromium treats it as a public
 * suffix, and a `Domain=localhost` cookie is rejected / not sent to
 * `*.localhost` subdomains. Each origin instead writes its own host-only
 * cookie, and the session is carried across the host boundary by the hash
 * handoff in `navigateToEcosystemSubdomain` (`[slug]/login#access_token=…`).
 * IP addresses also get host-only cookies (no subdomains to share across).
 */
export function cookieDomain(): string | undefined {
  const host = APP_HOST;
  if (host === "localhost") return undefined;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return undefined;
  return `.${host}`;
}
