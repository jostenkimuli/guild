import { redirect } from "next/navigation";
import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, must_change_password")
    .eq("id", user.id)
    .single();

  if (profile?.must_change_password) {
    redirect("/setup-password");
  }

  const { data: ecosystems } = await supabase
    .from("ecosystems")
    .select("id, name, type, vision, mission, description")
    .order("created_at", { ascending: false });

  const { data: spaces } = await supabase
    .from("spaces")
    .select("id, ecosystem_id, name, slug, type, description")
    .order("created_at", { ascending: false });

  const { data: memberships } = await supabase
    .from("space_memberships")
    .select("space_id, role");

  const roleBySpace = new Map(
    (memberships ?? []).map((membership) => [
      membership.space_id,
      membership.role,
    ]),
  );

  const consoleLinks =
    profile?.role === "super_admin"
      ? [{ href: "/console/super", label: "Super admin console" }]
      : profile?.role === "program_admin"
        ? [{ href: "/console/program", label: "Program admin console" }]
        : profile?.role === "ecosystem_admin"
          ? [{ href: "/console/ecosystem", label: "Ecosystem console" }]
          : profile?.role === "space_admin"
            ? [{ href: "/console/space", label: "Space admin console" }]
            : [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            Signed in as {user.email}
            <Badge variant="secondary">{profile?.role ?? "member"}</Badge>
            {profile?.status === "pending" ? (
              <Badge variant="outline">pending approval</Badge>
            ) : null}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </header>

      {consoleLinks.length > 0 ? (
        <section className="mt-8 flex flex-wrap gap-3">
          {consoleLinks.map((link) => (
            <Button asChild key={link.href} variant="outline">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </section>
      ) : null}

      <section className="mt-8 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Ecosystems
        </h2>
        {ecosystems && ecosystems.length > 0 ? (
          ecosystems.map((ecosystem) => {
            const ecosystemSpaces = (spaces ?? []).filter(
              (space) => space.ecosystem_id === ecosystem.id,
            );
            return (
              <Card key={ecosystem.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{ecosystem.name}</CardTitle>
                    <Badge variant="secondary">{ecosystem.type}</Badge>
                  </div>
                  {ecosystem.vision ? (
                    <CardDescription>{ecosystem.vision}</CardDescription>
                  ) : (
                    <CardDescription>{ecosystem.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {ecosystemSpaces.length > 0 ? (
                    ecosystemSpaces.map((space) => (
                      <div
                        key={space.id}
                        className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {space.name}
                            {roleBySpace.has(space.id) ? (
                              <Badge variant="outline" className="ml-2">
                                {roleBySpace.get(space.id)}
                              </Badge>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {space.type}
                            {space.description ? ` · ${space.description}` : ""}
                          </p>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/spaces/${space.slug ?? space.id}`}>
                            Open
                          </Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No spaces yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">No ecosystems yet</CardTitle>
              <CardDescription>
                Ecosystems appear here once one is created and approved.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </main>
  );
}
