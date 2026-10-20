import { redirect } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateSpaceDialog } from "@/components/console/create-space-dialog";
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select(
      "id, slug, name, type, vision, mission, description, raw_ecosystem_meta_data, badge_url, theme_primary, theme_supporting, theme_accent",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!ecosystem) redirect("/ecosystem");

  if (isSchoolType(ecosystem.type)) {
    const rawMeta = ecosystem.raw_ecosystem_meta_data;
    const profileMeta =
      rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta)
        ? Object.fromEntries(
            Object.entries(rawMeta).filter(
              (entry): entry is [string, string] => typeof entry[1] === "string",
            ),
          )
        : {};
    return <SchoolDashboard ecosystem={{ ...ecosystem, raw_ecosystem_meta_data: profileMeta }} />;
  }

  const [{ count: spaceCount }, { count: adminCount }, { count: memberCount }, { count: pendingAdminCount }] =
    await Promise.all([
      supabase
        .from("spaces")
        .select("id", { count: "exact", head: true })
        .eq("ecosystem_id", ecosystem.id),
      supabase
        .from("ecosystem_staff")
        .select("user_id", { count: "exact", head: true })
        .eq("ecosystem_id", ecosystem.id)
        .eq("role", "space_admin"),
      supabase
        .from("space_memberships")
        .select("user_id", { count: "exact", head: true })
        .eq("spaces.ecosystem_id", ecosystem.id),
      supabase
        .from("ecosystem_staff")
        .select("user_id", { count: "exact", head: true })
        .eq("ecosystem_id", ecosystem.id)
        .eq("role", "space_admin")
        .eq("profiles.status", "pending"),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{ecosystem.name}</h2>
            <Badge variant="secondary">{ecosystemTypeLabel(ecosystem.type)}</Badge>
          </div>
          {ecosystem.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{ecosystem.description}</p>
          ) : null}
        </div>
      </div>

      {/* Pending space admin approvals banner */}
      {(pendingAdminCount ?? 0) > 0 && (
        <Link
          href={`/ecosystem/${ecosystem.slug}/staff`}
          className="flex items-center justify-between gap-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10"
        >
          <div>
            <p className="text-sm font-medium text-on-surface">
              {pendingAdminCount} space admin{pendingAdminCount !== 1 ? "s" : ""} awaiting approval
            </p>
            <p className="mt-0.5 text-xs text-on-surface-variant">Go to Staff to approve them.</p>
          </div>
          <span className="text-xs text-primary">Review →</span>
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Spaces"
          value={spaceCount ?? 0}
          href={`/ecosystem/${ecosystem.slug}/spaces`}
          action="Manage spaces"
        />
        <StatCard
          label="Space admins"
          value={adminCount ?? 0}
          href={`/ecosystem/${ecosystem.slug}/staff`}
          action="Manage staff"
        />
        <StatCard
          label="Members"
          value={memberCount ?? 0}
          href={`/ecosystem/${ecosystem.slug}/members`}
          action="View members"
        />
      </div>

      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
        <p className="mb-3 text-sm font-semibold text-on-surface">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          <CreateSpaceDialog ecosystemId={ecosystem.id} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/ecosystem/${ecosystem.slug}/spaces`}>View all spaces</Link>
          </Button>
        </div>
      </div>

      {(ecosystem.vision || ecosystem.mission) ? (
        <div className="space-y-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
          {ecosystem.vision ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">Vision</p>
              <p className="mt-1 text-sm text-on-surface">{ecosystem.vision}</p>
            </div>
          ) : null}
          {ecosystem.mission ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">Mission</p>
              <p className="mt-1 text-sm text-on-surface">{ecosystem.mission}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  action,
}: {
  label: string;
  value: number;
  href: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container"
    >
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-on-surface">{value}</p>
      <p className="mt-1 text-xs text-primary underline-offset-2 group-hover:underline">
        {action} →
      </p>
    </Link>
  );
}
