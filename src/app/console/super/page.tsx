import { redirect } from "next/navigation";
import Link from "next/link";

import {
  approveEcosystemAdmin,
  approveProgramAdmin,
  setProgramAdminDelegation,
} from "@/app/actions/console";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateProgramAdminForm } from "@/components/console/forms";
import { createClient } from "@/lib/supabase/server";

export default async function SuperConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; approved?: string; delegated?: string }>;
}) {
  const params = await searchParams;

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
  if (!profile || profile.role !== "super_admin" || profile.status !== "approved") {
    redirect("/dashboard");
  }

  const { data: programAdmins } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, status, can_approve_ecosystem_admins, created_at",
    )
    .eq("role", "program_admin")
    .order("created_at", { ascending: false });

  const { data: ecosystemAdmins } = await supabase
    .from("profiles")
    .select("id, username, display_name, status, created_at")
    .eq("role", "ecosystem_admin")
    .order("created_at", { ascending: false });

  const pendingPrograms = (programAdmins ?? []).filter(
    (a) => a.status === "pending",
  );
  const approvedPrograms = (programAdmins ?? []).filter(
    (a) => a.status === "approved",
  );
  const pendingEcosystemAdmins = (ecosystemAdmins ?? []).filter(
    (a) => a.status === "pending",
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Super admin console
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and approve program admins, and decide who approves
            ecosystem-admin accounts.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </header>

      {params.approved ? (
        <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
          Account approved.
        </p>
      ) : null}
      {params.delegated === "1" ? (
        <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
          Ecosystem-admin approval delegated to that program admin.
        </p>
      ) : null}
      {params.delegated === "0" ? (
        <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
          Delegation revoked — ecosystem-admin approvals are back with you.
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-4 text-sm text-destructive">{params.error}</p>
      ) : null}

      <section className="mt-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create a program admin</CardTitle>
            <CardDescription>
              The account starts as <Badge variant="outline">pending</Badge>{" "}
              and cannot create ecosystem admins until you approve it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateProgramAdminForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending program admins</CardTitle>
            <CardDescription>
              Approve a program admin to let them create ecosystem-admin
              accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingPrograms.length > 0 ? (
              pendingPrograms.map((admin) => (
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
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending program admins.
              </p>
            )}
          </CardContent>
        </Card>

        {approvedPrograms.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Program admins</CardTitle>
              <CardDescription>
                Delegate ecosystem-admin approvals to a program admin, or keep
                them with the super admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
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
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Pending ecosystem admins
            </CardTitle>
            <CardDescription>
              Ecosystem-admin approvals start here. You can approve them
              directly, or delegate to a program admin above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingEcosystemAdmins.length > 0 ? (
              pendingEcosystemAdmins.map((admin) => (
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
                  <form action={approveEcosystemAdmin}>
                    <input type="hidden" name="user_id" value={admin.id} />
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending ecosystem admins.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
