import { redirect } from "next/navigation";

import { approveEcosystemAdmin } from "@/app/actions/console";
import { ConsolePanel } from "@/components/console/panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ecosystemTypeLabel } from "@/lib/ecosystems";

export default async function AdminEcosystemAdminsPage({
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
  if (
    !profile ||
    (profile.role !== "super_admin" && profile.role !== "program_admin") ||
    profile.status !== "approved"
  ) {
    redirect("/");
  }

  const { data: ecosystemAdmins } = await supabase
    .from("profiles")
    .select("id, username, display_name, status, ecosystem_type, created_at")
    .eq("role", "ecosystem_admin")
    .order("created_at", { ascending: false });

  const pending = (ecosystemAdmins ?? []).filter(
    (a) => a.status === "pending",
  );

  return (
    <section className="mt-4 space-y-4">
      {params.approved ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Account approved.
        </p>
      ) : null}
      {params.error ? (
        <p className="text-sm text-destructive">{params.error}</p>
      ) : null}

      <ConsolePanel
        title="Pending ecosystem admins"
        description="Approve an ecosystem admin to let them create their ecosystem."
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
                <form action={approveEcosystemAdmin}>
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
            No pending ecosystem admins.
          </p>
        )}
      </ConsolePanel>
    </section>
  );
}
