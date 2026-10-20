"use server";

import { revalidatePath } from "next/cache";

import { findDecision, validateDecision } from "@/lib/curriculum/decisions";
import { DAYS, validateTimetable } from "@/lib/curriculum/timetable-rules";
import type { TimetableSlot } from "@/lib/curriculum/timetable-rules";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ImplementationActionState = {
  success: boolean;
  error?: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NOTE_MAX = 4000;
const MAX_PERIODS_PER_DAY = 12;

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function validDate(value: string): boolean {
  return DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Every server function is reachable by a direct POST, so each action
 * re-checks that the caller is the owner of the school it changes. Row level
 * security is the second gate.
 */
async function authorizeOwner(ecosystemId: string) {
  if (!UUID_RE.test(ecosystemId)) return { error: "School is required." } as const;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." } as const;

  const { data: isOwner } = await supabase.rpc("is_ecosystem_owner", {
    p_ecosystem_id: ecosystemId,
  });
  if (!isOwner) {
    return { error: "Only the school owner can change the school's curriculum plan." } as const;
  }

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("slug, type")
    .eq("id", ecosystemId)
    .maybeSingle();
  if (!ecosystem) return { error: "School not found." } as const;

  return { supabase, user, ecosystem } as const;
}

function refresh(slug: string) {
  revalidatePath(`/ecosystem/${slug}/curriculum`);
  revalidatePath(`/ecosystem/${slug}/implementation`);
}

// ------------------------------------------------------------
// Cycle 1: adopt a national curriculum for the school
// ------------------------------------------------------------

export async function adoptNationalCurriculum(
  _: ImplementationActionState,
  formData: FormData,
): Promise<ImplementationActionState> {
  const curriculumId = text(formData, "national_curriculum_id");
  if (!UUID_RE.test(curriculumId)) return { success: false, error: "Curriculum is required." };

  const auth = await authorizeOwner(text(formData, "ecosystem_id"));
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase, user, ecosystem } = auth;

  const { data: curriculum } = await supabase
    .from("national_curricula")
    .select("ecosystem_type")
    .eq("id", curriculumId)
    .maybeSingle();
  if (!curriculum) return { success: false, error: "Curriculum not found." };
  if (curriculum.ecosystem_type !== ecosystem.type) {
    return {
      success: false,
      error: "This national curriculum is for a different type of school.",
    };
  }

  const { error } = await supabase.from("school_curriculum_adoptions").insert({
    ecosystem_id: text(formData, "ecosystem_id"),
    national_curriculum_id: curriculumId,
    adopted_by: user.id,
  });
  // 23505: already adopted, which is the state the owner wanted.
  if (error && error.code !== "23505") return { success: false, error: error.message };

  refresh(ecosystem.slug);
  return { success: true };
}

export async function setAdoptionNotify(
  ecosystemId: string,
  curriculumId: string,
  notify: boolean,
): Promise<ImplementationActionState> {
  if (!UUID_RE.test(curriculumId)) return { success: false, error: "Curriculum is required." };

  const auth = await authorizeOwner(ecosystemId);
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase, ecosystem } = auth;

  const { data, error } = await supabase
    .from("school_curriculum_adoptions")
    .update({ notify_on_change: notify === true })
    .eq("ecosystem_id", ecosystemId)
    .eq("national_curriculum_id", curriculumId)
    .select("id");
  if (error) return { success: false, error: error.message };
  if (!data || data.length === 0) {
    return { success: false, error: "Adopt the curriculum first." };
  }

  refresh(ecosystem.slug);
  return { success: true };
}

// ------------------------------------------------------------
// Cycle 2: plan one teaching week
// ------------------------------------------------------------

const INTENT_STATUS = {
  draft: "draft",
  ready: "ready",
  approved: "approved",
  changes: "draft",
} as const;

export async function saveImplementationWeek(
  _: ImplementationActionState,
  formData: FormData,
): Promise<ImplementationActionState> {
  const ecosystemId = text(formData, "ecosystem_id");
  // Form field stays "subtheme_id" (matches term-plan.tsx unchanged); it
  // targets a curriculum_node id, sub-theme-typed for P1 today.
  const nodeId = text(formData, "subtheme_id");
  if (!UUID_RE.test(nodeId)) return { success: false, error: "Week is required." };

  const intent = text(formData, "intent");
  if (!(intent in INTENT_STATUS)) return { success: false, error: "Unknown action." };
  const status = INTENT_STATUS[intent as keyof typeof INTENT_STATUS];

  const teacherId = text(formData, "teacher_id");
  if (teacherId && !UUID_RE.test(teacherId)) {
    return { success: false, error: "Choose a teacher from the list." };
  }

  const plannedStart = text(formData, "planned_start");
  const plannedEnd = text(formData, "planned_end");
  if ((plannedStart && !validDate(plannedStart)) || (plannedEnd && !validDate(plannedEnd))) {
    return { success: false, error: "Enter valid dates." };
  }
  if (plannedStart && plannedEnd && plannedEnd < plannedStart) {
    return { success: false, error: "The end date must not be before the start date." };
  }

  const localLanguageNotes = text(formData, "local_language_notes");
  const sneAdaptations = text(formData, "sne_adaptations");
  const checkingNotes = text(formData, "checking_notes");
  const reviewComment = text(formData, "review_comment");
  for (const value of [localLanguageNotes, sneAdaptations, checkingNotes, reviewComment]) {
    if (value.length > NOTE_MAX) {
      return { success: false, error: `Notes must be ${NOTE_MAX} characters or fewer.` };
    }
  }

  const strandPlans: { strand_id: string; how_we_teach: string }[] = [];
  for (const [name, value] of formData.entries()) {
    if (!name.startsWith("strand:")) continue;
    const strandId = name.slice("strand:".length);
    const howWeTeach = String(value).trim();
    if (!UUID_RE.test(strandId)) return { success: false, error: "Unknown learning area." };
    if (howWeTeach.length > NOTE_MAX) {
      return { success: false, error: `Notes must be ${NOTE_MAX} characters or fewer.` };
    }
    if (howWeTeach) strandPlans.push({ strand_id: strandId, how_we_teach: howWeTeach });
  }

  if (intent === "changes" && !reviewComment) {
    return { success: false, error: "Say what needs to change." };
  }
  if ((status === "ready" || status === "approved") && intent !== "changes") {
    if (!teacherId) return { success: false, error: "Assign a teacher before marking the week ready." };
    if (strandPlans.length === 0) {
      return { success: false, error: "Describe how the week will be taught before marking it ready." };
    }
  }

  const auth = await authorizeOwner(ecosystemId);
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase, ecosystem } = auth;

  const { error } = await supabase.rpc("save_implementation_week", {
    p_ecosystem_id: ecosystemId,
    p_node_id: nodeId,
    p_status: status,
    p_strand_plans: strandPlans as unknown as Json,
    p_teacher_id: teacherId || undefined,
    p_planned_start: plannedStart || undefined,
    p_planned_end: plannedEnd || undefined,
    p_local_language_notes: localLanguageNotes,
    p_sne_adaptations: sneAdaptations,
    p_checking_notes: checkingNotes,
    p_review_comment: intent === "changes" ? reviewComment : undefined,
  });
  if (error) return { success: false, error: error.message };

  refresh(ecosystem.slug);
  return { success: true };
}

// ------------------------------------------------------------
// Cycle 2: the weekly timetable
// ------------------------------------------------------------

export type TimetableInput = {
  ecosystemId: string;
  nationalCurriculumId: string;
  periodsPerDay: number;
  slots: TimetableSlot[];
  publish: boolean;
};

export async function saveTimetable(
  input: TimetableInput,
): Promise<ImplementationActionState> {
  if (!UUID_RE.test(input.nationalCurriculumId)) {
    return { success: false, error: "Curriculum is required." };
  }
  const periodsPerDay = Number(input.periodsPerDay);
  if (!Number.isInteger(periodsPerDay) || periodsPerDay < 1 || periodsPerDay > MAX_PERIODS_PER_DAY) {
    return { success: false, error: `Periods per day must be between 1 and ${MAX_PERIODS_PER_DAY}.` };
  }
  if (!Array.isArray(input.slots) || input.slots.length > DAYS.length * MAX_PERIODS_PER_DAY) {
    return { success: false, error: "The timetable is not valid." };
  }
  const seen = new Set<string>();
  for (const slot of input.slots) {
    const valid =
      Number.isInteger(slot.day) &&
      slot.day >= 1 &&
      slot.day <= DAYS.length &&
      Number.isInteger(slot.period) &&
      slot.period >= 1 &&
      slot.period <= periodsPerDay &&
      typeof slot.allocationId === "string" &&
      UUID_RE.test(slot.allocationId);
    if (!valid) return { success: false, error: "The timetable is not valid." };
    const key = `${slot.day}:${slot.period}`;
    if (seen.has(key)) return { success: false, error: "A period is used twice." };
    seen.add(key);
  }

  const auth = await authorizeOwner(input.ecosystemId);
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase, ecosystem } = auth;

  if (input.publish === true) {
    const { data: allocations } = await supabase
      .from("national_period_allocations")
      .select("id, key, label, group_label, periods, block_size, follows_key, note, sort_order")
      .eq("national_curriculum_id", input.nationalCurriculumId);
    const result = validateTimetable(allocations ?? [], input.slots);
    if (!result.canPublish) {
      return {
        success: false,
        error: "The timetable does not meet the national rules yet, so it can't be published.",
      };
    }
  }

  const { error } = await supabase.rpc("save_implementation_timetable", {
    p_ecosystem_id: input.ecosystemId,
    p_national_curriculum_id: input.nationalCurriculumId,
    p_periods_per_day: periodsPerDay,
    p_slots: input.slots.map((s) => ({
      day: s.day,
      period: s.period,
      allocation_id: s.allocationId,
    })) as unknown as Json,
    p_publish: input.publish === true,
  });
  if (error) return { success: false, error: error.message };

  refresh(ecosystem.slug);
  return { success: true };
}

// ------------------------------------------------------------
// Cycle 2: decisions the national curriculum leaves to the school
// ------------------------------------------------------------

export async function saveSchoolDecision(
  _: ImplementationActionState,
  formData: FormData,
): Promise<ImplementationActionState> {
  const key = text(formData, "decision_key");
  const value = text(formData, "value");
  const detail = text(formData, "detail");
  const curriculumId = text(formData, "national_curriculum_id");
  if (!UUID_RE.test(curriculumId)) return { success: false, error: "Curriculum is required." };

  const invalid = validateDecision(key, value, detail);
  if (invalid) return { success: false, error: invalid };

  const ecosystemId = text(formData, "ecosystem_id");
  const auth = await authorizeOwner(ecosystemId);
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase, user, ecosystem } = auth;

  // The detail (e.g. the local language's name) only applies to one option.
  const keepDetail = findDecision(key)?.detail?.whenValue === value;

  const { error } = await supabase.from("school_decisions").upsert(
    {
      ecosystem_id: ecosystemId,
      national_curriculum_id: curriculumId,
      decision_key: key,
      value,
      detail: keepDetail && detail ? detail : null,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
    },
    { onConflict: "ecosystem_id,national_curriculum_id,decision_key" },
  );
  if (error) return { success: false, error: error.message };

  refresh(ecosystem.slug);
  return { success: true };
}
