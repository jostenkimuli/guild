import { notFound, redirect } from "next/navigation";

import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export default async function EcosystemMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
  if (!profile || profile.role !== "ecosystem_admin") redirect("/");
  if (profile.status !== "approved") redirect("/");

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!ecosystem) notFound();

  const { data: memberRows } = await supabase
    .from("space_memberships")
    .select("user_id, spaces!inner(ecosystem_id), profiles(id, username, display_name, status)")
    .eq("spaces.ecosystem_id", ecosystem.id)
    .order("joined_at", { ascending: false });

  const members =
    memberRows
      ?.map((row) => ({
        ...row.profiles,
        spaceName: (row.spaces as { name?: string } | null)?.name,
      }))
      .filter((p) => p !== null) ?? [];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Members</h2>
      <ConsolePanel
        title="Space members"
        description="Everyone enrolled in spaces within this ecosystem."
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
                    member
                  </Badge>
                </p>
                <div className="flex items-center gap-2">
                  {member.spaceName ? (
                    <Badge variant="outline">{member.spaceName}</Badge>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {member.username}
                  </p>
                </div>
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
