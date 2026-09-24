import { redirect } from "next/navigation";

import { CurriculumAdminPreview } from "@/components/admin/curriculum/curriculum-admin-preview";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCurriculumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  if (
    !profile ||
    profile.role !== "super_admin" ||
    profile.status !== "approved"
  ) {
    redirect("/");
  }

  return (
    <section className="mt-4 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            National curriculum
          </h2>
          <Badge variant="secondary">Super admin · Cycle 1 definition</Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The reference standard super admins maintain before any school
          implementation starts. Two structure types live here as separate
          tabs — the subject-based arm (national templates → subject syllabi)
          and the thematic P1–P3 curriculum. Both arms are organized around the
          four universal curriculum components — Intent, Content, Learning
          &amp; Teaching, and Assessment — with a completeness gauge per
          document.
        </p>
      </div>

      <CurriculumAdminPreview />
    </section>
  );
}