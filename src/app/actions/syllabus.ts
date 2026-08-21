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

async function isApprovedEcosystemAdminOfSpaceId(
  userId: string,
  spaceId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "ecosystem_admin" || profile?.status !== "approved") {
    return false;
  }
  const { data: space } = await supabase
    .from("spaces")
    .select("ecosystem_id")
    .eq("id", spaceId)
    .maybeSingle();
  if (!space) return false;
  const { data: staff } = await supabase
    .from("ecosystem_staff")
    .select("role")
    .eq("ecosystem_id", space.ecosystem_id)
    .eq("user_id", userId)
    .maybeSingle();
  return staff?.role === "ecosystem_admin";
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

  // Optional pass mark (default 50 if omitted)
  const passMarkRaw = Number(formData.get("pass_mark") ?? 50);
  const passMark = Number.isFinite(passMarkRaw) && passMarkRaw >= 0 && passMarkRaw <= 100 ? passMarkRaw : 50;

  const officeHours = String(formData.get("office_hours") ?? "").trim();
  const classroomExpectations = String(formData.get("classroom_expectations") ?? "").trim();

  // Materials: accept JSON array string (chips) or newline-separated fallback
  const materialsRaw = String(formData.get("required_materials") ?? "").trim();
  let requiredMaterials: string[] = [];
  if (materialsRaw) {
    try {
      const parsed = JSON.parse(materialsRaw);
      if (Array.isArray(parsed)) {
        requiredMaterials = parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      // Fallback: split on newlines (for legacy textarea)
      requiredMaterials = materialsRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    }
  }

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

  // Validate that breakdown totals 100%
  const totalWeight = gradeBreakdown.reduce((sum, item) => sum + item.weight_pct, 0);
  if (gradeBreakdown.length > 0 && totalWeight !== 100) {
    return {
      success: false,
      error: "Grading components must total 100%.",
    };
  }

  const gradingPolicy: Json = {
    pass_mark: passMark,
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

  const isStaff =
    membership?.role === "admin" || membership?.role === "teacher";

  const isEcosystemAdmin = await isApprovedEcosystemAdminOfSpaceId(
    user.id,
    curriculum.space_id,
  );

  if (!isStaff && !isEcosystemAdmin) {
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

  // Determine the materials value to store (as text, newline-separated)
  const materialsValue = requiredMaterials.length ? requiredMaterials.join('\n') : null;

  if (existing) {
    const { error } = await supabase
      .from("syllabi")
      .update({
        grading_policy: gradingPolicy,
        required_materials: materialsValue,
        office_hours: officeHours || null,
        classroom_expectations: classroomExpectations || null,
        // instructor_notes intentionally omitted to preserve legacy column;
        // new UI uses office_hours + classroom_expectations.
        teacher_id: user.id,
      })
      .eq("id", existing.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("syllabi").insert({
      curriculum_id: curriculumId,
      grading_policy: gradingPolicy,
      required_materials: materialsValue,
      office_hours: officeHours || null,
      classroom_expectations: classroomExpectations || null,
      // instructor_notes omitted for new UI; legacy column remains if previously set.
      teacher_id: user.id,
    });

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/spaces/[slug]", "page");
  revalidatePath("/spaces/[slug]/syllabus/new", "page");
  return { success: true };
}