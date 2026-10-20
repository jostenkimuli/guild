import { redirect } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ecosystemDisplayName } from "@/lib/ecosystems";
import { SpaceEditDialog } from "@/components/console/space-edit-dialog";
import { SpaceTabs } from "@/components/spaces/space-tabs";
import { approveSpaceEdit, rejectSpaceEdit } from "@/app/actions/console";

export default async function SpacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: space } = await supabase
    .from("spaces")
    .select("id, name, slug, type, description, ecosystem_id, ecosystems(name, type)")
    .eq("slug", slug)
    .maybeSingle();

  if (!space) {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <p className="text-sm font-medium text-on-surface">Space not found</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          The space you are looking for does not exist.
        </p>
      </div>
    );
  }

  const { data: membership } = await supabase
    .from("space_memberships")
    .select("role")
    .eq("space_id", space.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  const { data: staff } = await supabase
    .from("ecosystem_staff")
    .select("role")
    .eq("ecosystem_id", space.ecosystem_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isEcosystemAdmin =
    staff?.role === "ecosystem_admin" &&
    profile?.role === "ecosystem_admin" &&
    profile?.status === "approved";

  const isSpaceAdmin = membership?.role === "admin" || isEcosystemAdmin;
  const isStaff =
    membership?.role === "admin" ||
    membership?.role === "teacher" ||
    isEcosystemAdmin;
  const isMember = membership !== null;

  // Pending edits (ecosystem admin only)
  let pendingEdits: PendingEdit[] = [];
  if (isEcosystemAdmin) {
    const { data } = await supabase
      .from("space_edits")
      .select("id, created_at, changes, profiles!space_edits_edited_by_fkey(display_name)")
      .eq("space_id", space.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    pendingEdits = data ?? [];
  }

  // Members
  const { data: memberships } = await supabase
    .from("space_memberships")
    .select("user_id, role, profiles(display_name, username)")
    .eq("space_id", space.id);

  const { data: ecosystemAdminRows } = await supabase
    .from("ecosystem_staff")
    .select("user_id")
    .eq("ecosystem_id", space.ecosystem_id)
    .eq("role", "ecosystem_admin");
  const ecosystemAdminIds = new Set((ecosystemAdminRows ?? []).map((r) => r.user_id));
  const visibleMemberships = (memberships ?? []).filter(
    (m) => !ecosystemAdminIds.has(m.user_id),
  );

  const { data: latestEdit } = await supabase
    .from("space_edits")
    .select("id, status, created_at, changes")
    .eq("space_id", space.id)
    .eq("edited_by", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Curriculum (ecosystem admin only)
  let curricula: CurriculumTreeEntry[] = [];
  if (isEcosystemAdmin) {
    const { data } = await supabase
      .from("curricula")
      .select("id, name, year, is_published, curriculum_goals(id, description), grades(name, id, terms(id))")
      .eq("space_id", space.id)
      .order("name", { ascending: true });
    curricula = (data ?? []) as unknown as CurriculumTreeEntry[];
  }

  // Syllabi (staff only)
  let staffSyllabi: SyllabiRow[] = [];
  if (isStaff) {
    const { data } = await supabase
      .from("syllabi")
      .select("id, curriculum_id, grading_policy, required_materials, office_hours, classroom_expectations, curricula(name, year)")
      .eq("curricula.space_id", space.id)
      .order("created_at");
    staffSyllabi = (data ?? []) as SyllabiRow[];
  }

  const teacherCount = visibleMemberships.filter((m) => m.role === "teacher").length;
  const learnerCount = visibleMemberships.filter((m) => m.role === "learner").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-on-surface">
              {space.name}
            </h1>
            <Badge variant="secondary" className="capitalize">{space.type.replace("_", " ")}</Badge>
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            {space.ecosystems ? ecosystemDisplayName(space.ecosystems) : ""}
            {space.description ? ` · ${space.description}` : ""}
          </p>
        </div>
        {isSpaceAdmin && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/spaces/${slug}/teachers`}>Teachers</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/spaces/${slug}/members`}>Members</Link>
            </Button>
            <SpaceEditDialog space={space} latestEdit={latestEdit} />
          </div>
        )}
      </div>

      {/* Pending edits — ecosystem admin only, shown prominently */}
      {isEcosystemAdmin && pendingEdits.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            Pending edit requests ({pendingEdits.length})
          </p>
          {pendingEdits.map((edit) => {
            const changes = (edit.changes ?? {}) as Record<string, unknown>;
            const requested = Object.entries(changes).filter(
              ([, v]) => typeof v === "string" && (v as string).length > 0,
            );
            return (
              <div
                key={edit.id}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4"
              >
                <p className="text-sm font-medium text-on-surface">
                  {edit.profiles?.display_name ?? "A space admin"} requested an edit
                </p>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {new Date(edit.created_at).toLocaleDateString(undefined, {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </p>
                {requested.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-sm text-on-surface">
                    {requested.map(([field, value]) => (
                      <li key={field}>
                        <span className="font-medium capitalize">{field}:</span>{" "}
                        {String(value)}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex gap-2">
                  <form action={approveSpaceEdit}>
                    <input type="hidden" name="edit_id" value={edit.id} />
                    <Button type="submit" size="sm">Approve</Button>
                  </form>
                  <form action={rejectSpaceEdit}>
                    <input type="hidden" name="edit_id" value={edit.id} />
                    <Button type="submit" size="sm" variant="outline">Reject</Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Not a member */}
      {!isMember && !isEcosystemAdmin && (
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
          <p className="text-sm font-medium text-on-surface">Join this space</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            You are not a member yet. Ask a teacher or admin for an invitation code.
          </p>
        </div>
      )}

      {/* Stat row — members at a glance */}
      {(isMember || isEcosystemAdmin) && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Teachers" value={teacherCount} />
          <StatTile label="Learners" value={learnerCount} />
          <StatTile label="Total members" value={visibleMemberships.length} />
        </div>
      )}

      {/* Tabbed content */}
      {(isMember || isEcosystemAdmin) && (
        <SpaceTabs
          spaceId={space.id}
          memberships={visibleMemberships}
          curricula={curricula}
          staffSyllabi={staffSyllabi}
          isStaff={isStaff}
          isEcosystemAdmin={isEcosystemAdmin}
        />
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-on-surface">{value}</p>
    </div>
  );
}

type CurriculumTreeEntry = {
  id: string;
  name: string;
  year: number;
  is_published: boolean | null;
  curriculum_goals: { id: string; description: string }[] | null;
  grades: { id: string; name: string; terms: { id: string }[] | null }[] | null;
};

type PendingEdit = {
  id: string;
  created_at: string;
  changes: unknown;
  profiles: { display_name: string } | null;
};

type SyllabiRow = {
  id: string;
  curriculum_id: string;
  curricula: { name: string; year: number } | null;
  grading_policy: {
    pass_mark?: number;
    grade_breakdown: { label: string; weight_pct: number }[];
  } | null;
  required_materials: string | null;
  office_hours: string | null;
  classroom_expectations: string | null;
};
