import { redirect } from "next/navigation";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SyllabusForm } from "@/components/spaces/syllabus-form";

export default async function NewSyllabusPage({
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
    .select("id, name, ecosystem_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!space) redirect("/");

  const { data: membership } = await supabase
    .from("space_memberships")
    .select("role")
    .eq("space_id", space.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isStaff =
    membership?.role === "admin" || membership?.role === "teacher";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  // Ecosystem admins run every space of their ecosystem: allow them too.
  const { data: staffRow } = await supabase
    .from("ecosystem_staff")
    .select("role")
    .eq("ecosystem_id", space.ecosystem_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isEcosystemAdmin =
    staffRow?.role === "ecosystem_admin" &&
    profile?.role === "ecosystem_admin" &&
    profile?.status === "approved";

  if (!isStaff && !isEcosystemAdmin) {
    redirect(`/spaces/${slug}`);
  }

  const { data: curriculum } = await supabase
    .from("curricula")
    .select("id, name")
    .eq("space_id", space.id)
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!curriculum) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No curriculum found</CardTitle>
            <CardDescription>
              A curriculum must exist before a syllabus can be created. Ask a
              space admin to set up the curriculum structure first.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check for existing syllabus
  const { data: existingSyllabus } = await supabase
    .from("syllabi")
    .select(
      "id, grading_policy, required_materials, instructor_notes",
    )
    .eq("curriculum_id", curriculum.id)
    .maybeSingle();

  const back = `/spaces/${slug}`;

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {existingSyllabus ? "Edit" : "Create"} Syllabus
        </h1>
        <p className="text-sm text-muted-foreground">
          {curriculum.name} — {space.name}
        </p>
      </header>

      <SyllabusForm
        curriculumId={curriculum.id}
        back={back}
        existing={
          existingSyllabus
            ? {
                grading_policy: existingSyllabus.grading_policy as {
                  pass_mark: number;
                  grade_breakdown: { label: string; weight_pct: number }[];
                },
                required_materials: existingSyllabus.required_materials,
                instructor_notes: existingSyllabus.instructor_notes,
              }
            : null
        }
      />
    </div>
  );
}
