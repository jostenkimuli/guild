import { Badge } from "@/components/ui/badge";
import { CurriculumAdminPreview } from "@/components/playground/curriculum-admin-preview";
import {
  buildDatabaseDataset,
  type CurriculumDatabaseDataset,
} from "@/lib/playground/mock-data-source";
import { createServiceClient } from "@/lib/supabase/service";

export default async function CurriculumAdminPage() {
  let databaseDataset: CurriculumDatabaseDataset | null = null;
  let databaseError: string | null = null;

  try {
    const supabase = createServiceClient();
    const [typesResult, nodesResult] = await Promise.all([
      supabase.from("node_types").select("type_id, type_name, category"),
      supabase
        .from("curriculum_nodes")
        .select(
          "curriculum_node_id, parent_node_id, type_id, title, code, order_index, status, published_at, payload",
        ),
    ]);
    if (typesResult.error) throw typesResult.error;
    if (nodesResult.error) throw nodesResult.error;

    const nodeTypes = typesResult.data ?? [];
    const nodes = nodesResult.data ?? [];
    const typeIdsByTypeName = new Map(
      nodeTypes.map((row) => [row.type_name, row.type_id]),
    );
    if (nodes.length > 0) {
      databaseDataset = buildDatabaseDataset(nodes, typeIdsByTypeName);
    }
  } catch (error) {
    databaseError =
      error instanceof Error
        ? error.message
        : "Could not read public.curriculum_nodes.";
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
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
          and the thematic P1–P3 curriculum. Both arms are organized around
          the four universal curriculum components — Intent, Content,
          Learning &amp; Teaching, and Assessment — with a completeness gauge
          per document. Fed from mock data by default; flip the player to
          read the same structure from <code>public.curriculum_nodes</code>.
        </p>
      </section>

      <CurriculumAdminPreview
        databaseDataset={databaseDataset}
        databaseError={databaseError}
      />
    </div>
  );
}