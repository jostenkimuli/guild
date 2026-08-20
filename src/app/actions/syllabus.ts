"use server";

import { revalidatePath } from "next/cache";

import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type SyllabusActionState = {
  success: boolean;
  error?: string;
};

async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

// ------------------------------------------------------------
// Staff only: create or update a syllabus for a curriculum.
// A syllabus wraps the curriculum's structural framework with
// execution metadata (grading policy, materials, instructor notes).
// One syllabus per curriculum (UNIQUE constraint on curriculum_id).
// ------------------------------------------------------------

export async function createSyllabus(
  _: SyllabusActionState,
  formData: FormData,
): Promise<SyllabusActionState> {
  const user = await getProfile();
  if (!user) return { success: false, error: "Not signed in." };

  const curriculumId = String(formData.get("curriculum_id") ?? "").trim();
  if (!curriculumId) {
    return { success: false, error: "Curriculum is required." };
  }

  const passMarkRaw = Number(formData.get("pass_mark") ?? 50);
  if (
    !Number.isFinite(passMarkRaw) ||
    passMarkRaw < 0 ||
    passMarkRaw > 100
  ) {
    return {
      success: false,
      error: "Pass mark must be between 0 and 100.",
    };
  }

  const requiredMaterials = String(formData.get("required_materials") ?? "").trim();
  const instructorNotes = String(formData.get("instructor_notes") ?? "").trim();

  // Build grading_policy JSON from structured form fields
  const breakdownCount = Number(formData.get("breakdown_count") ?? 0);
  const gradeBreakdown: { label: string; weight_pct: number }[] = [];

  for (let i = 0; i < breakdownCount; i++) {
    const label = String(formData.get(`breakdown_${i}_label`) ?? "").trim();
    const weightRaw = Number(formData.get(`breakdown_${i}_weight`) ?? 0);
    if (!label) {
      return {
        success: false,
        error: `Grading breakdown ${i + 1} is missing a label.`,
      };
    }
    if (!Number.isFinite(weightRaw) || weightRaw < 0 || weightRaw > 100) {
      return {
        success: false,
        error: `Grading breakdown ${i + 1} weight must be between 0 and 100.`,
      };
    }
    gradeBreakdown.push({ label, weight_pct: weightRaw });
  }

  const gradingPolicy: Json = {
    pass_mark: passMarkRaw,
    grade_breakdown: gradeBreakdown,
  };

  const supabase = await createClient();

  // Verify staff membership via the curriculum's space
  const { data: curriculum } = await supabase
    .from("curricula")
    .select("space_id")
    .eq("id", curriculumId)
    .maybeSingle();

  if (!curriculum) {
    return { success: false, error: "Curriculum not found." };
  }

  const { data: membership } = await supabase
    .from("space_memberships")
    .select("role")
    .eq("space_id", curriculum.space_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "admin" && membership?.role !== "teacher") {
    return {
      success: false,
      error: "Only a teacher or admin can create a syllabus.",
    };
  }

  // Upsert: if syllabus exists for this curriculum, update it
  const { data: existing } = await supabase
    .from("syllabi")
    .select("id")
    .eq("curriculum_id", curriculumId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("syllabi")
      .update({
        grading_policy: gradingPolicy,
        required_materials: requiredMaterials || null,
        instructor_notes: instructorNotes || null,
        teacher_id: user.id,
      })
      .eq("id", existing.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("syllabi").insert({
      curriculum_id: curriculumId,
      grading_policy: gradingPolicy,
      required_materials: requiredMaterials || null,
      instructor_notes: instructorNotes || null,
      teacher_id: user.id,
    });

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/spaces/[slug]", "page");
  revalidatePath("/spaces/[slug]/syllabus/new", "page");
  return { success: true };
}
