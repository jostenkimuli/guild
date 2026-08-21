import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
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
      redirect("/admin");
    }
    if (role === "ecosystem_admin" && status === "approved") {
      redirect("/ecosystem");
    }
    if (role === "space_admin" && status === "approved") {
      const { data: membership } = await supabase
        .from("space_memberships")
        .select("spaces!inner(slug)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (membership?.spaces?.slug) {
        redirect(`/spaces/${membership.spaces.slug}`);
      }
    }
    if (role === "member" && status === "approved") {
      const { data: membership } = await supabase
        .from("space_memberships")
        .select("spaces!inner(slug)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (membership?.spaces?.slug) {
        redirect(`/spaces/${membership.spaces.slug}`);
      }
    }
  }

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">TheGuild</span>
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Virtual communities solving real-world problems, at scale.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          TheGuild is an educational ecosystem where schools create departments,
          learners form teams, and teams solve real challenges — guided by
          mentors, at any scale.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Explore ecosystems</Link>
          </Button>
        </div>
      </section>

      <footer className="px-6 py-4 text-center text-sm text-muted-foreground">
        TheGuild
      </footer>
    </main>
  );
}
