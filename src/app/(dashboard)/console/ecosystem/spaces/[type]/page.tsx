import { notFound, redirect } from "next/navigation";

import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { SpaceCard } from "@/components/console/spaces";
import { CreateSpaceButton } from "@/components/console/create-space-button";
import { createClient } from "@/lib/supabase/server";
import {
  SPACE_TYPE_ORDER,
  spaceTypeLabel,
  spaceTypePlural,
  type SpaceType,
} from "@/lib/ecosystems";

export default async function EcosystemSpacesPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!(SPACE_TYPE_ORDER as readonly string[]).includes(type)) notFound();
  const spaceType = type as SpaceType;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("id")
    .eq("created_by", user.id)
    .single();
  if (!ecosystem) redirect("/console/ecosystem");

  const { data: spaces } = await supabase
    .from("spaces")
    .select("id, name, type, description, slug")
    .eq("ecosystem_id", ecosystem.id)
    .eq("type", spaceType)
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {spaceTypePlural(spaceType)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {spaceTypeLabel(spaceType)} spaces in this ecosystem.
          </p>
        </div>
        <CreateSpaceButton ecosystemId={ecosystem.id} defaultType={spaceType} />
      </div>

      {spaces && spaces.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      ) : (
        <ConsolePanel title={`No ${spaceTypeLabel(spaceType).toLowerCase()} spaces yet`}>
          <EmptyState>
            Create your first {spaceTypeLabel(spaceType).toLowerCase()} space
            to get started.
          </EmptyState>
        </ConsolePanel>
      )}
    </section>
  );
}
