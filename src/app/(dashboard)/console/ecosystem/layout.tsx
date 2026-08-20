import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { CreateEcosystemForm } from "@/components/console/forms";
import { ConsolePanel } from "@/components/console/panels";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ecosystemTypeLabel } from "@/lib/ecosystems";

export default async function EcosystemConsoleLayout({
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
  if (!profile || profile.role !== "ecosystem_admin") redirect("/dashboard");

  if (profile.status !== "approved") {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Awaiting approval
              <Badge variant="outline" className="ml-2">
                {profile.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              Ecosystem creation is disabled until your account is approved.
              You will be able to create your ecosystem here once approved.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { data: ecosystems } = await supabase
    .from("ecosystems")
    .select("*")
    .eq("created_by", user.id);
  const ecosystem = ecosystems?.[0];

  if (!ecosystem) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <ConsolePanel
          title={`Create your ${ecosystemTypeLabel(profile.ecosystem_type)}`}
          description="The details you provide become its public profile and metadata."
        >
          <CreateEcosystemForm
            ecosystemType={profile.ecosystem_type ?? undefined}
          />
        </ConsolePanel>
      </div>
    );
  }

  return <>{children}</>;
}
