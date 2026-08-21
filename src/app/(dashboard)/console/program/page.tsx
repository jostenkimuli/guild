import { redirect } from "next/navigation";

import { approveEcosystemAdmin } from "@/app/actions/console";
import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { CreateEcosystemAdminDialog } from "@/components/console/create-ecosystem-admin-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ecosystemTypeLabel } from "@/lib/ecosystems";

export default async function ProgramConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; approved?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, can_approve_ecosystem_admins")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "program_admin" || profile.status !== "approved") {
    redirect("/dashboard");
  }

  const delegated = profile.can_approve_ecosystem_admins;

  const { data: ecosystemAdmins } = await supabase
    .from("profiles")
    .select("id, username, display_name, status, ecosystem_type, created_at")
    .eq("role", "ecosystem_admin")
    .order("created_at", { ascending: false });

  const pending = (ecosystemAdmins ?? []).filter((a) => a.status === "pending");
  const approved = (ecosystemAdmins ?? []).filter((a) => a.status === "approved");

  return (
    <>
      {params.approved ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Account approved. They can now create an ecosystem.
        </p>
      ) : null}
      {params.error ? (
        <p className="text-sm text-destructive">{params.error}</p>
      ) : null}

      <section className="mt-4 space-y-4">
        <ConsolePanel
        title="Pending ecosystem admins"
        description={
          delegated
            ? "The super admin delegated these approvals to you."
            : "Awaiting super admin approval. Ask the super admin to delegate approvals to you if you should approve these."
        }
      >
          {pending.length > 0 ? (
            <div className="space-y-2">
              {pending.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {admin.display_name || admin.username}
                      <Badge variant="outline" className="ml-2">
                        {admin.status}
                      </Badge>
                      {admin.ecosystem_type ? (
                        <Badge variant="secondary" className="ml-2">
                          {ecosystemTypeLabel(admin.ecosystem_type)}
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {admin.username}
                    </p>
                  </div>
                  {delegated ? (
                    <form action={approveEcosystemAdmin}>
                      <input type="hidden" name="user_id" value={admin.id} />
                      <Button type="submit" size="sm">
                        Approve
                      </Button>
                    </form>
                  ) : (
                    <Badge variant="outline">with super admin</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No pending ecosystem admins.
            </p>
          )}
        </ConsolePanel>

        <ConsolePanel
          title="Approved ecosystem admins"
          footer={<CreateEcosystemAdminDialog />}
        >
          {approved.length > 0 ? (
            <div className="space-y-2">
              {approved.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <p className="text-sm font-medium">
                    {admin.display_name || admin.username}
                    <Badge variant="secondary" className="ml-2">
                      approved
                    </Badge>
                    {admin.ecosystem_type ? (
                      <Badge variant="outline" className="ml-2">
                        {ecosystemTypeLabel(admin.ecosystem_type)}
                      </Badge>
                    ) : null}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>
              No approved ecosystem admins yet. Create one to get started.
            </EmptyState>
          )}
        </ConsolePanel>
      </section>
    </>
  );
}
