import {
  buildDatabaseDataset,
  type CurriculumDatabaseDataset,
  type CurriculumNodeRow,
} from "@/lib/playground/mock-data-source";
import {
  buildStandardRegistry,
  type NodeTypeRowLike,
  type SpineNodeRowLike,
  type StandardRegistryData,
} from "@/lib/curriculum-spine/registry";
import { createClient } from "@/lib/supabase/server";

type SpineSupabase = Awaited<ReturnType<typeof createClient>>;

async function fetchSpineRows(
  supabase: SpineSupabase,
): Promise<{ typeRows: NodeTypeRowLike[]; nodes: SpineNodeRowLike[] }> {
  const { data: typeRows, error: typeError } = await supabase
    .from("node_types")
    .select("type_id, type_name, category, payload_schema, allowed_children, is_root");
  if (typeError) {
    throw new Error(`Failed to load node types: ${typeError.message}`);
  }

  const { data: nodes, error: nodesError } = await supabase
    .from("curriculum_nodes")
    .select(
      "curriculum_node_id, parent_node_id, type_id, title, code, order_index, status, published_at, payload",
    )
    .order("order_index", { ascending: true });
  if (nodesError) {
    throw new Error(`Failed to load curriculum nodes: ${nodesError.message}`);
  }

  return {
    typeRows: (typeRows ?? []) as NodeTypeRowLike[],
    nodes: (nodes ?? []) as SpineNodeRowLike[],
  };
}

/**
 * Loads the whole spine once and derives both products the admin
 * curriculum page needs: the mock-shaped dataset consumed by the
 * bespoke NCDC preview (via `applyDatabaseDataset`) and the generic
 * standards registry (schema-as-data types + raw nodes).
 */
export async function loadSpineData(): Promise<{
  dataset: CurriculumDatabaseDataset;
  registry: StandardRegistryData;
}> {
  const supabase = await createClient();
  const { typeRows, nodes } = await fetchSpineRows(supabase);

  const typeIdsByTypeName = new Map<string, number>();
  for (const row of typeRows) typeIdsByTypeName.set(row.type_name, row.type_id);

  return {
    dataset: buildDatabaseDataset(nodes as CurriculumNodeRow[], typeIdsByTypeName),
    registry: buildStandardRegistry(typeRows, nodes),
  };
}

/**
 * Server-side loader for the national curriculum reference standard
 * (mock-shaped dataset for the bespoke NCDC admin arm).
 */
export async function loadNationalStandardDataset(): Promise<CurriculumDatabaseDataset> {
  return (await loadSpineData()).dataset;
}

/** Server-side loader for the generic standards registry. */
export async function loadStandardRegistry(): Promise<StandardRegistryData> {
  return (await loadSpineData()).registry;
}