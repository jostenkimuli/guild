"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type AdminActionState = {
  success: boolean;
  error?: string;
  id?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REQUIREMENT_LEVELS = ["mandatory", "required_outcome", "flexible"] as const;
const RULE_GROUPS = ["language", "timetable", "assessment", "teaching"] as const;
const NODE_TYPES = ["theme", "sub_theme", "competence"] as const;

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string, max = 2000): string | null {
  const value = text(formData, name).slice(0, max);
  return value || null;
}

function intField(formData: FormData, name: string): number | null {
  const raw = text(formData, name);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

/** Every action here re-checks platform-admin status; RLS is the backstop. */
async function authorizePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  const isPlatformAdmin =
    (profile?.role === "super_admin" || profile?.role === "program_admin") &&
    profile?.status === "approved";
  if (!isPlatformAdmin) {
    return { error: "Only a platform admin can edit the national curriculum." } as const;
  }
  return { supabase, user } as const;
}

function refresh(curriculumId?: string) {
  revalidatePath("/admin/curricula");
  if (curriculumId) revalidatePath(`/admin/curricula/${curriculumId}`);
}

// ------------------------------------------------------------
// National curriculum (the framework itself)
// ------------------------------------------------------------

export async function saveNationalCurriculum(
  _: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = text(formData, "id");
  const slug = text(formData, "slug").toLowerCase();
  const title = text(formData, "title");
  const authority = text(formData, "authority");
  const cycleLabel = text(formData, "cycle_label");
  const classLevel = text(formData, "class_level");
  const ecosystemType = text(
    formData,
    "ecosystem_type",
  ) as Database["public"]["Enums"]["ecosystem_type"];
  const edition = text(formData, "edition");
  const sourceUrl = optionalText(formData, "source_url", 500);
  const orientationRaw = text(formData, "orientation_terms");
  const orientationTerms = orientationRaw
    ? orientationRaw
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 3)
    : [];

  if (!/^[a-z0-9-]{2,80}$/.test(slug)) {
    return { success: false, error: "Slug must be lowercase letters, numbers and dashes." };
  }
  if (!title || title.length > 300) {
    return { success: false, error: "Title is required (up to 300 characters)." };
  }
  if (!authority || !cycleLabel || !classLevel || !edition) {
    return { success: false, error: "Authority, cycle label, class level and edition are all required." };
  }
  const ecosystemTypes: Database["public"]["Enums"]["ecosystem_type"][] = [
    "nursery_school",
    "primary_school",
    "secondary_school",
    "university",
  ];
  if (!ecosystemTypes.includes(ecosystemType)) {
    return { success: false, error: "Choose a valid ecosystem type." };
  }
  if (sourceUrl && !/^https?:\/\/.+/.test(sourceUrl)) {
    return { success: false, error: "Source URL must start with http:// or https://." };
  }

  const payload = {
    slug,
    title,
    authority,
    cycle_label: cycleLabel,
    class_level: classLevel,
    ecosystem_type: ecosystemType,
    edition,
    source_url: sourceUrl,
    orientation_terms: orientationTerms,
  };

  if (id) {
    if (!UUID_RE.test(id)) return { success: false, error: "Invalid curriculum." };
    const { error } = await supabase.from("national_curricula").update(payload).eq("id", id);
    if (error) return { success: false, error: error.code === "23505" ? "That slug is already in use." : error.message };
    refresh(id);
    return { success: true, id };
  }

  const { data, error } = await supabase
    .from("national_curricula")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { success: false, error: error.code === "23505" ? "That slug is already in use." : error.message };
  refresh();
  return { success: true, id: data.id };
}

// ------------------------------------------------------------
// Strands
// ------------------------------------------------------------

export async function saveStrand(
  _: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  const key = text(formData, "key").toLowerCase();
  const name = text(formData, "name");
  const isThematic = formData.get("is_thematic") === "on";
  const sortOrder = intField(formData, "sort_order") ?? 0;

  if (!UUID_RE.test(curriculumId)) return { success: false, error: "Curriculum is required." };
  if (!/^[a-z0-9_]{2,40}$/.test(key)) {
    return { success: false, error: "Key must be lowercase letters, numbers and underscores." };
  }
  if (!name || name.length > 200) return { success: false, error: "Name is required." };

  const payload = {
    national_curriculum_id: curriculumId,
    key,
    name,
    is_thematic: isThematic,
    sort_order: sortOrder,
  };

  if (id) {
    if (!UUID_RE.test(id)) return { success: false, error: "Invalid strand." };
    const { error } = await supabase.from("national_strands").update(payload).eq("id", id);
    if (error) return { success: false, error: error.code === "23505" ? "That key is already used in this curriculum." : error.message };
  } else {
    const { error } = await supabase.from("national_strands").insert(payload);
    if (error) return { success: false, error: error.code === "23505" ? "That key is already used in this curriculum." : error.message };
  }
  refresh(curriculumId);
  return { success: true };
}

export async function deleteStrand(formData: FormData): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;
  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  if (!UUID_RE.test(id)) return { success: false, error: "Invalid strand." };
  const { error } = await supabase.from("national_strands").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  refresh(curriculumId);
  return { success: true };
}

// ------------------------------------------------------------
// Aims
// ------------------------------------------------------------

export async function saveAim(
  _: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  const kind = text(formData, "kind");
  const position = intField(formData, "position");
  const description = text(formData, "description");

  if (!UUID_RE.test(curriculumId)) return { success: false, error: "Curriculum is required." };
  if (kind !== "national" && kind !== "primary") return { success: false, error: "Choose national or primary." };
  if (!position || position < 1) return { success: false, error: "Position must be a positive number." };
  if (!description) return { success: false, error: "Description is required." };

  const payload = { national_curriculum_id: curriculumId, kind, position, description };

  if (id) {
    if (!UUID_RE.test(id)) return { success: false, error: "Invalid aim." };
    const { error } = await supabase.from("national_aims").update(payload).eq("id", id);
    if (error) return { success: false, error: error.code === "23505" ? "That position is already used for this kind." : error.message };
  } else {
    const { error } = await supabase.from("national_aims").insert(payload);
    if (error) return { success: false, error: error.code === "23505" ? "That position is already used for this kind." : error.message };
  }
  refresh(curriculumId);
  return { success: true };
}

export async function deleteAim(formData: FormData): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;
  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  if (!UUID_RE.test(id)) return { success: false, error: "Invalid aim." };
  const { error } = await supabase.from("national_aims").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  refresh(curriculumId);
  return { success: true };
}

// ------------------------------------------------------------
// Period allocations
// ------------------------------------------------------------

export async function savePeriodAllocation(
  _: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  const key = text(formData, "key").toLowerCase();
  const label = text(formData, "label");
  const groupLabel = optionalText(formData, "group_label", 100);
  const periods = intField(formData, "periods");
  const blockSize = intField(formData, "block_size") ?? 1;
  const followsKey = optionalText(formData, "follows_key", 40);
  const note = optionalText(formData, "note", 500);
  const sortOrder = intField(formData, "sort_order") ?? 0;

  if (!UUID_RE.test(curriculumId)) return { success: false, error: "Curriculum is required." };
  if (!/^[a-z0-9_]{2,40}$/.test(key)) {
    return { success: false, error: "Key must be lowercase letters, numbers and underscores." };
  }
  if (!label) return { success: false, error: "Label is required." };
  if (periods === null || periods < 0) return { success: false, error: "Periods must be zero or more." };
  if (blockSize < 1) return { success: false, error: "Block size must be at least 1." };

  const payload = {
    national_curriculum_id: curriculumId,
    key,
    label,
    group_label: groupLabel,
    periods,
    block_size: blockSize,
    follows_key: followsKey,
    note,
    sort_order: sortOrder,
  };

  if (id) {
    if (!UUID_RE.test(id)) return { success: false, error: "Invalid allocation." };
    const { error } = await supabase.from("national_period_allocations").update(payload).eq("id", id);
    if (error) return { success: false, error: error.code === "23505" ? "That key is already used in this curriculum." : error.message };
  } else {
    const { error } = await supabase.from("national_period_allocations").insert(payload);
    if (error) return { success: false, error: error.code === "23505" ? "That key is already used in this curriculum." : error.message };
  }
  refresh(curriculumId);
  return { success: true };
}

export async function deletePeriodAllocation(formData: FormData): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;
  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  if (!UUID_RE.test(id)) return { success: false, error: "Invalid allocation." };
  const { error } = await supabase.from("national_period_allocations").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  refresh(curriculumId);
  return { success: true };
}

// ------------------------------------------------------------
// Rules
// ------------------------------------------------------------

export async function saveRule(
  _: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  const ruleGroup = text(formData, "rule_group");
  const description = text(formData, "description");
  const requirementLevel = text(formData, "requirement_level");
  const sortOrder = intField(formData, "sort_order") ?? 0;

  if (!UUID_RE.test(curriculumId)) return { success: false, error: "Curriculum is required." };
  if (!(RULE_GROUPS as readonly string[]).includes(ruleGroup)) {
    return { success: false, error: "Choose a valid rule group." };
  }
  if (!description) return { success: false, error: "Description is required." };
  if (!(REQUIREMENT_LEVELS as readonly string[]).includes(requirementLevel)) {
    return { success: false, error: "Choose a valid requirement level." };
  }

  const payload = {
    national_curriculum_id: curriculumId,
    rule_group: ruleGroup as Database["public"]["Tables"]["national_rules"]["Row"]["rule_group"],
    description,
    requirement_level:
      requirementLevel as Database["public"]["Enums"]["requirement_level"],
    sort_order: sortOrder,
  };

  if (id) {
    if (!UUID_RE.test(id)) return { success: false, error: "Invalid rule." };
    const { error } = await supabase.from("national_rules").update(payload).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("national_rules").insert(payload);
    if (error) return { success: false, error: error.message };
  }
  refresh(curriculumId);
  return { success: true };
}

export async function deleteRule(formData: FormData): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;
  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  if (!UUID_RE.test(id)) return { success: false, error: "Invalid rule." };
  const { error } = await supabase.from("national_rules").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  refresh(curriculumId);
  return { success: true };
}

// ------------------------------------------------------------
// Area units (subjects that run on their own schedule, e.g. RE, PE)
// ------------------------------------------------------------

export async function saveAreaUnit(
  _: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  const strandId = text(formData, "strand_id");
  const termNo = intField(formData, "term_no");
  const weeksLabel = text(formData, "weeks_label");
  const title = text(formData, "title");
  const learningOutcome = optionalText(formData, "learning_outcome", 1000);
  const sortOrder = intField(formData, "sort_order") ?? 0;

  if (!UUID_RE.test(strandId)) return { success: false, error: "Choose a learning area." };
  if (!termNo || termNo < 1 || termNo > 3) return { success: false, error: "Term must be 1, 2 or 3." };
  if (!weeksLabel || !title) return { success: false, error: "Weeks label and title are required." };

  const payload = {
    strand_id: strandId,
    term_no: termNo,
    weeks_label: weeksLabel,
    title,
    learning_outcome: learningOutcome,
    sort_order: sortOrder,
  };

  if (id) {
    if (!UUID_RE.test(id)) return { success: false, error: "Invalid area unit." };
    const { error } = await supabase.from("national_area_units").update(payload).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("national_area_units").insert(payload);
    if (error) return { success: false, error: error.message };
  }
  refresh(curriculumId);
  return { success: true };
}

export async function deleteAreaUnit(formData: FormData): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;
  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  if (!UUID_RE.test(id)) return { success: false, error: "Invalid area unit." };
  const { error } = await supabase.from("national_area_units").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  refresh(curriculumId);
  return { success: true };
}

// ------------------------------------------------------------
// Curriculum tree nodes: theme / sub_theme / competence, one
// generic table -- see 20260922000000_flexible_curriculum_nodes.sql.
// ------------------------------------------------------------

export async function saveNode(
  _: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  const nodeType = text(formData, "node_type");
  const parentId = text(formData, "parent_id");
  const title = text(formData, "title");
  const description = text(formData, "description");
  const sequenceOrder = intField(formData, "sequence_order") ?? 0;

  if (!UUID_RE.test(curriculumId)) return { success: false, error: "Curriculum is required." };
  if (!(NODE_TYPES as readonly string[]).includes(nodeType)) {
    return { success: false, error: "Unknown node type." };
  }
  if (!title || title.length > 500) return { success: false, error: "Title is required (up to 500 characters)." };
  if (description.length > 4000) return { success: false, error: "Description must be 4000 characters or fewer." };

  let attributes: Record<string, unknown> = {};
  let strandId: string | null = null;
  let requirementLevel: string | null = null;

  if (nodeType === "theme") {
    const themeNo = intField(formData, "theme_no");
    const termNo = intField(formData, "term_no");
    if (!themeNo || themeNo < 1) return { success: false, error: "Theme number must be a positive number." };
    if (!termNo || termNo < 1 || termNo > 3) return { success: false, error: "Term must be 1, 2 or 3." };
    attributes = { theme_no: themeNo, term_no: termNo };
  } else if (nodeType === "sub_theme") {
    if (!UUID_RE.test(parentId)) return { success: false, error: "Choose the theme this sub-theme belongs to." };
    const { data: parent } = await supabase
      .from("curriculum_nodes")
      .select("id, node_type, national_curriculum_id")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent || parent.node_type !== "theme" || parent.national_curriculum_id !== curriculumId) {
      return { success: false, error: "The parent theme was not found in this curriculum." };
    }
    const code = text(formData, "code");
    const position = intField(formData, "position");
    if (!code || code.length > 20) return { success: false, error: "Code is required (e.g. 1.1)." };
    if (!position || position < 1) return { success: false, error: "Position must be a positive number." };
    attributes = { code, position };
  } else {
    // competence
    if (!UUID_RE.test(parentId)) return { success: false, error: "Choose the sub-theme this competence belongs to." };
    const { data: parent } = await supabase
      .from("curriculum_nodes")
      .select("id, node_type, national_curriculum_id")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent || parent.node_type !== "sub_theme" || parent.national_curriculum_id !== curriculumId) {
      return { success: false, error: "The parent sub-theme was not found in this curriculum." };
    }
    strandId = text(formData, "strand_id");
    if (!UUID_RE.test(strandId)) return { success: false, error: "Choose a learning area (strand)." };
    const { data: strand } = await supabase
      .from("national_strands")
      .select("id")
      .eq("id", strandId)
      .eq("national_curriculum_id", curriculumId)
      .maybeSingle();
    if (!strand) return { success: false, error: "That learning area does not belong to this curriculum." };
    requirementLevel = text(formData, "requirement_level");
    if (!(REQUIREMENT_LEVELS as readonly string[]).includes(requirementLevel)) {
      return { success: false, error: "Choose a valid requirement level." };
    }
  }

  const payload = {
    national_curriculum_id: curriculumId,
    parent_id: nodeType === "theme" ? null : parentId,
    node_type: nodeType,
    strand_id: strandId,
    title,
    description,
    sequence_order: sequenceOrder,
    requirement_level:
      requirementLevel as Database["public"]["Enums"]["requirement_level"] | null,
    attributes: attributes as unknown as Database["public"]["Tables"]["curriculum_nodes"]["Insert"]["attributes"],
  };

  if (id) {
    if (!UUID_RE.test(id)) return { success: false, error: "Invalid node." };
    const { error } = await supabase.from("curriculum_nodes").update(payload).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("curriculum_nodes").insert(payload);
    if (error) return { success: false, error: error.message };
  }
  refresh(curriculumId);
  return { success: true };
}

export async function deleteNode(formData: FormData): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;
  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  if (!UUID_RE.test(id)) return { success: false, error: "Invalid node." };
  // Deleting a theme or sub-theme cascades to its children (sub-themes /
  // competences) -- the same "delete the branch" behaviour a real tree needs.
  const { error } = await supabase.from("curriculum_nodes").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  refresh(curriculumId);
  return { success: true };
}

// ------------------------------------------------------------
// Assessment guidelines (per theme node, per strand)
// ------------------------------------------------------------

export async function saveAssessmentGuideline(
  _: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  const themeNodeId = text(formData, "theme_node_id");
  const strandId = text(formData, "strand_id");
  const description = text(formData, "description");
  const sortOrder = intField(formData, "sort_order") ?? 0;

  if (!UUID_RE.test(themeNodeId)) return { success: false, error: "Theme is required." };
  if (!UUID_RE.test(strandId)) return { success: false, error: "Learning area is required." };
  if (!description) return { success: false, error: "Description is required." };

  const payload = { theme_node_id: themeNodeId, strand_id: strandId, description, sort_order: sortOrder };

  if (id) {
    if (!UUID_RE.test(id)) return { success: false, error: "Invalid guideline." };
    const { error } = await supabase.from("national_assessment_guidelines").update(payload).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("national_assessment_guidelines").insert(payload);
    if (error) return { success: false, error: error.message };
  }
  refresh(curriculumId);
  return { success: true };
}

export async function deleteAssessmentGuideline(formData: FormData): Promise<AdminActionState> {
  const auth = await authorizePlatformAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;
  const id = text(formData, "id");
  const curriculumId = text(formData, "national_curriculum_id");
  if (!UUID_RE.test(id)) return { success: false, error: "Invalid guideline." };
  const { error } = await supabase.from("national_assessment_guidelines").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  refresh(curriculumId);
  return { success: true };
}
