"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type CurriculumActionState = {
  success: boolean;
  error?: string;
};

export type CurriculumWizardTopicInput = {
  name: string;
  description?: string;
  duration_weeks?: number;
};

export type CurriculumWizardUnitInput = {
  name: string;
  topics: CurriculumWizardTopicInput[];
};

export type CurriculumWizardTermInput = {
  name: string;
  units: CurriculumWizardUnitInput[];
};

export type CurriculumWizardInput = {
  space_id: string;
  /** Existing curriculum id when editing; null when creating. */
  curriculum_id: string | null;
  /** Only used when curriculum_id is null. */
  new_curriculum_name?: string;
  new_curriculum_year?: number;
  /** Shared curriculum goals, applied once to the curriculum. */
  goals: string[];
  /** Names of the target grades the shared tree is replicated under. */
  target_grades: string[];
  /** Shared term → unit → topic tree, replicated under every target grade. */
  terms: CurriculumWizardTermInput[];
  /** true = publish blueprint; false = save as draft. */
  publish: boolean;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1;
}

// ------------------------------------------------------------
// Ecosystem admin: populate a space's curriculum tree via the
// blueprint wizard. The payload collects one shared tree
// (goals + terms → units → topics) which is replicated under
// every checked target grade. Rows are inserted depth-first.
// ------------------------------------------------------------

export async function saveCurriculumData(
  _: CurriculumActionState,
  formData: FormData,
): Promise<CurriculumActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const raw = String(formData.get("payload") ?? "");
  if (!raw) return { success: false, error: "Missing curriculum data." };

  let input: CurriculumWizardInput;
  try {
    input = JSON.parse(raw) as CurriculumWizardInput;
  } catch {
    return { success: false, error: "Invalid curriculum data." };
  }

  const spaceId = clean(input.space_id);
  if (!spaceId) return { success: false, error: "Space is required." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "ecosystem_admin" || profile?.status !== "approved") {
    return {
      success: false,
      error:
        "Only an approved ecosystem admin can populate curriculum data.",
    };
  }

  const { data: space } = await supabase
    .from("spaces")
    .select("ecosystem_id")
    .eq("id", spaceId)
    .maybeSingle();
  if (!space) return { success: false, error: "Space not found." };

  const { data: staff } = await supabase
    .from("ecosystem_staff")
    .select("role")
    .eq("ecosystem_id", space.ecosystem_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (staff?.role !== "ecosystem_admin") {
    return {
      success: false,
      error: "You are not an ecosystem admin for this space.",
    };
  }

  const targetGrades = input.target_grades
    .map((grade) => clean(grade))
    .filter(Boolean);
  if (targetGrades.length === 0) {
    return {
      success: false,
      error: "Choose at least one target grade for the blueprint.",
    };
  }

  // Resolve the target curriculum (existing one in this space, or create)
  let curriculumId = clean(input.curriculum_id);
  if (curriculumId) {
    const { data: existing } = await supabase
      .from("curricula")
      .select("id")
      .eq("id", curriculumId)
      .eq("space_id", spaceId)
      .maybeSingle();
    if (!existing) {
      return {
        success: false,
        error: "Curriculum not found in this space.",
      };
    }
  } else {
    const name = clean(input.new_curriculum_name);
    const yearRaw = Number(
      input.new_curriculum_year ?? new Date().getFullYear(),
    );
    if (!name) {
      return {
        success: false,
        error:
          "Curriculum name is required when creating a new curriculum.",
      };
    }
    if (!Number.isInteger(yearRaw) || yearRaw < 1900 || yearRaw > 2100) {
      return { success: false, error: "Curriculum year is not valid." };
    }
    const { data: created, error } = await supabase
      .from("curricula")
      .insert({
        space_id: spaceId,
        name,
        year: yearRaw,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) return { success: false, error: error.message };
    curriculumId = created.id;
  }

  // Publish state: publish sets the flag + timestamp once.
  if (input.publish) {
    const { error: pubErr } = await supabase
      .from("curricula")
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq("id", curriculumId);
    if (pubErr) return { success: false, error: pubErr.message };
  }

  // Curriculum goals (shared, once per curriculum)
  const goals = (input.goals ?? []).map(clean).filter(Boolean);
  if (goals.length > 0) {
    const { error } = await supabase.from("curriculum_goals").insert(
      goals.map((description) => ({
        curriculum_id: curriculumId,
        description,
      })),
    );
    if (error) return { success: false, error: error.message };
  }

  // Shared tree
  const tree = (input.terms ?? []).map((term) => ({
    name: clean(term.name),
    units: (term.units ?? [])
      .map((unit) => ({
        name: clean(unit.name),
        topics: (unit.topics ?? [])
          .map((topic) => ({
            name: clean(topic.name),
            description: clean(topic.description),
            duration_weeks: topic.duration_weeks,
          }))
          .filter((topic) => topic.name.length > 0),
      }))
      .filter((unit) => unit.name.length > 0),
  }));

  const counts = { grades: 0, terms: 0, units: 0, topics: 0 };

  for (const gradeName of targetGrades) {
    const { data: gradeRow, error: gradeErr } = await supabase
      .from("grades")
      .insert({ curriculum_id: curriculumId, name: gradeName })
      .select("id")
      .single();
    if (gradeErr) return { success: false, error: gradeErr.message };
    counts.grades += 1;

    for (const term of tree) {
      const { data: termRow, error: termErr } = await supabase
        .from("terms")
        .insert({ grade_id: gradeRow.id, name: term.name })
        .select("id")
        .single();
      if (termErr) return { success: false, error: termErr.message };
      counts.terms += 1;

      for (const unit of term.units) {
        const { data: unitRow, error: unitErr } = await supabase
          .from("units")
          .insert({ term_id: termRow.id, name: unit.name })
          .select("id")
          .single();
        if (unitErr) return { success: false, error: unitErr.message };
        counts.units += 1;

        for (let i = 0; i < unit.topics.length; i += 1) {
          const topic = unit.topics[i];
          const { error: topicErr } = await supabase.from("topics").insert({
            unit_id: unitRow.id,
            name: topic.name,
            description: topic.description || null,
            duration_weeks: isPositiveNumber(topic.duration_weeks)
              ? topic.duration_weeks
              : null,
            sequence_order: i + 1,
          });
          if (topicErr) return { success: false, error: topicErr.message };
          counts.topics += 1;
        }
      }
    }
  }

  const totalCreated = goals.length + counts.grades + counts.terms +
    counts.units + counts.topics;
  if (totalCreated === 0) {
    return {
      success: false,
      error: "Enter at least one goal, term, unit or topic to save.",
    };
  }

  revalidatePath("/spaces/[slug]", "page");
  return { success: true };
}