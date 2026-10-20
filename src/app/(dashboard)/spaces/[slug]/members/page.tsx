import { notFound, redirect } from "next/navigation";

import { ConsolePanel } from "@/components/console/panels";
import { SpaceMembershipManager } from "@/components/console/space-membership-manager";
import { InviteLearnersButton } from "@/app/(dashboard)/ecosystem/[slug]/students/invite-button";
import { createClient } from "@/lib/supabase/server";

export default async function SpaceMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: space } = await supabase
    .from("spaces")
    .select("id, name, ecosystem_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!space) notFound();

  const [{ data: profile }, { data: membership }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("role, status").eq("id", user.id).maybeSingle(),
    supabase
      .from("space_memberships")
      .select("role")
      .eq("space_id", space.id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("ecosystem_staff")
      .select("role")
      .eq("ecosystem_id", space.ecosystem_id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const isSpaceAdmin = membership?.role === "admin";
  const isEcosystemAdmin = profile?.role === "ecosystem_admin"
    && profile.status === "approved"
    && staff?.role === "ecosystem_admin";
  if (!isSpaceAdmin && !isEcosystemAdmin) redirect(`/spaces/${slug}`);

  const { data: managedSpaceRows } = isEcosystemAdmin
    ? await supabase
        .from("spaces")
        .select("id, name")
        .eq("ecosystem_id", space.ecosystem_id)
        .order("name")
    : await supabase
        .from("space_memberships")
        .select("spaces!inner(id, name)")
        .eq("user_id", user.id)
        .eq("role", "admin");
  const managedSpaces = (managedSpaceRows ?? [])
    .map((row) => "spaces" in row ? row.spaces : row)
    .filter((row): row is { id: string; name: string } => row !== null);
  const managedSpaceIds = managedSpaces.map((managedSpace) => managedSpace.id);

  const { data: memberRows } = await supabase
    .from("space_memberships")
    .select("user_id, space_id, role, spaces(name), profiles(id, username, display_name, role, status)")
    .in("space_id", managedSpaceIds)
    .order("joined_at", { ascending: false });

  const memberships = (memberRows ?? [])
    .filter((row) => row.profiles !== null)
    .map((row) => ({
      id: row.user_id,
      name: row.profiles?.display_name || row.profiles?.username || "—",
      username: row.profiles?.username ?? "—",
      profileRole: row.profiles?.role,
      profileStatus: row.profiles?.status,
      spaceId: row.space_id,
      spaceName: row.spaces?.name ?? space.name,
      role: row.role,
    }));
  const users = [...new Map(
    memberships
      .filter((member) => member.profileRole === "member" && member.profileStatus === "approved")
      .map((member) => [member.id, { id: member.id, name: member.name, username: member.username }]),
  ).values()];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{space.name} Members</h2>
      <ConsolePanel
        title="Space members"
        description="Assign existing ecosystem members, change their role, or remove them from this space. New people can join with an invitation code."
        footer={<InviteLearnersButton spaces={[{ id: space.id, name: space.name, grades: [] }]} />}
      >
        <SpaceMembershipManager
          spaces={managedSpaces}
          users={users}
          memberships={memberships.map(({ id, name, username, spaceId, spaceName, role }) => ({
            id, name, username, spaceId, spaceName, role,
          }))}
        />
      </ConsolePanel>
    </section>
  );
}
