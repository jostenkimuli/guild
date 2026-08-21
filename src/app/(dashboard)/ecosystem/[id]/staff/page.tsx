import { notFound, redirect } from "next/navigation";

import { CreateSpaceAdminDialog } from "@/components/console/create-space-admin-dialog";
import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export default async function EcosystemStaffPage({
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

  const { data: staffRows } = await supabase
    .from("ecosystem_staff")
    .select("user_id, profiles(id, username, display_name, status)")
    .eq("ecosystem_id", ecosystem.id)
    .eq("role", "space_admin")
    .order("assigned_at", { ascending: false });

  const spaceAdmins =
    staffRows?.map((row) => row.profiles).filter((p) => p !== null) ?? [];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Staff</h2>
      <ConsolePanel
        title="Space admins"
        description="Everyone who runs spaces in this ecosystem."
        footer={
          <CreateSpaceAdminDialog ecosystemId={ecosystem.id} />
        }
      >
        {spaceAdmins.length > 0 ? (
          <ul className="space-y-2">
            {spaceAdmins.map((admin) => (
              <li
                key={admin.id}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <p className="text-sm font-medium">
                  {admin.display_name || admin.username}
                  <Badge variant="secondary" className="ml-2">
                    space admin
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">{admin.username}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>
            No space admins yet. Create one to get started.
          </EmptyState>
        )}
      </ConsolePanel>
    </section>
  );
}
