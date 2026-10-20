"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ConsoleActionState = {
  success: boolean;
  error?: string;
  code?: string;
  ecosystemId?: string;
};

export type EditSpaceState = ConsoleActionState & {
  request?: {
    id: string;
    created_at: string;
    changes: Json;
  } | null;
};

type ProfileRow = {
  id: string;
  role: Database["public"]["Enums"]["profile_role"];
  status: Database["public"]["Enums"]["profile_status"];
  must_change_password: boolean;
  can_approve_ecosystem_admins: boolean;
  ecosystem_type: Database["public"]["Enums"]["ecosystem_type"] | null;
};

const ECOSYSTEM_TYPES: ReadonlyArray<
  Database["public"]["Enums"]["ecosystem_type"]
> = ["nursery_school", "primary_school", "secondary_school", "university"];

async function getProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, role, status, must_change_password, can_approve_ecosystem_admins, ecosystem_type",
    )
    .eq("id", user.id)
    .single();
  return data;
}

async function isApprovedEcosystemAdminOfSpace(
  profile: ProfileRow,
  spaceId: string,
): Promise<boolean> {
  if (profile.role !== "ecosystem_admin" || profile.status !== "approved") {
    return false;
  }
  const supabase = await createClient();
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
    .eq("user_id", profile.id)
    .maybeSingle();
  return staff?.role === "ecosystem_admin";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAccountFields(
  email: string,
  tempPassword: string,
  fullName: string,
): string | null {
  if (!email || !tempPassword || !fullName) {
    return "Full name, email and a temporary password are required.";
  }
  if (!EMAIL_RE.test(email)) {
    return "Enter a valid email address.";
  }
  if (tempPassword.length < 6) {
    return "Temporary password must be at least 6 characters.";
  }
  if (fullName.length < 2 || fullName.length > 120) {
    return "Full name must be between 2 and 120 characters.";
  }
  return null;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function generateCode(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

// ------------------------------------------------------------
// Program admin (approved) or super admin: create an
// ecosystem-admin account (pending)
// ------------------------------------------------------------

export async function createEcosystemAdmin(
  _: ConsoleActionState,
  formData: FormData,
): Promise<ConsoleActionState> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "Not signed in." };

  const canCreate =
    profile.role === "super_admin" ||
    (profile.role === "program_admin" && profile.status === "approved");
  if (!canCreate) {
    return { success: false, error: "Only an approved program admin can create ecosystem admins." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const tempPassword = String(formData.get("temp_password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const typeRaw = String(formData.get("ecosystem_type") ?? "").trim();

  const invalid = validateAccountFields(email, tempPassword, fullName);
  if (invalid) return { success: false, error: invalid };

  const ecosystemType = typeRaw
    ? (typeRaw as Database["public"]["Enums"]["ecosystem_type"])
    : "primary_school";
  if (!ECOSYSTEM_TYPES.includes(ecosystemType)) {
    return { success: false, error: "Invalid ecosystem type." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_user", {
    p_email: email,
    p_temp_password: tempPassword,
    p_role: "ecosystem_admin",
    p_full_name: fullName,
    p_ecosystem_id: undefined,
    p_status: "pending",
    p_ecosystem_type: ecosystemType,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}


// ------------------------------------------------------------
// Super admin: create a program-admin account (pending)
// ------------------------------------------------------------

export async function createProgramAdmin(
  _: ConsoleActionState,
  formData: FormData,
): Promise<ConsoleActionState> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "Not signed in." };
  if (profile.role !== "super_admin" || profile.status !== "approved") {
    return { success: false, error: "Only the super admin can create program admins." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const tempPassword = String(formData.get("temp_password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  const invalid = validateAccountFields(email, tempPassword, fullName);
  if (invalid) return { success: false, error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_user", {
    p_email: email,
    p_temp_password: tempPassword,
    p_role: "program_admin",
    p_full_name: fullName,
    p_ecosystem_id: undefined,
    p_status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ------------------------------------------------------------
// Super admin: approve a pending program-admin account
// ------------------------------------------------------------

export async function approveProgramAdmin(formData: FormData) {
  const profile = await getProfile();
  const userId = String(formData.get("user_id") ?? "");

  if (!profile || profile.role !== "super_admin" || profile.status !== "approved") {
    redirect("/admin?error=unauthorized");
  }
  if (!userId) redirect("/admin?error=missing-id");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", userId)
    .eq("role", "program_admin");

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect("/admin?approved=1");
}

// ------------------------------------------------------------
// Super admin: delegate (or revoke) ecosystem-admin approvals to
// a program admin. All ecosystem-admin approvals start with the
// super admin; a delegated program admin approves them directly.
// ------------------------------------------------------------

export async function setProgramAdminDelegation(formData: FormData) {
  const profile = await getProfile();
  const userId = String(formData.get("user_id") ?? "");
  const delegated = formData.get("delegated") === "true";

  if (!profile || profile.role !== "super_admin" || profile.status !== "approved") {
    redirect("/admin?error=unauthorized");
  }
  if (!userId) redirect("/admin?error=missing-id");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ can_approve_ecosystem_admins: delegated })
    .eq("id", userId)
    .eq("role", "program_admin");

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin?delegated=${delegated ? 1 : 0}`);
}

// ------------------------------------------------------------
// Program admin (delegated) or super admin: approve an ecosystem admin
// ------------------------------------------------------------

export async function approveEcosystemAdmin(formData: FormData) {
  const profile = await getProfile();
  const userId = String(formData.get("user_id") ?? "");

  const delegated =
    profile?.role === "program_admin" &&
    profile.status === "approved" &&
    profile.can_approve_ecosystem_admins;
  const isSuper =
    profile?.role === "super_admin" && profile.status === "approved";

  if (!delegated && !isSuper) {
    redirect("/admin?error=unauthorized");
  }
  if (!userId) redirect("/admin?error=missing-id");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", userId)
    .eq("role", "ecosystem_admin");

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/admin?approved=1");
}

// ------------------------------------------------------------
// Ecosystem admin: create their ecosystem (school metadata)
// ------------------------------------------------------------

export async function createEcosystem(
  _: ConsoleActionState,
  formData: FormData,
): Promise<ConsoleActionState> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 120) {
    return { success: false, error: "Name must be between 2 and 120 characters." };
  }

  const type: Database["public"]["Enums"]["ecosystem_type"] =
    profile.ecosystem_type ?? "primary_school";

  const meta: Record<string, string | string[]> = {
    director_name: String(formData.get("director_name") ?? "").trim(),
    director_contact: String(formData.get("director_contact") ?? "").trim(),
    director_email: String(formData.get("director_email") ?? "").trim(),
    headteacher_name: String(formData.get("headteacher_name") ?? "").trim(),
    headteacher_contact: String(formData.get("headteacher_contact") ?? "").trim(),
    headteacher_email: String(formData.get("headteacher_email") ?? "").trim(),
    school_location: String(formData.get("school_location") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim(),
    region: String(formData.get("region") ?? "").trim(),
    district: String(formData.get("district") ?? "").trim(),
    sub_county: String(formData.get("sub_county") ?? "").trim(),
    parish: String(formData.get("parish") ?? "").trim(),
  };

  for (const [field, value] of Object.entries(meta)) {
    if (typeof value === "string" && value.length > 120) {
      return { success: false, error: `${field} must be 120 characters or fewer.` };
    }
  }

  const grades = formData
    .getAll("grades")
    .map((g) => String(g).trim())
    .filter((g) => g.length > 0 && g.length <= 60);
  if (grades.length > 0) meta.grades = grades;
  const directorEmail = String(meta.director_email ?? "").trim();
  if (directorEmail && !EMAIL_RE.test(directorEmail)) {
    return { success: false, error: "Director email is not valid." };
  }
  const headteacherEmail = String(meta.headteacher_email ?? "").trim();
  if (headteacherEmail && !EMAIL_RE.test(headteacherEmail)) {
    return { success: false, error: "Headteacher email is not valid." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ecosystems")
    .select("slug")
    .like("slug", `${slugify(name)}%`)
    .order("slug")
    .then((r) => r);

  const base = slugify(name) || "ecosystem";
  const taken = new Set((existing ?? []).map((e) => e.slug));
  let slug = base;
  for (let i = 2; i < 1_000 && taken.has(slug); i++) {
    slug = `${base}-${i}`;
  }

  const { data, error } = await supabase
    .from("ecosystems")
    .insert({
      name,
      slug,
      type,
      vision: String(formData.get("vision") ?? "").trim() || null,
      mission: String(formData.get("mission") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      raw_ecosystem_meta_data: meta,
      created_by: profile.id,
    })
    .select("id, slug")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, ecosystemId: data.id, code: data.slug };
}

// ------------------------------------------------------------
// Ecosystem admin: create a space-admin account for their ecosystem
// ------------------------------------------------------------

export async function createSpaceAdmin(
  _: ConsoleActionState,
  formData: FormData,
): Promise<ConsoleActionState> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "Not signed in." };

  const email = String(formData.get("email") ?? "").trim();
  const tempPassword = String(formData.get("temp_password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const ecosystemId = String(formData.get("ecosystem_id") ?? "");
  const spaceId = String(formData.get("space_id") ?? "");

  if (profile.role !== "ecosystem_admin" || profile.status !== "approved") {
    return { success: false, error: "Only an approved ecosystem admin can create a space admin." };
  }
  if (!ecosystemId || !spaceId) {
    return { success: false, error: "Choose the ecosystem and space this admin will manage." };
  }
  const invalid = validateAccountFields(email, tempPassword, fullName);
  if (invalid) return { success: false, error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_space_admin", {
    p_email: email,
    p_temp_password: tempPassword,
    p_full_name: fullName,
    p_ecosystem_id: ecosystemId,
    p_space_id: spaceId,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function setSpaceAdminAssignments(
  _: ConsoleActionState,
  formData: FormData,
): Promise<ConsoleActionState> {
  const profile = await getProfile();
  if (!profile || profile.role !== "ecosystem_admin" || profile.status !== "approved") {
    return { success: false, error: "Only an approved ecosystem admin can manage space admin assignments." };
  }

  const ecosystemId = String(formData.get("ecosystem_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const spaceIds = formData.getAll("space_ids").map(String).filter(Boolean);
  if (!ecosystemId || !userId) {
    return { success: false, error: "Ecosystem and space admin are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_space_admin_assignments", {
    p_ecosystem_id: ecosystemId,
    p_user_id: userId,
    p_space_ids: spaceIds,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/ecosystem/[slug]/staff", "page");
  revalidatePath("/", "layout");
  return { success: true };
}

// ------------------------------------------------------------
// Ecosystem admin: approve a pending space-admin account
// ------------------------------------------------------------

export async function approveSpaceAdmin(formData: FormData) {
  const profile = await getProfile();
  const userId = String(formData.get("user_id") ?? "");

  if (!profile || profile.role !== "ecosystem_admin" || profile.status !== "approved") {
    redirect("/?error=unauthorized");
  }
  if (!userId) redirect("/?error=missing-id");

  // Verify the space admin belongs to an ecosystem this admin manages
  const supabase = await createClient();
  const { data: staffEntry } = await supabase
    .from("ecosystem_staff")
    .select("ecosystem_id")
    .eq("user_id", userId)
    .eq("role", "space_admin")
    .maybeSingle();

  if (!staffEntry) redirect("/?error=not-found");

  const { data: assignment } = await supabase
    .from("ecosystem_staff")
    .select("ecosystem_id")
    .eq("ecosystem_id", staffEntry.ecosystem_id)
    .eq("user_id", profile.id)
    .eq("role", "ecosystem_admin")
    .maybeSingle();

  if (!assignment) redirect("/?error=unauthorized");

  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", userId)
    .eq("role", "space_admin");

  if (error) redirect(`/?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/ecosystem/[slug]/staff", "page");
}

// ------------------------------------------------------------
// Ecosystem admin: create a space in their ecosystem
// ------------------------------------------------------------

export async function createSpace(
  _: ConsoleActionState,
  formData: FormData,
): Promise<ConsoleActionState> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "Not signed in." };

  const ecosystemId = String(formData.get("ecosystem_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!ecosystemId) {
    return { success: false, error: "Ecosystem is required." };
  }
  if (name.length < 2 || name.length > 120) {
    return { success: false, error: "Space name must be between 2 and 120 characters." };
  }

  const type = String(formData.get("type") ?? "department") as Database["public"]["Enums"]["space_type"];
  const baseSlug = slugify(name) || "space";
  const supabase = await createClient();
  const values = {
    ecosystem_id: ecosystemId,
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    type,
    created_by: profile.id,
  };

  // Slugs resolve through the global /spaces/[slug] route, so they must be
  // globally unique. Let the unique index arbitrate concurrent creates and
  // retry with a suffix if another space already claimed the candidate.
  for (let suffix = 1; suffix <= 10_000; suffix++) {
    const ending = suffix === 1 ? "" : `-${suffix}`;
    const slug = `${baseSlug.slice(0, 60 - ending.length).replace(/-+$/, "")}${ending}`;
    const { error } = await supabase.from("spaces").insert({ ...values, slug });

    if (!error) return { success: true };
    if (error.code !== "23505") return { success: false, error: error.message };
  }

  return {
    success: false,
    error: "Could not generate a unique space URL. Please try again.",
  };
}

// ------------------------------------------------------------
// Space admin: generate an invitation code for a space
// ------------------------------------------------------------

export async function createInvitationCode(
  _: ConsoleActionState,
  formData: FormData,
): Promise<ConsoleActionState> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "Not signed in." };

  const spaceId = String(formData.get("space_id") ?? "");
  if (!spaceId) return { success: false, error: "Space is required." };

  const role = String(formData.get("role") ?? "learner") as Database["public"]["Enums"]["user_space_role"];
  if (role !== "learner" && role !== "teacher") {
    return { success: false, error: "Invitation codes can assign a learner or teacher role." };
  }

  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  const expiresInDays = String(formData.get("expires_in_days") ?? "").trim();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + Number(expiresInDays) * 86_400_000).toISOString()
    : null;

  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
    return { success: false, error: "Max uses must be a positive whole number." };
  }
  if (expiresInDays && (!Number.isInteger(Number(expiresInDays)) || Number(expiresInDays) < 1)) {
    return {
      success: false,
      error: "Validity must be a positive whole number of days.",
    };
  }

  const code = generateCode();

  const gradeIdRaw = String(formData.get("grade_id") ?? "").trim();
  const gradeId = gradeIdRaw || null;

  const supabase = await createClient();
  const { error } = await supabase.from("invitation_codes").insert({
    space_id: spaceId,
    code,
    role,
    created_by: profile.id,
    max_uses: maxUses,
    expires_at: expiresAt,
    grade_id: gradeId,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, code };
}

export async function manageSpaceMembership(
  _: ConsoleActionState,
  formData: FormData,
): Promise<ConsoleActionState> {
  const profile = await getProfile();
  if (!profile || profile.status !== "approved") {
    return { success: false, error: "An approved account is required." };
  }

  const sourceSpaceId = String(formData.get("source_space_id") ?? "") || null;
  const targetSpaceId = String(formData.get("target_space_id") ?? "") || null;
  const userId = String(formData.get("user_id") ?? "");
  const roleRaw = String(formData.get("role") ?? "learner");
  const validRoles = ["teacher", "learner", "mentor", "collaborator"] as const;
  if (!userId || (!sourceSpaceId && !targetSpaceId)) {
    return { success: false, error: "Choose a member and a source or target space." };
  }
  if (!validRoles.includes(roleRaw as (typeof validRoles)[number])) {
    return { success: false, error: "Choose a valid membership role." };
  }

  const supabase = await createClient();
  const rpcArgs: Database["public"]["Functions"]["manage_space_membership"]["Args"] = {
    p_user_id: userId,
    p_role: roleRaw as Database["public"]["Enums"]["user_space_role"],
    ...(sourceSpaceId ? { p_source_space_id: sourceSpaceId } : {}),
    ...(targetSpaceId ? { p_target_space_id: targetSpaceId } : {}),
  };
  const { error } = await supabase.rpc("manage_space_membership", {
    ...rpcArgs,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/ecosystem/[slug]/members", "page");
  revalidatePath("/spaces/[slug]/members", "page");
  revalidatePath("/", "layout");
  return { success: true };
}

// ------------------------------------------------------------
// Space admin: request to edit a space (pending ecosystem admin approval)
// ------------------------------------------------------------

export async function editSpace(
  _: EditSpaceState,
  formData: FormData,
): Promise<EditSpaceState> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "Not signed in." };

  const spaceId = String(formData.get("space_id") ?? "");
  if (!spaceId) return { success: false, error: "Space is required." };

  const supabase = await createClient();
  // Verify user is admin of this space
  const { data: membership } = await supabase
    .from("space_memberships")
    .select("role")
    .eq("space_id", spaceId)
    .eq("user_id", profile.id)
    .single();

  const isMemberAdmin = membership?.role === "admin";
  const isEcosystemAdmin = await isApprovedEcosystemAdminOfSpace(
    profile,
    spaceId,
  );

  if (!isMemberAdmin && !isEcosystemAdmin) {
    return { success: false, error: "Only a space admin can request space edits." };
  }

  const changes: Json = {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    type: String(formData.get("type") ?? "").trim(),
  };

  // Validate at least one change
  const hasChanges = Object.values(changes).some(
    (v) => v && v.toString().length > 0,
  );
  if (!hasChanges) {
    return { success: false, error: "At least one field must be changed." };
  }

  const { data: request, error } = await supabase
    .from("space_edits")
    .insert({
      space_id: spaceId,
      edited_by: profile.id,
      changes,
      status: "pending",
    })
    .select("id, created_at, changes")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/spaces/[slug]", "page");
  return { success: true, request };
}

// ------------------------------------------------------------
// Ecosystem admin: approve a space edit (applies changes to spaces table)
// ------------------------------------------------------------

export async function approveSpaceEdit(formData: FormData) {
  const profile = await getProfile();
  const editId = String(formData.get("edit_id") ?? "");

  if (!profile || profile.role !== "ecosystem_admin" || profile.status !== "approved") {
    redirect("/?error=unauthorized");
  }
  if (!editId) redirect("/?error=missing-id");

  const supabase = await createClient();
  const { data: edit, error: editError } = await supabase
    .from("space_edits")
    .select("*, spaces(*)")
    .eq("id", editId)
    .single();

  if (editError || !edit) {
    redirect("/?error=invalid-edit");
  }

  if (edit.status !== "pending") {
    redirect("/?error=edit-already-processed");
  }

  // Apply changes to spaces table
  const { data: updatedRows, error: updateError } = await supabase
    .from("spaces")
    .update(edit.changes as Database["public"]["Tables"]["spaces"]["Update"])
    .eq("id", edit.space_id)
    .select("id");

  if (updateError) {
    redirect(`/?error=${encodeURIComponent(updateError.message)}`);
  }
  if (!updatedRows || updatedRows.length === 0) {
    redirect("/?error=space-update-failed");
  }

  // Mark edit as approved
  await supabase
    .from("space_edits")
    .update({
      status: "approved",
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", editId);

  const requestedChanges = (edit.changes ?? {}) as Record<string, unknown>;
  const newSlug =
    typeof requestedChanges.slug === "string" && requestedChanges.slug.length > 0
      ? requestedChanges.slug
      : edit.spaces?.slug;
  revalidatePath("/", "layout");
  if (!newSlug) redirect("/?space_edit_approved=1");
  redirect(`/spaces/${newSlug}?space_edit_approved=1`);
}

// ------------------------------------------------------------
// Ecosystem admin: reject a space edit request
// ------------------------------------------------------------

export async function rejectSpaceEdit(formData: FormData) {
  const profile = await getProfile();
  const editId = String(formData.get("edit_id") ?? "");

  if (
    !profile ||
    profile.role !== "ecosystem_admin" ||
    profile.status !== "approved"
  ) {
    redirect("/?error=unauthorized");
  }
  if (!editId) redirect("/?error=missing-id");

  const supabase = await createClient();
  const { data: edit, error: editError } = await supabase
    .from("space_edits")
    .select("status, spaces(slug)")
    .eq("id", editId)
    .single();

  if (editError || !edit) {
    redirect("/?error=invalid-edit");
  }

  if (edit.status !== "pending") {
    redirect("/?error=edit-already-processed");
  }

  const { error } = await supabase
    .from("space_edits")
    .update({
      status: "rejected",
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", editId);

  if (error) redirect(`/?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/spaces/[slug]", "page");
  const slug = edit.spaces?.slug;
  if (!slug) redirect("/?space_edit_rejected=1");
  redirect(`/spaces/${slug}?space_edit_rejected=1`);
}
