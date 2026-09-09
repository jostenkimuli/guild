import { redirect } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ecosystemTypeLabel, isSchoolType } from "@/lib/ecosystems";
import { SchoolDashboard } from "@/components/ecosystem/school-dashboard";

export default async function EcosystemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select(
      "id, slug, name, type, vision, mission, description, badge_url, theme_primary, theme_supporting, theme_accent",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!ecosystem) redirect("/ecosystem");

  if (isSchoolType(ecosystem.type)) {
    return <SchoolDashboard ecosystem={ecosystem} />;
  }

  const { count: spaceCount } = await supabase
    .from("spaces")
    .select("id", { count: "exact", head: true })
    .eq("ecosystem_id", ecosystem.id);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {ecosystem.name}
          </h2>
          <Badge variant="secondary">
            {ecosystemTypeLabel(ecosystem.type)}
          </Badge>
        </div>
        {ecosystem.description ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {ecosystem.description}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{spaceCount ?? 0}</p>
            <Button asChild variant="ghost" size="sm" className="mt-2 px-0">
              <Link href={`/ecosystem/${ecosystem.slug}/spaces`}>Manage spaces</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" size="sm" className="px-0">
              <Link href={`/ecosystem/${ecosystem.slug}/staff`}>Manage staff</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {ecosystem.vision ? (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Vision
          </h3>
          <p className="mt-1 text-sm">{ecosystem.vision}</p>
        </div>
      ) : null}

      {ecosystem.mission ? (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Mission
          </h3>
          <p className="mt-1 text-sm">{ecosystem.mission}</p>
        </div>
      ) : null}
    </div>
  );
}
