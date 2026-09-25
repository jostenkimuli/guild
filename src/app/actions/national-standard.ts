"use server";

import { revalidatePath } from "next/cache";

import { loadNationalStandardDataset } from "@/lib/curriculum-spine";
import { toJson } from "@/lib/curriculum-spine/json";
import { ncdcComponentManifest } from "@/lib/curriculum-spine/manifest";
import {
  createNationalTemplateDraft,
  type MockNationalTemplate,
  type MockTemplateStatus,
} from "@/lib/playground/mock";
import { spineSlug } from "@/lib/playground/mock-data-source";
import {
  applyThematicDraftIdentity,
  applyThematicManualEntry,
  createThematicCurriculumDraft,
  type MockThematicCurriculum,
  type ThematicDraftIdentity,
  type ThematicManualEntry,
} from "@/lib/playground/thematic-curriculum";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { OnboardingCreatePayload } from "@/components/admin/curriculum/document-onboarding-dialog";

export type SpineSupabase = Awaited<ReturnType<typeof createClient>>;

const ADMIN_CURRICULUM_PATH = "/admin/curriculum";

export type NationalTemplateMetadataInput = {
  name: string;
  code: string;
  country: string;
  year: number;
  version: string;
};

export type NationalStandardActionResult = {
  success: boolean;
  id?: string;
  error?: string;
};

export async function requireSuperAdmin(): Promise<SpineSupabase | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "super_admin" || profile?.status !== "approved") return null;
  return supabase;
}

async function resolveTypeIds(supabase: SpineSupabase): Promise<Map<string, number>> {
  const required = [
    "curriculum_template",
    "subject",
    "level",
    "theme",
    "sub_theme",
    "learning_area",
  ];
  const { data, error } = await supabase.from("node_types").select("type_id, type_name");
  if (error || !data) {
    throw new Error(`Failed to load node types: ${error?.message ?? "no rows returned"}`);
  }
  const map = new Map<string, number>();
  for (const row of data) map.set(row.type_name, row.type_id);
  for (const name of required) {
    if (!map.has(name)) throw new Error(`Required node_type "${name}" is missing.`);
  }
  return map;
}

function templatePayloadFields(template: MockNationalTemplate): Json {
  return toJson({
    structure: "subject",
    component_manifest: ncdcComponentManifest("subject"),
    code: template.code,
    country: template.country,
    year: template.year,
    version: template.version,
    national_aims: template.national_aims,
    aims_of_primary_education: template.aims_of_primary_education,
    values_text: template.values_text,
    generic_skills: template.generic_skills,
    cross_cutting_issues: template.cross_cutting_issues,
    pedagogy_text: template.pedagogy_text,
    assessment_requirements: template.assessment_requirements,
    time_allocation: template.time_allocation,
    approved_materials: template.approved_materials,
    created_by: template.created_by,
  });
}

function thematicPayloadFields(doc: MockThematicCurriculum): Json {
  return toJson({
    structure: "thematic",
    component_manifest: ncdcComponentManifest("thematic"),
    code: doc.code,
    country: doc.country,
    year: null,
    version: doc.version,
    level: doc.level,
    issuer: doc.issuer,
    year_note: doc.year_note,
    edition: doc.edition ?? null,
    isbn: doc.isbn,
    document_note: doc.document_note,
    national_aims: doc.national_aims,
    aims_of_primary_education: doc.aims_of_primary_education,
    approach: doc.approach,
    medium_of_instruction: doc.medium_of_instruction,
    period_allocation: doc.period_allocation,
    timetable_notes: doc.timetable_notes,
    learning_resources: doc.learning_resources,
    assessment_approach: doc.assessment_approach,
    cycles: doc.cycles,
    created_by: "super_admin",
  });
}

async function insertThematicChildren(
  supabase: SpineSupabase,
  types: Map<string, number>,
  rootNodeId: number,
  doc: MockThematicCurriculum,
): Promise<void> {
  const themeTypeId = types.get("theme")!;
  const subThemeTypeId = types.get("sub_theme")!;
  const areaTypeId = types.get("learning_area")!;

  for (const [themeIndex, theme] of doc.themes.entries()) {
    const { data: themeRow, error } = await supabase
      .from("curriculum_nodes")
      .insert({
        title: theme.title,
        code: theme.code,
        type_id: themeTypeId,
        parent_node_id: rootNodeId,
        order_index: themeIndex + 1,
        payload: toJson({
          code: theme.code,
          term: theme.term ?? null,
          weeks: theme.weeks ?? null,
          learning_outcome: theme.learning_outcome ?? null,
          assessment_guidelines: theme.assessment_guidelines ?? [],
          fidelity: theme.fidelity,
          note: theme.note ?? null,
        }),
      })
      .select("curriculum_node_id")
      .single();
    if (error) throw new Error(error.message);

    for (const [subIndex, sub] of theme.sub_themes.entries()) {
      const { error: subError } = await supabase.from("curriculum_nodes").insert({
        title: sub.title,
        code: sub.code,
        type_id: subThemeTypeId,
        parent_node_id: themeRow.curriculum_node_id,
        order_index: subIndex + 1,
        payload: toJson({ code: sub.code, content: sub.content, blocks: sub.blocks }),
      });
      if (subError) throw new Error(subError.message);
    }
  }

  for (const [areaIndex, area] of doc.learning_areas.entries()) {
    const { error: areaError } = await supabase.from("curriculum_nodes").insert({
      title: area.title,
      code: area.code,
      type_id: areaTypeId,
      parent_node_id: rootNodeId,
      order_index: areaIndex + 1,
      payload: toJson({
        code: area.code,
        outcome: area.outcome ?? null,
        organisation: area.organisation,
        notes: area.notes ?? [],
        fidelity: area.fidelity,
      }),
    });
    if (areaError) throw new Error(areaError.message);
  }
}

// ------------------------------------------------------------
// Create — document onboarding wizard (subject template or
// thematic curriculum)
// ------------------------------------------------------------

export async function createNationalStandard(
  payload: OnboardingCreatePayload,
): Promise<NationalStandardActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return {
      success: false,
      error: "Only an approved super admin can create standard documents.",
    };
  }

  try {
    const types = await resolveTypeIds(supabase);
    const templateTypeId = types.get("curriculum_template")!;

    if (payload.structureType === "thematic") {
      const level = payload.levels[0] ?? "P1";
      const draft = createThematicCurriculumDraft({
        level,
        name: payload.officialTitle,
        edition: payload.edition,
        year: payload.year,
        note:
          payload.entryMode === "manual"
            ? "New thematic curriculum by super admin — captured manually in the onboarding wizard (no PDF transcription)."
            : payload.note ??
              "New thematic curriculum by super admin — PDF not yet transcribed.",
      });
      const doc = payload.entry ? applyThematicManualEntry(draft, payload.entry) : draft;

      const { data: root, error: rootError } = await supabase
        .from("curriculum_nodes")
        .insert({
          title: doc.name,
          code: doc.code,
          type_id: templateTypeId,
          order_index: 0,
          status: "draft",
          payload: thematicPayloadFields(doc),
        })
        .select("curriculum_node_id")
        .single();
      if (rootError) return { success: false, error: rootError.message };

      await insertThematicChildren(supabase, types, root.curriculum_node_id, doc);

      revalidatePath(ADMIN_CURRICULUM_PATH);
      return { success: true, id: `thematic-${spineSlug(doc.code)}` };
    }

    const draft = createNationalTemplateDraft({
      name: payload.officialTitle,
      code: payload.code,
      country: payload.country,
      issuer: payload.issuer,
      year: payload.year,
      levels: payload.levels,
    });

    const { data: root, error: rootError } = await supabase
      .from("curriculum_nodes")
      .insert({
        title: draft.name,
        code: draft.code,
        type_id: templateTypeId,
        order_index: 0,
        status: "draft",
        payload: templatePayloadFields(draft),
      })
      .select("curriculum_node_id")
      .single();
    if (rootError) return { success: false, error: rootError.message };

    const levelTypeId = types.get("level")!;
    const orderedLevels = [...new Set(payload.levels)].sort();
    for (let i = 0; i < orderedLevels.length; i += 1) {
      const levelName = orderedLevels[i];
      const { error: levelError } = await supabase.from("curriculum_nodes").insert({
        title: levelName,
        code: levelName,
        type_id: levelTypeId,
        parent_node_id: root.curriculum_node_id,
        order_index: i + 1,
        payload: { code: levelName, sequence: i + 1 },
      });
      if (levelError) return { success: false, error: levelError.message };
    }

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return { success: true, id: `nat-${spineSlug(draft.code)}` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create the document.",
    };
  }
}

// ------------------------------------------------------------
// Update — template metadata (TemplateDetail edit dialog)
// ------------------------------------------------------------

export async function updateTemplateMetadata(
  code: string,
  input: NationalTemplateMetadataInput,
): Promise<NationalStandardActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return {
      success: false,
      error: "Only an approved super admin can update a national template.",
    };
  }

  try {
    const types = await resolveTypeIds(supabase);
    const templateTypeId = types.get("curriculum_template")!;

    const { data: root, error: fetchError } = await supabase
      .from("curriculum_nodes")
      .select("curriculum_node_id, payload")
      .eq("type_id", templateTypeId)
      .eq("code", code)
      .maybeSingle();
    if (fetchError) return { success: false, error: fetchError.message };
    if (!root) return { success: false, error: `National template "${code}" not found.` };

    const existing = (root.payload ?? {}) as Record<string, unknown>;
    const { error: updateError } = await supabase
      .from("curriculum_nodes")
      .update({
        title: input.name,
        code: input.code,
        payload: toJson({
          ...existing,
          code: input.code,
          country: input.country,
          year: input.year,
          version: input.version,
        }),
      })
      .eq("curriculum_node_id", root.curriculum_node_id);
    if (updateError) return { success: false, error: updateError.message };

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update the template.",
    };
  }
}

// ------------------------------------------------------------
// Status — publish / archive a root document (either arm)
// ------------------------------------------------------------

export async function setTemplateStatus(
  code: string,
  status: MockTemplateStatus,
): Promise<NationalStandardActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return {
      success: false,
      error: "Only an approved super admin can change document status.",
    };
  }

  try {
    const types = await resolveTypeIds(supabase);
    const templateTypeId = types.get("curriculum_template")!;

    const { data: root, error: fetchError } = await supabase
      .from("curriculum_nodes")
      .select("curriculum_node_id")
      .eq("type_id", templateTypeId)
      .eq("code", code)
      .maybeSingle();
    if (fetchError) return { success: false, error: fetchError.message };
    if (!root) return { success: false, error: `Standard document "${code}" not found.` };

    const { error: updateError } = await supabase
      .from("curriculum_nodes")
      .update({
        status,
        published_at: status === "published" ? new Date().toISOString() : undefined,
      })
      .eq("curriculum_node_id", root.curriculum_node_id);
    if (updateError) return { success: false, error: updateError.message };

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update the status.",
    };
  }
}

// ------------------------------------------------------------
// Update — thematic curriculum (ThematicDraftEditor save)
// ------------------------------------------------------------

export async function saveThematicCurriculum(
  code: string,
  identity: ThematicDraftIdentity,
  entry: ThematicManualEntry,
): Promise<NationalStandardActionResult> {
  const supabase = await requireSuperAdmin();
  if (!supabase) {
    return {
      success: false,
      error: "Only an approved super admin can save the thematic curriculum.",
    };
  }

  const dataset = await loadNationalStandardDataset();
  const current = dataset.thematicCurricula.find((doc) => doc.code === code);
  if (!current) {
    return { success: false, error: `Thematic curriculum "${code}" not found.` };
  }

  const updated = applyThematicManualEntry(applyThematicDraftIdentity(current, identity), entry);

  try {
    const types = await resolveTypeIds(supabase);
    const templateTypeId = types.get("curriculum_template")!;
    const themeTypeId = types.get("theme")!;
    const areaTypeId = types.get("learning_area")!;

    const { data: root, error: rootError } = await supabase
      .from("curriculum_nodes")
      .select("curriculum_node_id")
      .eq("type_id", templateTypeId)
      .eq("code", code)
      .maybeSingle();
    if (rootError) return { success: false, error: rootError.message };
    if (!root) return { success: false, error: `Thematic curriculum "${code}" not found.` };

    const { data: themes, error: themesError } = await supabase
      .from("curriculum_nodes")
      .select("curriculum_node_id")
      .eq("parent_node_id", root.curriculum_node_id)
      .eq("type_id", themeTypeId);
    if (themesError) return { success: false, error: themesError.message };

    const themeIds = (themes ?? []).map((theme) => theme.curriculum_node_id);
    if (themeIds.length > 0) {
      const { error: subError } = await supabase
        .from("curriculum_nodes")
        .delete()
        .in("parent_node_id", themeIds);
      if (subError) return { success: false, error: subError.message };

      const { error: themeError } = await supabase
        .from("curriculum_nodes")
        .delete()
        .in("curriculum_node_id", themeIds);
      if (themeError) return { success: false, error: themeError.message };
    }

    const { error: areaError } = await supabase
      .from("curriculum_nodes")
      .delete()
      .eq("parent_node_id", root.curriculum_node_id)
      .eq("type_id", areaTypeId);
    if (areaError) return { success: false, error: areaError.message };

    const { error: updateError } = await supabase
      .from("curriculum_nodes")
      .update({
        title: updated.name,
        code: updated.code,
        payload: thematicPayloadFields(updated),
      })
      .eq("curriculum_node_id", root.curriculum_node_id);
    if (updateError) return { success: false, error: updateError.message };

    await insertThematicChildren(supabase, types, root.curriculum_node_id, updated);

    revalidatePath(ADMIN_CURRICULUM_PATH);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save the thematic curriculum.",
    };
  }
}