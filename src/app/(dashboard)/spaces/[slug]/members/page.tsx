import { notFound, redirect } from "next/navigation";

import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export default async function SpaceMembersPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "space_admin") redirect("/");
  if (profile.status !== "approved") redirect("/");

  const { data: space } = await supabase
    .from("spaces")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!space) notFound();

  const { data: memberRows } = await supabase
    .from("space_memberships")
    .select("user_id, role, joined_at, profiles(id, username, display_name, status)")
    .eq("space_id", space.id)
    .order("joined_at", { ascending: false });

  const members = memberRows?.map((row) => ({
    ...row.profiles,
    membershipRole: row.role,
  })).filter((p) => p !== null) ?? [];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{space.name} Members</h2>
      <ConsolePanel
        title="Space members"
        description="Everyone enrolled in this space."
      >
        {members.length > 0 ? (
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <p className="text-sm font-medium">
                  {member.display_name || member.username}
                  <Badge variant="secondary" className="ml-2">
                    {member.membershipRole}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">{member.username}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No members enrolled yet.</EmptyState>
        )}
      </ConsolePanel>
    </section>
  );
}
