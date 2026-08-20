import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">TheGuild</span>
        {user ? (
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        )}
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <Badge variant="secondary">Scaffold v0.1</Badge>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Virtual communities solving real-world problems, at scale.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          TheGuild is an educational ecosystem where schools create departments,
          learners form teams, and teams solve real challenges — guided by
          mentors, at any scale.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Button asChild size="lg">
              <Link href="/dashboard">Open your dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/login">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Explore ecosystems</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <footer className="px-6 py-4 text-center text-sm text-muted-foreground">
        Next.js 16 · Tailwind CSS · shadcn/ui · Supabase
      </footer>
    </main>
  );
}
