import { redirect } from "next/navigation";

import { CurriculumAdminPreview } from "@/components/admin/curriculum/curriculum-admin-preview";
import { StandardRegistryPanel } from "@/components/admin/curriculum/standard-registry-panel";
import { Badge } from "@/components/ui/badge";
import { loadNationalStandardDataset, loadStandardRegistry } from "@/lib/curriculum-spine";
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

  let dataset: any = null;
  let registry: any = null;
  try {
    [dataset, registry] = await Promise.all([
      loadNationalStandardDataset(),
      loadStandardRegistry(),
    ]);
  } catch (error) {
    console.error("Failed to load curriculum admin data", error);
  }

  const safeDataset = dataset ?? {
    nodeCount: 0,
    counts: {},
    templates: [],
    templateSubjects: [],
    templateLevels: [],
    nationalSyllabi: [],
    syllabusTopics: [],
    curriculumOutcomes: [],
    thematicCurricula: [],
  };
  const safeRegistry = registry ?? { types: [], nodes: [] };

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
          document. Below them, the schema-driven standards registry hosts any
          curriculum definition that speaks the four-component language.
        </p>
      </div>

      <CurriculumAdminPreview dataset={safeDataset} />

      <StandardRegistryPanel
        types={Array.isArray(safeRegistry?.types) ? safeRegistry.types : []}
        nodes={Array.isArray(safeRegistry?.nodes) ? safeRegistry.nodes : []}
      />
    </section>
  );
}