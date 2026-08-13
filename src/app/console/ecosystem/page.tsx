import { redirect } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreateEcosystemForm,
  CreateSpaceAdminForm,
} from "@/components/console/forms";
import { createClient } from "@/lib/supabase/server";

export default async function EcosystemConsolePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "ecosystem_admin") redirect("/dashboard");

  if (profile.status !== "approved") {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 p-6">
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
      </main>
    );
  }

  const { data: ecosystems } = await supabase
    .from("ecosystems")
    .select("*")
    .eq("created_by", user.id);
  const ecosystem = ecosystems?.[0];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ecosystem admin console
          </h1>
          <p className="text-sm text-muted-foreground">
            {ecosystem
              ? "Manage your ecosystem and create space-admin accounts."
              : "Create the ecosystem your school will live in."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </header>

      <section className="mt-8 space-y-4">
        {ecosystem ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{ecosystem.name}</CardTitle>
                  <Badge variant="secondary">{ecosystem.type}</Badge>
                </div>
                <CardDescription>
                  {ecosystem.vision || ecosystem.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {ecosystem.raw_ecosystem_meta_data ? (
                  <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    <MetaRow
                      label="School location"
                      value={ecosystemMeta(ecosystem).school_location}
                    />
                    <MetaRow
                      label="Director"
                      value={ecosystemMeta(ecosystem).director_name}
                    />
                    <MetaRow
                      label="Headteacher"
                      value={ecosystemMeta(ecosystem).headteacher_name}
                    />
                  </dl>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Create a space admin
                </CardTitle>
                <CardDescription>
                  Space admins run spaces in {ecosystem.name} and generate
                  invitation codes for them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateSpaceAdminForm ecosystemId={ecosystem.id} />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create your ecosystem</CardTitle>
              <CardDescription>
                A school, university, organization, or alliance. The details
                you provide become its public profile and metadata.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateEcosystemForm />
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

function MetaRow({ label, value }: { label: string; value?: unknown }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{String(value)}</dd>
    </div>
  );
}

function ecosystemMeta(ecosystem: { raw_ecosystem_meta_data: unknown }) {
  const meta =
    ecosystem.raw_ecosystem_meta_data !== null &&
    typeof ecosystem.raw_ecosystem_meta_data === "object" &&
    !Array.isArray(ecosystem.raw_ecosystem_meta_data)
      ? (ecosystem.raw_ecosystem_meta_data as Record<string, unknown>)
      : {};
  return {
    school_location:
      typeof meta.school_location === "string" ? meta.school_location : undefined,
    director_name:
      typeof meta.director_name === "string" ? meta.director_name : undefined,
    headteacher_name:
      typeof meta.headteacher_name === "string" ? meta.headteacher_name : undefined,
  };
}
