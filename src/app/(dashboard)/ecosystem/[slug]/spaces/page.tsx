import { notFound, redirect } from "next/navigation";

import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { SpaceCard } from "@/components/console/spaces";
import { CreateSpaceButton } from "@/components/console/create-space-button";
import { createClient } from "@/lib/supabase/server";
import {
  SPACE_TYPE_ORDER,
  spaceTypePlural,
  type SpaceType,
} from "@/lib/ecosystems";

export default async function EcosystemSpacesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("id, type")
    .eq("slug", slug)
    .maybeSingle();
  if (!ecosystem) notFound();

  const { data: spaces } = await supabase
    .from("spaces")
    .select("id, name, type, description, slug")
    .eq("ecosystem_id", ecosystem.id)
    .order("created_at", { ascending: false });

  const spacesByType = new Map<SpaceType, typeof spaces>();
  for (const space of spaces ?? []) {
    const type = space.type as SpaceType;
    const list = spacesByType.get(type) ?? [];
    list.push(space);
    spacesByType.set(type, list);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Spaces</h2>
        <CreateSpaceButton ecosystemId={ecosystem.id} />
      </div>

      {SPACE_TYPE_ORDER.map((type) => {
        const items = spacesByType.get(type);
        if (!items || items.length === 0) return null;
        return (
          <div key={type} className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {spaceTypePlural(type)}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          </div>
        );
      })}

      {(!spaces || spaces.length === 0) ? (
        <ConsolePanel title="No spaces yet">
          <EmptyState>
            Create your first space to get started.
          </EmptyState>
        </ConsolePanel>
      ) : null}
    </section>
  );
}
