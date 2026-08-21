import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ecosystemDisplayName } from "@/lib/ecosystems";
import { SpaceEditDialog } from "@/components/console/space-edit-dialog";
import { CurriculumDialog } from "@/components/console/curriculum-dialog";
import { SyllabiSection } from "@/components/spaces/syllabi-section";
import {
  approveSpaceEdit,
  rejectSpaceEdit,
} from "@/app/actions/console";

export default async function SpacePage({
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

  const { data: space } = await supabase
    .from("spaces")
    .select("id, name, slug, type, description, ecosystem_id, ecosystems(name, type)")
    .eq("slug", slug)
    .maybeSingle();

  if (!space) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Space not found</CardTitle>
            <CardDescription>
              The space you are looking for does not exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { data: membership } = await supabase
    .from("space_memberships")
    .select("role")
    .eq("space_id", space.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isMember = membership !== null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  // Ecosystem admins govern every space of their ecosystem: scope the
  // ecosystem-admin role to this space's ecosystem and treat them as an
  // in-space admin too.
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
const isStaff = membership?.role === "admin" || membership?.role === "teacher" || isEcosystemAdmin;

  let pendingEdits: PendingEdit[] = [];
  if (isEcosystemAdmin) {
    const { data } = await supabase
      .from("space_edits")
      .select(
        "id, created_at, changes, profiles!space_edits_edited_by_fkey(display_name)",
      )
      .eq("space_id", space.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    pendingEdits = data ?? [];
  }

  const { data: memberships } = await supabase
    .from("space_memberships")
    .select("user_id, role, profiles(display_name)")
    .eq("space_id", space.id);

  // Ecosystem admins govern the space from ecosystem_staff; hide them from
  // the members list.
  const { data: ecosystemAdminRows } = await supabase
    .from("ecosystem_staff")
    .select("user_id")
    .eq("ecosystem_id", space.ecosystem_id)
    .eq("role", "ecosystem_admin");
  const ecosystemAdminIds = new Set(
    (ecosystemAdminRows ?? []).map((row) => row.user_id),
  );
  const visibleMemberships = (memberships ?? []).filter(
    (membership) => !ecosystemAdminIds.has(membership.user_id),
  );

  const { data: latestEdit } = await supabase
    .from("space_edits")
    .select("id, status, created_at, changes")
    .eq("space_id", space.id)
    .eq("edited_by", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Ecosystem admins manage the curriculum: fetch the full tree
  // (curriculum → grades → terms → units → topics) plus goals.
  let curricula: CurriculumTreeEntry[] = [];
  if (isEcosystemAdmin) {
    const { data } = await supabase
      .from("curricula")
      .select(
        "id, name, year, is_published, curriculum_goals(id, description), grades(name, id, terms(id))",
      )
      .eq("space_id", space.id)
      .order("name", { ascending: true });
    curricula = (data ?? []) as unknown as CurriculumTreeEntry[];
  }

  let staffSyllabi: {
    id: string;
    curriculum_id: string;
    grading_policy: { pass_mark?: number; grade_breakdown: { label: string; weight_pct: number }[] } | null;
    required_materials: string | null;
    office_hours: string | null;
    classroom_expectations: string | null;
    curricula: { name: string; year: number } | null;
  }[] = [];
  if (isStaff) {
    const { data: syb } = await supabase
      .from("syllabi")
      .select("id, curriculum_id, grading_policy, required_materials, office_hours, classroom_expectations, curricula(name, year)")
      .eq("curricula.space_id", space.id)
      .order("created_at");
    staffSyllabi = (syb ?? []) as typeof staffSyllabi;
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {space.name}
            </h1>
            <Badge variant="secondary">{space.type}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {space.ecosystems
              ? ecosystemDisplayName(space.ecosystems)
              : "Unknown ecosystem"}
            {space.description ? ` · ${space.description}` : ""}
          </p>
        </div>
      </header>

      {isEcosystemAdmin && pendingEdits.length > 0 ? (
        <PendingSpaceEdits edits={pendingEdits} />
      ) : null}

      <SyllabiSection
        curricula={curricula}
        syllabiRows={staffSyllabi}
      />

      {!isMember && !isEcosystemAdmin ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Join this space</CardTitle>
            <CardDescription>
              You are not a member yet. Ask a teacher or admin for an
              invitation code to participate in this space.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <section className="mt-8 space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Members
            </h2>
            <Card>
              <CardContent className="pt-6">
                {visibleMemberships.length > 0 ? (
                  <ul className="divide-y">
                    {visibleMemberships.map((membership) => (
                      <li
                        key={`${membership.profiles?.display_name}-${membership.role}`}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm font-medium">
                          {membership.profiles?.display_name ?? "A member"}
                        </span>
                        <Badge variant="secondary">{membership.role}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No members yet.
                  </p>
                )}
              </CardContent>
              {isSpaceAdmin ? (
                <CardFooter className="justify-end border-t pt-4">
                  <SpaceEditDialog
                    space={space}
                    latestEdit={latestEdit}
                  />
                </CardFooter>
              ) : null}
            </Card>
          </section>

          {isEcosystemAdmin ? (
            <section className="mt-8 space-y-4">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Curriculum
              </h2>
              <Card>
                <CardContent className="pt-6">
                  {curricula.length > 0 ? (
                    <ul className="divide-y">
                      {curricula.map((curriculum) => (
                        <li
                          key={curriculum.id}
                          className="space-y-2 py-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              {curriculum.name}
                              <Badge
                                variant={
                                  curriculum.is_published
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {curriculum.is_published
                                  ? "Published"
                                  : "Draft"}
                              </Badge>
                            </span>
                            <Badge variant="secondary">
                              Year {curriculum.year}
                            </Badge>
                          </div>

                          {curriculum.curriculum_goals?.length ? (
                            <ul className="space-y-0.5 text-sm text-muted-foreground">
                              {curriculum.curriculum_goals.map((goal) => (
                                <li key={goal.id}>
                                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                                    Goal:
                                  </span>{" "}
                                  {goal.description}
                                </li>
                              ))}
                            </ul>
                          ) : null}

                          {curriculum.grades?.length ? (
                            <ul className="space-y-1 pl-2 text-sm">
                              {curriculum.grades.map((grade) => (
                                <li key={grade.id} className="text-sm">
                                  <span className="font-medium">
                                    {grade.name}
                                  </span>
                                  {grade.terms?.length ? (
                                    <span className="text-muted-foreground">
                                      {" "}
                                      ({grade.terms.length}{" "}
                                      {grade.terms.length === 1
                                        ? "term"
                                        : "terms"}
                                      )
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No grades yet.
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No curriculum yet.
                    </p>
                  )}
                </CardContent>
                <CardFooter className="justify-end border-t pt-4">
                  <CurriculumDialog
                    space={{ id: space.id }}
                    curricula={curricula.map((entry) => ({
                      id: entry.id,
                      name: entry.name,
                      year: entry.year,
                    }))}
                  />
                </CardFooter>
              </Card>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

type CurriculumTreeEntry = {
  id: string;
  name: string;
  year: number;
  is_published: boolean | null;
  curriculum_goals: { id: string; description: string }[] | null;
  grades: {
    id: string;
    name: string;
    terms: { id: string }[] | null;
  }[] | null;
};

type PendingEdit = {
  id: string;
  created_at: string;
  changes: unknown;
  profiles: { display_name: string } | null;
};

function PendingSpaceEdits({ edits }: { edits: PendingEdit[] }) {
  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Pending space edit requests
      </h2>
      {edits.map((edit) => {
        const changes = (edit.changes ?? {}) as Record<string, unknown>;
        const requested = Object.entries(changes).filter(
          ([, value]) => typeof value === "string" && value.length > 0,
        );
        return (
          <Card key={edit.id}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {edit.profiles?.display_name ?? "A space admin"} requested an
                edit
              </CardTitle>
              <CardDescription>
                Submitted {formatDate(edit.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {requested.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {requested.map(([field, value]) => (
                    <li key={field}>
                      <span className="font-medium capitalize">
                        {field}:
                      </span>{" "}
                      {String(value)}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="flex gap-2">
                <form action={approveSpaceEdit}>
                  <input type="hidden" name="edit_id" value={edit.id} />
                  <Button type="submit" size="sm">
                    Approve
                  </Button>
                </form>
                <form action={rejectSpaceEdit}>
                  <input type="hidden" name="edit_id" value={edit.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Reject
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}