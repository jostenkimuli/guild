// Generic standard registry: node types (with schema-as-data) and raw
// spine nodes as consumed by the standards registry UI, plus the
// manifest-driven coverage computation for the four universal
// components. Pure functions — importable from server loaders and
// client components.

import type {
  ComponentManifest,
  CurriculumComponentId,
} from "./manifest.ts";
import { CURRICULUM_COMPONENT_IDS } from "./manifest.ts";
import { parseSchema, type JsonSchema } from "./schema.ts";

export type StandardStatus = "draft" | "published" | "archived";

export interface NodeTypeDescriptor {
  typeId: number;
  typeName: string;
  category: string;
  payloadSchema: JsonSchema | null;
  allowedChildren: string[] | null;
  isRoot: boolean;
}

export interface SpineNode {
  id: number;
  parentId: number | null;
  typeId: number;
  typeName: string;
  title: string;
  code: string | null;
  orderIndex: number;
  status: StandardStatus;
  publishedAt: string | null;
  payload: Record<string, unknown>;
}

export interface StandardRegistryData {
  types: NodeTypeDescriptor[];
  nodes: SpineNode[];
}

/** Structural row shapes from the Supabase select — keeps the loader decoupled. */
export interface NodeTypeRowLike {
  type_id: number;
  type_name: string;
  category: string;
  payload_schema: unknown;
  allowed_children: string[] | null;
  is_root: boolean;
}

export interface SpineNodeRowLike {
  curriculum_node_id: number;
  parent_node_id: number | null;
  type_id: number | null;
  title: string;
  code: string | null;
  order_index: number;
  status: string;
  published_at: string | null;
  payload: unknown;
}

/** Map a raw type row (payload_schema is `Json`) into a descriptor. */
export function buildNodeTypeDescriptor(row: NodeTypeRowLike): NodeTypeDescriptor {
  return {
    typeId: row.type_id,
    typeName: row.type_name,
    category: row.category,
    payloadSchema: parseSchema(row.payload_schema),
    allowedChildren: row.allowed_children,
    isRoot: row.is_root,
  };
}

/** Assemble the registry payload from raw `node_types` + `curriculum_nodes` rows. */
export function buildStandardRegistry(
  typeRows: NodeTypeRowLike[],
  nodeRows: SpineNodeRowLike[],
): StandardRegistryData {
  const typeById = new Map<number, NodeTypeDescriptor>();
  for (const row of typeRows) {
    const descriptor = buildNodeTypeDescriptor(row);
    typeById.set(descriptor.typeId, descriptor);
  }

  const nodes: SpineNode[] = nodeRows.map((row) => {
    const typeName = typeById.get(row.type_id ?? -1)?.typeName ?? "unknown";
    return {
      id: row.curriculum_node_id,
      parentId: row.parent_node_id,
      typeId: row.type_id ?? -1,
      typeName,
      title: row.title,
      code: row.code,
      orderIndex: row.order_index,
      status: (row.status || "draft") as StandardStatus,
      publishedAt: row.published_at,
      payload: (row.payload ?? {}) as Record<string, unknown>,
    };
  });

  return { types: [...typeById.values()], nodes };
}

// ------------------------------------------------------------
// Tree helpers
// ------------------------------------------------------------

export function childrenOf(nodes: SpineNode[], parentId: number | null): SpineNode[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export function findRootDocuments(nodes: SpineNode[], types: NodeTypeDescriptor[]): SpineNode[] {
  const rootTypeIds = new Set(types.filter((t) => t.isRoot).map((t) => t.typeId));
  return nodes.filter((node) => rootTypeIds.has(node.typeId));
}

/**
 * Whether `node`'s subtree (descendants only) contains any node of `typeName`.
 */
export function subtreeHasType(
  node: SpineNode,
  nodes: SpineNode[],
  typeName: string,
): boolean {
  return childrenOf(nodes, node.id).some(
    (child) =>
      child.typeName === typeName || subtreeHasType(child, nodes, typeName),
  );
}

/**
 * Resolve a source reference against the document. `kind: "payload"`
 * reads a dotted path on the root payload; `kind: "node_type"` checks
 * the root's descendant tree for a node of that type.
 */
export function sourceSatisfied(
  root: SpineNode,
  nodes: SpineNode[],
  payload: Record<string, unknown>,
  source: { kind?: string; path?: string; type?: string },
): boolean {
  if (source.kind === "payload" && source.path) return payloadPathPresent(payload, source.path);
  if (source.kind === "node_type" && source.type) {
    return subtreeHasType(root, nodes, source.type);
  }
  return false;
}

/** Read a dotted path (e.g. `assessment_requirements.examinations`). */
export function payloadPathPresent(
  payload: Record<string, unknown>,
  path: string,
): boolean {
  let current: unknown = payload;
  for (const segment of path.split(".")) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      return false;
    }
    current = (current as Record<string, unknown>)[segment];
    if (current === undefined || current === null) return false;
  }
  if (
    typeof current === "string" ||
    Array.isArray(current)
  ) {
    return current.length > 0;
  }
  return true;
}

// ------------------------------------------------------------
// Four-component coverage
// ------------------------------------------------------------

export interface ComponentCoverage {
  present: boolean;
  /** Human descriptions of the sources that were satisfied. */
  satisfiedBy: string[];
}

export type ComponentCoverageMap = Record<CurriculumComponentId, ComponentCoverage>;

export function emptyCoverage(): ComponentCoverageMap {
  return Object.fromEntries(
    CURRICULUM_COMPONENT_IDS.map((id) => [
      id,
      { present: false, satisfiedBy: [] },
    ]),
  ) as unknown as ComponentCoverageMap;
}

/**
 * Compute coverage of the four universal components for a standard
 * document from its own `component_manifest` — the schema-level
 * contract introduced in 2026-09-25. When the manifest is missing the
 * result is all-uncovered (the DB CHECK makes this impossible for
 * registered root types, but the guard keeps this total).
 */
export function computeComponentCoverage(
  root: SpineNode,
  nodes: SpineNode[],
  manifest: ComponentManifest | null,
): ComponentCoverageMap {
  const coverage = emptyCoverage();
  if (!manifest) return coverage;

  for (const entry of manifest.components) {
    const result = coverage[entry.id];
    if (!result) continue;
    const satisfied: string[] = [];
    for (const source of entry.sources) {
      if (sourceSatisfied(root, nodes, root.payload, source)) {
        satisfied.push(
          source.kind === "payload"
            ? `payload ${source.path}`
            : `${source.type ?? "node"} nodes`,
        );
      }
    }
    result.present = satisfied.length > 0;
    result.satisfiedBy = satisfied;
  }
  return coverage;
}

export function componentCoverageCount(coverage: ComponentCoverageMap): number {
  return CURRICULUM_COMPONENT_IDS.filter((id) => coverage[id]?.present).length;
}