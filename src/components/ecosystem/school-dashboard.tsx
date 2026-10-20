"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeModal } from "@/components/ecosystem/theme-modal";
import { CreateSpaceDialog } from "@/components/console/create-space-dialog";
import { ecosystemTypeLabel } from "@/lib/ecosystems";

type SchoolEcosystem = {
  id: string;
  slug: string;
  name: string;
  type: string;
  vision: string | null;
  mission: string | null;
  description: string | null;
  raw_ecosystem_meta_data: Record<string, string>;
  badge_url: string | null;
  theme_primary: string | null;
  theme_supporting: string | null;
  theme_accent: string | null;
};

export function SchoolDashboard({ ecosystem }: { ecosystem: SchoolEcosystem }) {
  const [themeOpen, setThemeOpen] = useState(false);
  const [students, setStudents] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<number | null>(null);
  const [spaces, setSpaces] = useState<number | null>(null);
  const [spaceAdmins, setSpaceAdmins] = useState<number | null>(null);
  const [pendingAdmins, setPendingAdmins] = useState<number>(0);

  useEffect(() => {
    const sb = createBrowserClient();
    async function load() {
      const [studentRes, teacherRes, spaceRes, adminRes, pendingRes] = await Promise.all([
        sb
          .from("space_memberships")
          .select("id", { count: "exact", head: true })
          .eq("spaces.ecosystem_id", ecosystem.id)
          .eq("role", "learner"),
        sb
          .from("space_memberships")
          .select("id", { count: "exact", head: true })
          .eq("spaces.ecosystem_id", ecosystem.id)
          .eq("role", "teacher"),
        sb
          .from("spaces")
          .select("id", { count: "exact", head: true })
          .eq("ecosystem_id", ecosystem.id),
        sb
          .from("ecosystem_staff")
          .select("user_id", { count: "exact", head: true })
          .eq("ecosystem_id", ecosystem.id)
          .eq("role", "space_admin"),
        sb
          .from("ecosystem_staff")
          .select("user_id", { count: "exact", head: true })
          .eq("ecosystem_id", ecosystem.id)
          .eq("role", "space_admin")
          .eq("profiles.status", "pending"),
      ]);
      setStudents(studentRes.count ?? 0);
      setTeachers(teacherRes.count ?? 0);
      setSpaces(spaceRes.count ?? 0);
      setSpaceAdmins(adminRes.count ?? 0);
      setPendingAdmins(pendingRes.count ?? 0);
    }
    load();
  }, [ecosystem.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{ecosystem.name}</h2>
            <Badge variant="secondary">{ecosystemTypeLabel(ecosystem.type)}</Badge>
          </div>
          {ecosystem.vision ? (
            <p className="mt-1 text-sm text-on-surface-variant">{ecosystem.vision}</p>
          ) : null}
        </div>
        <Button size="sm" variant="outline" onClick={() => setThemeOpen(true)}>
          Theme &amp; Branding
        </Button>
      </div>

      {/* Pending space admin approvals */}
      {pendingAdmins > 0 && (
        <Link
          href={`/ecosystem/${ecosystem.slug}/staff`}
          className="flex items-center justify-between gap-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10"
        >
          <div>
            <p className="text-sm font-medium text-on-surface">
              {pendingAdmins} space admin{pendingAdmins !== 1 ? "s" : ""} awaiting approval
            </p>
            <p className="mt-0.5 text-xs text-on-surface-variant">Go to Staff to approve them.</p>
          </div>
          <span className="text-xs text-primary">Review →</span>
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Spaces"
          value={spaces}
          href={`/ecosystem/${ecosystem.slug}/spaces`}
          action="Manage spaces"
        />
        <StatCard
          label="Space admins"
          value={spaceAdmins}
          href={`/ecosystem/${ecosystem.slug}/staff`}
          action="Manage staff"
        />
        <StatCard
          label="Students"
          value={students}
          href={`/ecosystem/${ecosystem.slug}/students`}
          action="View students"
        />
        <StatCard
          label="Teachers"
          value={teachers}
          href={`/ecosystem/${ecosystem.slug}/staff`}
          action="View staff"
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
        <p className="mb-3 text-sm font-semibold text-on-surface">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          <CreateSpaceDialog ecosystemId={ecosystem.id} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/ecosystem/${ecosystem.slug}/spaces`}>View all spaces</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/ecosystem/${ecosystem.slug}/settings`}>Settings</Link>
          </Button>
        </div>
      </div>

      <ThemeModal
        ecosystem={ecosystem}
        open={themeOpen}
        onClose={() => setThemeOpen(false)}
      />
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
  value: number | null;
  href: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container"
    >
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-on-surface">
        {value === null ? (
          <span className="inline-block h-7 w-8 animate-pulse rounded bg-surface-container-high" />
        ) : (
          value
        )}
      </p>
      <p className="mt-1 text-xs text-primary underline-offset-2 group-hover:underline">
        {action} →
      </p>
    </Link>
  );
}
