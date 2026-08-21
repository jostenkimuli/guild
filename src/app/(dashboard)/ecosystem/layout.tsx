import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

export default async function EcosystemLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status, ecosystem_type")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "ecosystem_admin") redirect("/");
  if (profile.status !== "approved") {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Awaiting approval</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ecosystem creation is disabled until your account is approved.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
