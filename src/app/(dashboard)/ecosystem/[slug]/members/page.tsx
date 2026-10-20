import { notFound, redirect } from "next/navigation";

import { ConsolePanel } from "@/components/console/panels";
import { createClient } from "@/lib/supabase/server";
import { SpaceMembershipManager } from "@/components/console/space-membership-manager";

export default async function EcosystemMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "ecosystem_admin" || profile.status !== "approved") redirect("/");

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!ecosystem) notFound();

  const { data: spaceRows } = await supabase
    .from("spaces")
    .select("id, name")
    .eq("ecosystem_id", ecosystem.id)
    .order("name");

  const { data: memberRows } = await supabase
    .from("space_memberships")
    .select("user_id, role, space_id, spaces!inner(id, name, ecosystem_id), profiles(id, username, display_name, role, status)")
    .eq("spaces.ecosystem_id", ecosystem.id)
    .order("joined_at", { ascending: false });

  const memberships = (memberRows ?? [])
    .filter((r) => r.profiles !== null)
    .map((r) => ({
      id: r.user_id,
      name: r.profiles?.display_name || r.profiles?.username || "—",
      username: r.profiles?.username ?? "—",
      role: r.role,
      profileRole: r.profiles?.role,
      profileStatus: r.profiles?.status,
      spaceId: r.space_id,
      spaceName: (r.spaces as { name?: string } | null)?.name ?? null,
    }));
  const users = [...new Map(
    memberships
      .filter((member) => member.profileRole === "member" && member.profileStatus === "approved")
      .map((member) => [member.id, { id: member.id, name: member.name, username: member.username }]),
  ).values()];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-on-surface">Members</h2>
        <span className="text-sm text-on-surface-variant">{memberships.length} memberships</span>
      </div>

      <ConsolePanel
        title="Space members"
        description="Assign existing members to spaces, change their role, move them, or remove them from a space. Space-admin assignments are managed under Staff."
      >
        <SpaceMembershipManager
          spaces={spaceRows ?? []}
          users={users}
          memberships={memberships.map((member) => ({
            id: member.id,
            name: member.name,
            username: member.username,
            spaceId: member.spaceId,
            spaceName: member.spaceName ?? "Space",
            role: member.role,
          }))}
        />
      </ConsolePanel>
    </section>
  );
}
