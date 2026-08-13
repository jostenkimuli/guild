"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ConsoleActionState = {
  success: boolean;
  error?: string;
  code?: string;
};

type ProfileRow = {
  id: string;
  role: Database["public"]["Enums"]["profile_role"];
  status: Database["public"]["Enums"]["profile_status"];
  must_change_password: boolean;
};

async function getProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, role, status, must_change_password")
    .eq("id", user.id)
    .single();
  return data;
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
// Program admin: create an ecosystem-admin account (pending)
// ------------------------------------------------------------

export async function createEcosystemAdmin(
  _: ConsoleActionState,
  formData: FormData,
): Promise<ConsoleActionState> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "Not signed in." };

  const email = String(formData.get("email") ?? "").trim();
  const tempPassword = String(formData.get("temp_password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !tempPassword) {
    return { success: false, error: "Email and a temporary password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_user", {
    p_email: email,
    p_temp_password: tempPassword,
    p_role: "ecosystem_admin",
    p_full_name: fullName,
    p_ecosystem_id: undefined,
    p_status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ------------------------------------------------------------
// Program admin: approve a pending ecosystem-admin account
// ------------------------------------------------------------

export async function approveEcosystemAdmin(formData: FormData) {
  const profile = await getProfile();
  const userId = String(formData.get("user_id") ?? "");

  if (!profile || profile.role !== "program_admin" || profile.status !== "approved") {
    redirect("/console/program?error=unauthorized");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", userId)
    .eq("role", "ecosystem_admin");

  if (error) redirect(`/console/program?error=${encodeURIComponent(error.message)}`);
  redirect("/console/program?approved=1");
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
  if (!name) return { success: false, error: "Name is required." };

  const type = String(formData.get("type") ?? "school") as Database["public"]["Enums"]["ecosystem_type"];

  const meta = {
    director_name: String(formData.get("director_name") ?? "").trim(),
    director_contact: String(formData.get("director_contact") ?? "").trim(),
    director_email: String(formData.get("director_email") ?? "").trim(),
    headteacher_name: String(formData.get("headteacher_name") ?? "").trim(),
    headteacher_contact: String(formData.get("headteacher_contact") ?? "").trim(),
    headteacher_email: String(formData.get("headteacher_email") ?? "").trim(),
    school_location: String(formData.get("school_location") ?? "").trim(),
  };

  const supabase = await createClient();
  const { error } = await supabase.from("ecosystems").insert({
    name,
    type,
    vision: String(formData.get("vision") ?? "").trim() || null,
    mission: String(formData.get("mission") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    raw_ecosystem_meta_data: meta,
    created_by: profile.id,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
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

  if (!email || !tempPassword || !ecosystemId) {
    return { success: false, error: "Email, temporary password and ecosystem are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_user", {
    p_email: email,
    p_temp_password: tempPassword,
    p_role: "space_admin",
    p_full_name: fullName,
    p_ecosystem_id: ecosystemId,
    p_status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ------------------------------------------------------------
// Space admin: create a space in their ecosystem
// ------------------------------------------------------------

export async function createSpace(
  _: ConsoleActionState,
  formData: FormData,
): Promise<ConsoleActionState> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "Not signed in." };

  const ecosystemId = String(formData.get("ecosystem_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!ecosystemId || !name) {
    return { success: false, error: "Ecosystem and space name are required." };
  }

  const type = String(formData.get("type") ?? "classroom") as Database["public"]["Enums"]["space_type"];
  const slug =
    String(formData.get("slug") ?? "").trim() || slugify(name) || null;

  const supabase = await createClient();
  const { error } = await supabase.from("spaces").insert({
    ecosystem_id: ecosystemId,
    name,
    slug,
    description: String(formData.get("description") ?? "").trim() || null,
    type,
    created_by: profile.id,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
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

  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  const expiresInDays = String(formData.get("expires_in_days") ?? "").trim();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + Number(expiresInDays) * 86_400_000).toISOString()
    : null;

  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
    return { success: false, error: "Max uses must be a positive whole number." };
  }

  const code = generateCode();

  const supabase = await createClient();
  const { error } = await supabase.from("invitation_codes").insert({
    space_id: spaceId,
    code,
    role,
    created_by: profile.id,
    max_uses: maxUses,
    expires_at: expiresAt,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, code };
}
