import { redirect } from "next/navigation";

import {
  CreateEcosystemForm,
  CreateSchoolEcosystemForm,
} from "@/components/console/forms";
import { ConsolePanel } from "@/components/console/panels";
import { createClient } from "@/lib/supabase/server";
import { ecosystemTypeLabel, isSchoolType } from "@/lib/ecosystems";

export default async function EcosystemRootPage() {
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
  if (profile.status !== "approved") redirect("/");

  const { data: ecosystems } = await supabase
    .from("ecosystems")
    .select("id, slug")
    .eq("created_by", user.id);
  const ecosystem = ecosystems?.[0];

  if (ecosystem) {
    redirect(`/ecosystem/${ecosystem.slug}`);
  }

  const school = isSchoolType(profile.ecosystem_type);

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      {school ? (
        <CreateSchoolEcosystemForm
          ecosystemType={profile.ecosystem_type ?? undefined}
        />
      ) : (
        <ConsolePanel
          title={`Create your ${ecosystemTypeLabel(profile.ecosystem_type)}`}
          description="The details you provide become its public profile and metadata."
        >
          <CreateEcosystemForm
            ecosystemType={profile.ecosystem_type ?? undefined}
          />
        </ConsolePanel>
      )}
    </div>
  );
}