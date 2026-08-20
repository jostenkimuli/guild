import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { CreateSpaceDialog } from "@/components/console/create-space-dialog";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
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
  const role = profile?.role ?? null;

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("id")
    .eq("created_by", user.id)
    .maybeSingle();

  const myEcosystem =
    role === "ecosystem_admin" ? ecosystem ?? undefined : undefined;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{role ?? "member"}</Badge>
        {profile?.status === "pending" ? (
          <Badge variant="outline">pending approval</Badge>
        ) : null}
      </div>

      {myEcosystem ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Quick actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <CreateSpaceDialog
              ecosystemId={myEcosystem.id}
              defaultType="department"
              triggerLabel="Create a space"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}