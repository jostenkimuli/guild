import {
  approveProgramAdmin,
  setProgramAdminDelegation,
} from "@/app/actions/console";
import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { CreateProgramAdminDialog } from "@/components/console/create-program-admin-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function SuperConsolePage({
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
  if (!user) return null;

  const { data: programAdmins } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, status, can_approve_ecosystem_admins, created_at",
    )
    .eq("role", "program_admin")
    .order("created_at", { ascending: false });

  const pendingPrograms = (programAdmins ?? []).filter(
    (a) => a.status === "pending",
  );
  const approvedPrograms = (programAdmins ?? []).filter(
    (a) => a.status === "approved",
  );

  return (
    <section className="mt-4 space-y-4">
      {params.approved ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Account approved.
        </p>
      ) : null}
      {params.delegated === "1" ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Ecosystem-admin approval delegated to that program admin.
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
            {approvedPrograms.map((admin) => {
              const delegated = admin.can_approve_ecosystem_admins;
              return (
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
                      {delegated ? (
                        <Badge variant="outline" className="ml-2">
                          approves ecosystem admins
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {admin.username}
                    </p>
                  </div>
                  <form action={setProgramAdminDelegation}>
                    <input type="hidden" name="user_id" value={admin.id} />
                    <input
                      type="hidden"
                      name="delegated"
                      value={delegated ? "false" : "true"}
                    />
                    <Button type="submit" size="sm" variant="outline">
                      {delegated ? "Revoke delegation" : "Delegate approvals"}
                    </Button>
                  </form>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState>
            No approved program admins yet. Create one to get started.
          </EmptyState>
        )}
      </ConsolePanel>
    </section>
  );
}
