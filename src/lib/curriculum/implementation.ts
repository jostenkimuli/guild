import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { NationalCurriculum } from "./national";
import type { TimetableSlot } from "./timetable-rules";

type SupabaseLike = SupabaseClient<Database>;

export type ImplementationStatus =
  Database["public"]["Enums"]["implementation_status"];

export type ImplementationWeek = {
  id: string;
  subthemeId: string;
  teacherId: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  status: ImplementationStatus;
  localLanguageNotes: string;
  sneAdaptations: string;
  checkingNotes: string;
  reviewComment: string | null;
  reviewedAt: string | null;
  /** strand id -> "how we will teach this" */
  strandPlans: Record<string, string>;
};

export type TeacherOption = { id: string; name: string };

export type SavedTimetable = {
  periodsPerDay: number;
  publishedAt: string | null;
  slots: TimetableSlot[];
};

export type SavedDecision = {
  key: string;
  value: string;
  detail: string | null;
  decidedAt: string;
};

export type SchoolImplementation = {
  adoption: { adoptedAt: string; notifyOnChange: boolean } | null;
  /** national sub-theme id -> the school's plan for that week */
  weeks: Record<string, ImplementationWeek>;
  timetable: SavedTimetable | null;
  /** decision key -> saved decision */
  decisions: Record<string, SavedDecision>;
  teachers: TeacherOption[];
};

export const STATUS_LABELS: Record<ImplementationStatus, string> = {
  not_started: "Not started",
  draft: "Draft",
  ready: "Ready",
  approved: "Approved",
};

const DEFAULT_PERIODS_PER_DAY = 8;
export { DEFAULT_PERIODS_PER_DAY };

export async function loadSchoolImplementation(
  supabase: SupabaseLike,
  ecosystemId: string,
  curriculum: NationalCurriculum,
): Promise<SchoolImplementation> {
  const subthemeIds = curriculum.themes.flatMap((t) => t.subthemes.map((s) => s.id));

  const [adoption, weekRows, timetable, decisionRows, memberRows, staffRows] =
    await Promise.all([
      supabase
        .from("school_curriculum_adoptions")
        .select("adopted_at, notify_on_change")
        .eq("ecosystem_id", ecosystemId)
        .eq("national_curriculum_id", curriculum.id)
        .maybeSingle(),
      supabase
        .from("implementation_weeks")
        .select(
          `id, node_id, teacher_id, planned_start, planned_end, status,
           local_language_notes, sne_adaptations, checking_notes, review_comment,
           reviewed_at,
           implementation_week_strand_plans(strand_id, how_we_teach)`,
        )
        .eq("ecosystem_id", ecosystemId)
        .in("node_id", subthemeIds),
      supabase
        .from("implementation_timetables")
        .select(
          "periods_per_day, published_at, implementation_timetable_slots(day_of_week, period_no, allocation_id)",
        )
        .eq("ecosystem_id", ecosystemId)
        .eq("national_curriculum_id", curriculum.id)
        .maybeSingle(),
      supabase
        .from("school_decisions")
        .select("decision_key, value, detail, decided_at")
        .eq("ecosystem_id", ecosystemId)
        .eq("national_curriculum_id", curriculum.id),
      supabase
        .from("space_memberships")
        .select(
          "user_id, profiles(display_name, username), spaces!inner(ecosystem_id)",
        )
        .eq("spaces.ecosystem_id", ecosystemId)
        .in("role", ["teacher", "admin"]),
      supabase
        .from("ecosystem_staff")
        .select("user_id, profiles(display_name, username)")
        .eq("ecosystem_id", ecosystemId),
    ]);

  const weeks: Record<string, ImplementationWeek> = {};
  for (const row of weekRows.data ?? []) {
    weeks[row.node_id] = {
      id: row.id,
      subthemeId: row.node_id,
      teacherId: row.teacher_id,
      plannedStart: row.planned_start,
      plannedEnd: row.planned_end,
      status: row.status,
      localLanguageNotes: row.local_language_notes,
      sneAdaptations: row.sne_adaptations,
      checkingNotes: row.checking_notes,
      reviewComment: row.review_comment,
      reviewedAt: row.reviewed_at,
      strandPlans: Object.fromEntries(
        row.implementation_week_strand_plans.map((p) => [p.strand_id, p.how_we_teach]),
      ),
    };
  }

  const decisions: Record<string, SavedDecision> = {};
  for (const row of decisionRows.data ?? []) {
    decisions[row.decision_key] = {
      key: row.decision_key,
      value: row.value,
      detail: row.detail,
      decidedAt: row.decided_at,
    };
  }

  const teachers = new Map<string, TeacherOption>();
  for (const row of [...(memberRows.data ?? []), ...(staffRows.data ?? [])]) {
    if (!row.user_id || teachers.has(row.user_id)) continue;
    teachers.set(row.user_id, {
      id: row.user_id,
      name: row.profiles?.display_name || row.profiles?.username || "Unnamed",
    });
  }

  return {
    adoption: adoption.data
      ? {
          adoptedAt: adoption.data.adopted_at,
          notifyOnChange: adoption.data.notify_on_change,
        }
      : null,
    weeks,
    timetable: timetable.data
      ? {
          periodsPerDay: timetable.data.periods_per_day,
          publishedAt: timetable.data.published_at,
          slots: timetable.data.implementation_timetable_slots.map((s) => ({
            day: s.day_of_week,
            period: s.period_no,
            allocationId: s.allocation_id,
          })),
        }
      : null,
    decisions,
    teachers: [...teachers.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}
