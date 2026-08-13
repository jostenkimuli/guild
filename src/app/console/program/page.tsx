import { redirect } from "next/navigation";
import Link from "next/link";

import { approveEcosystemAdmin } from "@/app/actions/console";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateEcosystemAdminForm } from "@/components/console/forms";
import { createClient } from "@/lib/supabase/server";

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
    .select("role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "program_admin") redirect("/dashboard");

  const { data: ecosystemAdmins } = await supabase
    .from("profiles")
    .select("id, username, display_name, status, created_at")
    .eq("role", "ecosystem_admin")
    .order("created_at", { ascending: false });

  const pending = (ecosystemAdmins ?? []).filter((a) => a.status === "pending");
  const approved = (ecosystemAdmins ?? []).filter((a) => a.status === "approved");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Program admin console
          </h1>
          <p className="text-sm text-muted-foreground">
            Create ecosystem-admin accounts and approve them.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </header>

      {params.approved ? (
        <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
          Account approved. They can now create an ecosystem.
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-4 text-sm text-destructive">{params.error}</p>
      ) : null}

      <section className="mt-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create an ecosystem admin</CardTitle>
            <CardDescription>
              The account starts as <Badge variant="outline">pending</Badge> and
              ecosystem creation stays disabled until you approve it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateEcosystemAdminForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending approvals</CardTitle>
            <CardDescription>
              Approve an ecosystem admin to unlock ecosystem creation for them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.length > 0 ? (
              pending.map((admin) => (
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

        {approved.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Approved ecosystem admins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
