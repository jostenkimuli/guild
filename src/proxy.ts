import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { cookieDomain, ecosystemSlugFromHost } from "@/lib/subdomain";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { domain: cookieDomain() },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl;

  // Ecosystem subdomains: host the ecosystem's console on its subdomain so
  // `school.localhost/` (and /staff, /members, /students, /spaces) resolve to
  // the slug-keyed `/ecosystem/school/...` routes. The host <-> pathname
  // mapping is one-to-one, so no database lookup is needed here. Other paths
  // (e.g. /login, /s/...) still resolve normally under the subdomain, scoping
  // sign-in to that ecosystem via its own host cookies.
  const ecosystemSlug = ecosystemSlugFromHost(request.headers.get("host"));
  if (ecosystemSlug) {
    const consoleSegment = ["/staff", "/members", "/students"].some(
      (segment) =>
        url.pathname === segment || url.pathname.startsWith(`${segment}/`),
    );
    if (url.pathname === "/" || url.pathname === "/spaces" || consoleSegment) {
      const scopedPath = url.pathname === "/" ? "" : url.pathname;
      return NextResponse.rewrite(
        new URL(`/ecosystem/${ecosystemSlug}${scopedPath}`, request.url),
      );
    }
  }

  if (
    !user &&
    (url.pathname.startsWith("/admin") ||
      url.pathname.startsWith("/ecosystem") ||
      url.pathname.startsWith("/spaces") ||
      url.pathname === "/setup-password")
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && ["/login", "/signup"].includes(url.pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role;
    const status = profile?.status;
    if (
      (role === "super_admin" || role === "program_admin") &&
      status === "approved"
    ) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role === "ecosystem_admin" && status === "approved") {
      // On an ecosystem subdomain, `/login` should land directly on the
      // school dashboard (the host root rewrites to `/ecosystem/[slug]`).
      // On the main host it goes to the ecosystem root page.
      if (ecosystemSlug) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.redirect(new URL("/ecosystem", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
