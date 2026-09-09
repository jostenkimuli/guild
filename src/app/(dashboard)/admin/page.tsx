import { redirect } from "next/navigation";

import { approveProgramAdmin, approveEcosystemAdmin } from "@/app/actions/console";
import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { CreateProgramAdminDialog } from "@/components/console/create-program-admin-dialog";
import { CreateEcosystemAdminBySuperAdminDialog } from "@/components/console/create-ecosystem-admin-super-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ecosystemTypeLabel } from "@/lib/ecosystems";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    approved?: string;
    delegated?: string;
  }>;
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
  if (!profile) redirect("/");

  const isSuperAdmin =
    profile.role === "super_admin" && profile.status === "approved";
  const isProgramAdmin =
    profile.role === "program_admin" && profile.status === "approved";

  if (!isSuperAdmin && !isProgramAdmin) redirect("/");

  // Super admin sees pending program admins
  let pendingPrograms: {
    id: string;
    username: string;
    display_name: string | null;
    status: string;
    created_at: string;
  }[] = [];
  let approvedPrograms: typeof pendingPrograms = [];
  if (isSuperAdmin) {
    const { data: programAdmins } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name, status, can_approve_ecosystem_admins, created_at",
      )
      .eq("role", "program_admin")
      .order("created_at", { ascending: false });
    pendingPrograms = (programAdmins ?? []).filter(
      (a) => a.status === "pending",
    );
    approvedPrograms = (programAdmins ?? []).filter(
      (a) => a.status === "approved",
    );
  }

  // All admins see pending ecosystem admins
  const { data: ecosystemAdmins } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, status, ecosystem_type, created_at",
    )
    .eq("role", "ecosystem_admin")
    .order("created_at", { ascending: false });

  const pendingEcosystems = (ecosystemAdmins ?? []).filter(
    (a) => a.status === "pending",
  );
  const approvedEcosystems = (ecosystemAdmins ?? []).filter(
    (a) => a.status === "approved",
  );

  const delegated = profile.can_approve_ecosystem_admins;

  return (
    <section className="mt-4 space-y-4">
      {params.approved ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Account approved.
        </p>
      ) : null}
      {params.delegated === "1" ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Ecosystem-admin approval delegated.
        </p>
      ) : null}
      {params.delegated === "0" ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Delegation revoked — ecosystem-admin approvals are back with you.
        </p>
      ) : null}
      {params.error ? (
        <p className="text-sm text-destructive">{params.error}</p>
      ) : null}

      {/* Program admins — super admin only */}
      {isSuperAdmin ? (
        <>
          <ConsolePanel
            title="Pending program admins"
            description="Approve a program admin to let them create ecosystem-admin accounts."
          >
            {pendingPrograms.length > 0 ? (
              <div className="space-y-2">
                {pendingPrograms.map((admin) => (
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
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {admin.username}
                      </p>
                    </div>
                    <form action={approveProgramAdmin}>
                      <input type="hidden" name="user_id" value={admin.id} />
                      <Button type="submit" size="sm">
                        Approve
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending program admins.
              </p>
            )}
          </ConsolePanel>

          <ConsolePanel
            title="Program admins"
            description="Delegate ecosystem-admin approvals to a program admin, or keep them with the super admin."
            footer={<CreateProgramAdminDialog />}
          >
            {approvedPrograms.length > 0 ? (
              <div className="space-y-2">
                {approvedPrograms.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {admin.display_name || admin.username}
                        <Badge variant="secondary" className="ml-2">
                          approved
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {admin.username}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>
                No approved program admins yet. Create one to get started.
              </EmptyState>
            )}
          </ConsolePanel>
        </>
      ) : null}

      {/* Ecosystem admins — all admin roles */}
      <ConsolePanel
        title="Pending ecosystem admins"
        description={
          delegated || isSuperAdmin
            ? "Approve an ecosystem admin to let them create their ecosystem."
            : "Awaiting admin approval."
        }
      >
        {pendingEcosystems.length > 0 ? (
          <div className="space-y-2">
            {pendingEcosystems.map((admin) => (
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
                {(delegated || isSuperAdmin) ? (
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
        footer={
          isSuperAdmin ? <CreateEcosystemAdminBySuperAdminDialog /> : undefined
        }
      >
        {approvedEcosystems.length > 0 ? (
          <div className="space-y-2">
            {approvedEcosystems.map((admin) => (
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
            No approved ecosystem admins yet.
          </EmptyState>
        )}
      </ConsolePanel>
    </section>
  );
}
