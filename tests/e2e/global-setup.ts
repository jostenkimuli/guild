/**
 * Fails fast when the local Supabase stack is not running or has not been
 * seeded. Without this, a missing backend surfaces as a confusing timeout on
 * the first sign-in instead of an actionable message.
 */
export default async function globalSetup() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:55421"
  ).replace(/\/$/, "");
  const healthUrl = `${url}/auth/v1/health`;

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok) return;
    } catch {
      // keep retrying
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `Supabase is not reachable at ${url}.\n` +
      "Start it with `supabase.cmd start` and reseed with `npm.cmd run db:reset`, " +
      "then rerun `npm.cmd run test:e2e`.",
  );
}
