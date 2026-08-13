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
  CreateSpaceForm,
  InviteCodeForm,
} from "@/components/console/forms";
import { createClient } from "@/lib/supabase/server";

export default async function SpaceConsolePage() {
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
  if (!profile || profile.role !== "space_admin") redirect("/dashboard");

  const { data: staffRows } = await supabase
    .from("ecosystem_staff")
    .select("ecosystem_id, ecosystems(id, name)")
    .eq("user_id", user.id)
    .eq("role", "space_admin");

  const ecosystems = staffRows
    ?.map((row) => row.ecosystems)
    .filter((ecosystem) => ecosystem !== null) ?? [];

  const { data: allSpaces } = ecosystems.length
    ? await supabase
        .from("spaces")
        .select("id, ecosystem_id, name, slug, type, description")
        .in(
          "ecosystem_id",
          ecosystems.map((e) => e.id),
        )
        .order("created_at", { ascending: false })
    : { data: [] };

  const spaces = allSpaces ?? [];

  const { data: allCodes } = spaces.length
    ? await supabase
        .from("invitation_codes")
        .select(
          "id, space_id, code, role, max_uses, used_count, expires_at, created_at",
        )
        .in(
          "space_id",
          spaces.map((s) => s.id),
        )
        .order("created_at", { ascending: false })
    : { data: [] };

  const codes = allCodes ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Space admin console
          </h1>
          <p className="text-sm text-muted-foreground">
            Create spaces and generate invitation codes for them.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </header>

      <section className="mt-8 space-y-4">
        {ecosystems.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">No ecosystem assigned</CardTitle>
              <CardDescription>
                Ask your ecosystem admin to assign you to an ecosystem before
                you can create spaces.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          ecosystems.map((ecosystem) => {
            const ecosystemSpaces = spaces.filter(
              (space) => space.ecosystem_id === ecosystem.id,
            );
            return (
              <div key={ecosystem.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {ecosystem.name}
                    </CardTitle>
                    <CardDescription>Create a space in this ecosystem.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CreateSpaceForm ecosystemId={ecosystem.id} />
                  </CardContent>
                </Card>

                {ecosystemSpaces.map((space) => {
                  const spaceCodes = codes.filter(
                    (code) => code.space_id === space.id,
                  );
                  return (
                    <Card key={space.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{space.name}</CardTitle>
                        <CardDescription>
                          {space.type}
                          {space.description ? ` · ${space.description}` : ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <InviteCodeForm spaceId={space.id} />
                        {spaceCodes.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Invitation codes
                            </p>
                            {spaceCodes.map((code) => (
                              <div
                                key={code.id}
                                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                              >
                                <div className="flex items-center gap-2">
                                  <code className="text-sm font-semibold tracking-wider">
                                    {code.code}
                                  </code>
                                  <Badge variant="outline">{code.role}</Badge>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                  <p>
                                    {code.used_count}
                                    {code.max_uses
                                      ? ` / ${code.max_uses}`
                                      : ""}{" "}
                                    used
                                  </p>
                                  {code.expires_at ? (
                                    <p>expires {formatDate(code.expires_at)}</p>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
