"use server";

// Generic standards registry actions. Where the NCDC arm (national-
// standard.ts) is bespoke and typed, this module is schema-driven: node
// types carry their JSON Schemas as data, root documents carry a
// component_manifest, and every write is validated by the `node_payload_valid`
// CHECK. Super-admin only, mirroring the NCDC arm's RLS.

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/app/actions/national-standard";
import { toJson } from "@/lib/curriculum-spine/json";
import { emptyComponentManifest } from "@/lib/curriculum-spine/manifest";
import { defaultValue, parseSchema } from "@/lib/curriculum-spine/schema";
import type { JsonSchema } from "@/lib/curriculum-spine/schema";
import type { StandardStatus } from "@/lib/curriculum-spine/registry";
import type { SpineSupabase } from "@/app/actions/national-standard";
import type { Json } from "@/lib/supabase/database.types";

const ADMIN_CURRICULUM_PATH = "/admin/curriculum";

export type StandardRegistryActionResult = {
  success: boolean;
  id?: number;
  error?: string;
};

export interface DefineStandardTypeInput {
  typeName: string;
  payloadSchema?: Record<string, unknown>;
  allowedChildren?: string[];
  isRoot?: boolean;
}

export interface UpdateStandardTypeInput {
  typeId: number;
  payloadSchema?: Record<string, unknown> | null;
  allowedChildren?: string[] | null;
  isRoot?: boolean;
}

export interface CreateStandardDocumentInput {
  typeId: number;
  title: string;
  code: string;
}

export interface CreateStandardNodeInput {
  parentId: number;
  typeId: number;
  title: string;
  code?: string | null;
}

export interface SaveStandardNodeInput {
  nodeId: number;
  title?: string;
  code?: string | null;
  payload?: Record<string, unknown>;
}

const TYPE_NAME_PATTERN = /^[a-z][a-z0-9_]{1,49}$/;

function isObjectSchema(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>)["type"] === "object"
  );
}

// ------------------------------------------------------------
// Node types — define a standard's vocabulary
// ------------------------------------------------------------

export async function defineStandardType(
  input: DefineStandardTypeInput,
): Promise<StandardRegistryActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return { success: false, error: "Only an approved super admin can define standard types." };
  }
  const typeName = input.typeName.trim().toLowerCase();
  if (!TYPE_NAME_PATTERN.test(typeName)) {
    return {
      success: false,
      error: "Type name must be lower-case snake_case (e.g. occupation_framework).",
    };
  }
  if (input.payloadSchema !== undefined && !isObjectSchema(input.payloadSchema)) {
    return { success: false, error: "A payload schema must be a JSON object with \"type\": \"object\"." };
  }

  try {
    const { data, error } = await supabase
      .from("node_types")
      .insert({
        category: "EDUCATIONAL",
        type_name: typeName,
        payload_schema: input.payloadSchema !== undefined ? toJson(input.payloadSchema) : null,
        allowed_children: input.allowedChildren ?? null,
        is_root: input.isRoot ?? false,
      })
      .select("type_id")
      .single();
    if (error) return { success: false, error: error.message };

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return { success: true, id: data.type_id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to define the type.",
    };
  }
}

export async function updateStandardType(
  input: UpdateStandardTypeInput,
): Promise<StandardRegistryActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return { success: false, error: "Only an approved super admin can update standard types." };
  }
  if (input.payloadSchema !== undefined && input.payloadSchema !== null && !isObjectSchema(input.payloadSchema)) {
    return { success: false, error: "A payload schema must be a JSON object with \"type\": \"object\"." };
  }

  try {
    const patch: {
      payload_schema?: Json | null;
      allowed_children?: string[] | null;
      is_root?: boolean;
    } = {};
    if (input.payloadSchema !== undefined) {
      patch.payload_schema = input.payloadSchema === null ? null : toJson(input.payloadSchema);
    }
    if (input.allowedChildren !== undefined) {
      patch.allowed_children = input.allowedChildren;
    }
    if (input.isRoot !== undefined) patch.is_root = input.isRoot;
    if (Object.keys(patch).length === 0) return { success: false, error: "Nothing to update." };

    const { error } = await supabase
      .from("node_types")
      .update(patch)
      .eq("type_id", input.typeId);
    if (error) return { success: false, error: error.message };

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return { success: true, id: input.typeId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update the type.",
    };
  }
}

export async function deleteStandardType(
  typeId: number,
): Promise<StandardRegistryActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return { success: false, error: "Only an approved super admin can delete standard types." };
  }

  try {
    const { count } = await supabase
      .from("curriculum_nodes")
      .select("curriculum_node_id", { count: "exact", head: true })
      .eq("type_id", typeId);
    if ((count ?? 0) > 0) {
      return { success: false, error: "Type is in use — delete its nodes first." };
    }
    const { error } = await supabase.from("node_types").delete().eq("type_id", typeId);
    if (error) return { success: false, error: error.message };

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return { success: true, id: typeId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete the type.",
    };
  }
}

// ------------------------------------------------------------
// Documents & nodes — schema-driven payloads
// ------------------------------------------------------------

async function typeDescriptor(
  supabase: SpineSupabase,
  typeId: number,
): Promise<{ type_name: string; is_root: boolean; allowed_children: string[] | null; payload_schema: unknown } | null> {
  const { data, error } = await supabase
    .from("node_types")
    .select("type_name, is_root, allowed_children, payload_schema")
    .eq("type_id", typeId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    type_name: data.type_name,
    is_root: data.is_root,
    allowed_children: data.allowed_children ?? null,
    payload_schema: data.payload_schema ?? null,
  };
}

/** A fresh payload for `schema` (defaults + root manifest when root). */
function initialPayload(schema: JsonSchema | null, isRoot: boolean): unknown {
  const base = defaultValue(schema ?? undefined);
  const payload = (
    base && typeof base === "object" && !Array.isArray(base) ? { ...base } : {}
  ) as Record<string, unknown>;
  if (isRoot && payload.component_manifest === undefined) {
    payload.component_manifest = emptyComponentManifest();
  }
  return payload;
}

export async function createStandardDocument(
  input: CreateStandardDocumentInput,
): Promise<StandardRegistryActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return { success: false, error: "Only an approved super admin can create standard documents." };
  }
  if (!input.title.trim() || !input.code.trim()) {
    return { success: false, error: "Title and code are required." };
  }

  try {
    const descriptor = await typeDescriptor(supabase, input.typeId);
    if (!descriptor) return { success: false, error: "Node type not found." };
    if (!descriptor.is_root) {
      return { success: false, error: "Only root-capable types can own standard documents." };
    }

    const payload = initialPayload(parseSchema(descriptor.payload_schema), true);

    const { data, error } = await supabase
      .from("curriculum_nodes")
      .insert({
        title: input.title.trim(),
        code: input.code.trim(),
        type_id: input.typeId,
        order_index: 0,
        status: "draft",
        payload: toJson(payload),
      })
      .select("curriculum_node_id")
      .single();
    if (error) return { success: false, error: error.message };

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return { success: true, id: data.curriculum_node_id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create the document.",
    };
  }
}

export async function createStandardNode(
  input: CreateStandardNodeInput,
): Promise<StandardRegistryActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return { success: false, error: "Only an approved super admin can create spine nodes." };
  }
  if (!input.title.trim()) return { success: false, error: "Title is required." };

  try {
    const child = await typeDescriptor(supabase, input.typeId);
    if (!child) return { success: false, error: "Child node type not found." };
    if (child.is_root) return { success: false, error: "Root-capable types cannot be attached as children." };

    const { data: parentRow, error: parentError } = await supabase
      .from("curriculum_nodes")
      .select("type_id")
      .eq("curriculum_node_id", input.parentId)
      .maybeSingle();
    if (parentError) return { success: false, error: parentError.message };
    if (!parentRow) return { success: false, error: "Parent node not found." };
    if (parentRow.type_id === null) return { success: false, error: "Parent node has no type." };

    const parent = await typeDescriptor(supabase, parentRow.type_id);
    if (parent && parent.allowed_children !== null && !parent.allowed_children.includes(child.type_name)) {
      return {
        success: false,
        error: `Type "${child.type_name}" cannot attach under "${parent.type_name}".`,
      };
    }

    const { data: lastChild } = await supabase
      .from("curriculum_nodes")
      .select("order_index")
      .eq("parent_node_id", input.parentId)
      .order("order_index", { ascending: false })
      .limit(1);
    const orderIndex = (lastChild?.[0]?.order_index ?? 0) + 1;

    const payload = initialPayload(parseSchema(child.payload_schema), false);
    const { data, error } = await supabase
      .from("curriculum_nodes")
      .insert({
        title: input.title.trim(),
        code: input.code?.trim() || null,
        type_id: input.typeId,
        parent_node_id: input.parentId,
        order_index: orderIndex,
        status: "draft",
        payload: toJson(payload),
      })
      .select("curriculum_node_id")
      .single();
    if (error) return { success: false, error: error.message };

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return { success: true, id: data.curriculum_node_id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create the node.",
    };
  }
}

export async function saveStandardNode(
  input: SaveStandardNodeInput,
): Promise<StandardRegistryActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return { success: false, error: "Only an approved super admin can save spine nodes." };
  }

  try {
    const { data: current, error: fetchError } = await supabase
      .from("curriculum_nodes")
      .select("type_id, payload")
      .eq("curriculum_node_id", input.nodeId)
      .maybeSingle();
    if (fetchError) return { success: false, error: fetchError.message };
    if (!current) return { success: false, error: "Node not found." };
    if (current.type_id === null) return { success: false, error: "Node has no type." };

    const descriptor = await typeDescriptor(supabase, current.type_id);
    const existingPayload = (current.payload ?? {}) as Record<string, unknown>;

    const patch: { title?: string; code?: string | null; payload?: Json } = {};
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.code !== undefined) patch.code = input.code?.trim() || null;

    if (input.payload !== undefined) {
      // Merge so undeclared/additional keys survive; a root's
      // component_manifest is always preserved unless explicitly replaced.
      let next = toJson({ ...existingPayload, ...input.payload }) as unknown as Record<string, unknown>;
      if (descriptor?.is_root && !("component_manifest" in (input.payload ?? {}))) {
        next = { ...next, component_manifest: existingPayload.component_manifest ?? emptyComponentManifest() };
      }
      patch.payload = toJson(next);
    }
    if (Object.keys(patch).length === 0) return { success: false, error: "Nothing to save." };

    const { error } = await supabase
      .from("curriculum_nodes")
      .update(patch)
      .eq("curriculum_node_id", input.nodeId);
    if (error) return { success: false, error: error.message };

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return { success: true, id: input.nodeId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save the node.",
    };
  }
}

export async function setStandardNodeStatus(
  nodeId: number,
  status: StandardStatus,
): Promise<StandardRegistryActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return { success: false, error: "Only an approved super admin can change node status." };
  }

  try {
    const { error } = await supabase
      .from("curriculum_nodes")
      .update({
        status,
        published_at: status === "published" ? new Date().toISOString() : undefined,
      })
      .eq("curriculum_node_id", nodeId);
    if (error) return { success: false, error: error.message };

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return { success: true, id: nodeId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update the status.",
    };
  }
}

async function deleteSubtree(supabase: SpineSupabase, nodeId: number): Promise<StandardRegistryActionResult> {
  const { data: children } = await supabase
    .from("curriculum_nodes")
    .select("curriculum_node_id")
    .eq("parent_node_id", nodeId);
  if (children) {
    for (const child of children) {
      const result = await deleteSubtree(supabase, child.curriculum_node_id);
      if (!result.success) return result;
    }
  }
  const { error } = await supabase.from("curriculum_nodes").delete().eq("curriculum_node_id", nodeId);
  if (error) return { success: false, error: error.message };
  return { success: true, id: nodeId };
}

export async function deleteStandardNode(nodeId: number): Promise<StandardRegistryActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return { success: false, error: "Only an approved super admin can delete spine nodes." };
  }

  try {
    const result = await deleteSubtree(supabase, nodeId);
    if (!result.success) return result;

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete the node.",
    };
  }
}