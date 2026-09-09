import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ecosystemTypeLabel } from "@/lib/ecosystems";

export default async function EcosystemLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("id, name, type, vision, mission, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!ecosystem) notFound();

  const { data: spaces } = await supabase
    .from("spaces")
    .select("name")
    .eq("ecosystem_id", ecosystem.id)
    .order("name");

  const ecosystemSpaces =
    spaces && spaces.length > 0 ? spaces : null;

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">
          {ecosystem.name}
        </span>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-8 px-6 py-16">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {ecosystem.name}
          </h1>
          <Badge variant="secondary">{ecosystemTypeLabel(ecosystem.type)}</Badge>
        </div>

        {ecosystem.vision ? (
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            {ecosystem.vision}
          </p>
        ) : null}

        {ecosystem.mission ? (
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Our mission
            </h2>
            <p className="mt-1 max-w-xl text-base leading-7">
              {ecosystem.mission}
            </p>
          </div>
        ) : null}

        {ecosystem.description ? (
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              About
            </h2>
            <p className="mt-1 max-w-xl text-base leading-7">
              {ecosystem.description}
            </p>
          </div>
        ) : null}

        {ecosystemSpaces ? (
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Spaces
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {ecosystemSpaces.map((space) => (
                <li
                  key={space.name}
                  className="rounded-full border bg-muted/40 px-3 py-1 text-sm font-medium"
                >
                  {space.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <footer className="px-6 py-4 text-center text-sm text-muted-foreground">
        {ecosystem.name} · powered by TheGuild
      </footer>
    </main>
  );
}
