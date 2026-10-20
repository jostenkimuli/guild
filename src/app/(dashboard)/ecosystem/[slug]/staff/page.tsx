import { Fragment } from "react";
import { notFound, redirect } from "next/navigation";

import { approveSpaceAdmin } from "@/app/actions/console";
import { CreateSpaceAdminDialog } from "@/components/console/create-space-admin-dialog";
import { CreateSpaceDialog } from "@/components/console/create-space-dialog";
import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { SpaceAdminAssignmentForm } from "@/components/console/space-admin-assignment-form";

export default async function EcosystemStaffPage({
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

  const { data: spaces } = await supabase
    .from("spaces")
    .select("id, name")
    .eq("ecosystem_id", ecosystem.id)
    .order("name");

  const { data: staffRows } = await supabase
    .from("ecosystem_staff")
    .select("user_id, profiles(id, username, display_name, status)")
    .eq("ecosystem_id", ecosystem.id)
    .eq("role", "space_admin")
    .order("assigned_at", { ascending: false });

  const spaceAdmins = staffRows?.map((r) => r.profiles).filter((p) => p !== null) ?? [];
  const pendingCount = spaceAdmins.filter((a) => a.status === "pending").length;
  const adminIds = spaceAdmins.map((admin) => admin.id);
  const { data: adminMemberships } = adminIds.length
    ? await supabase
        .from("space_memberships")
        .select("user_id, space_id")
        .in("user_id", adminIds)
        .eq("role", "admin")
    : { data: [] };
  const assignedByAdmin = new Map<string, string[]>();
  for (const membership of adminMemberships ?? []) {
    const assigned = assignedByAdmin.get(membership.user_id) ?? [];
    assigned.push(membership.space_id);
    assignedByAdmin.set(membership.user_id, assigned);
  }
  const spaceOptions = spaces ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-on-surface">Staff</h2>
        <div className="flex gap-2">
          <CreateSpaceDialog ecosystemId={ecosystem.id} />
          {spaceOptions.length > 0 ? (
            <CreateSpaceAdminDialog ecosystemId={ecosystem.id} spaces={spaceOptions} />
          ) : null}
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-sm font-medium text-on-surface">
            {pendingCount} space admin{pendingCount !== 1 ? "s" : ""} awaiting approval
          </p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Approve them so they can sign in and manage their spaces.
          </p>
        </div>
      )}

      <ConsolePanel
        title={`Space admins (${spaceAdmins.length})`}
        description="Space admins can access the spaces assigned to them, create teacher and learner invitations, and manage their space members."
      >
        {spaceAdmins.length > 0 ? (
          <ul className="divide-y divide-outline-variant">
            {spaceAdmins.map((admin) => (
              <Fragment key={admin.id}>
                <li className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      {admin.display_name || admin.username}
                    </p>
                    <p className="text-xs text-on-surface-variant">{admin.username}</p>
                    {admin.status === "approved" ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {spaceOptions.filter((space) => assignedByAdmin.get(admin.id)?.includes(space.id)).map((space) => space.name).join(", ") || "No spaces assigned"}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.status === "pending" ? (
                      <form action={approveSpaceAdmin}>
                        <input type="hidden" name="user_id" value={admin.id} />
                        <Button type="submit" size="sm">Approve</Button>
                      </form>
                    ) : (
                      <Badge variant="secondary">approved</Badge>
                    )}
                  </div>
                </li>
              {admin.status === "approved" ? (
                <li key={`${admin.id}-assignments`} className="pb-3">
                  <SpaceAdminAssignmentForm
                    ecosystemId={ecosystem.id}
                    userId={admin.id}
                    spaces={spaceOptions}
                    assignedSpaceIds={assignedByAdmin.get(admin.id) ?? []}
                  />
                </li>
              ) : null}
              </Fragment>
            ))}
          </ul>
        ) : (
          <EmptyState>
            No space admins yet. Add one to let them manage spaces and invite members.
          </EmptyState>
        )}
      </ConsolePanel>
    </section>
  );
}
