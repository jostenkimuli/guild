"use server";

import { revalidatePath } from "next/cache";

import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_THEME,
  isSupportingTone,
} from "@/lib/theme";

export type ThemeActionState = {
  success: boolean;
  error?: string;
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const URL_RE = /^https?:\/\/.+/;

function cleanValue(value: string | null | undefined, max = 1000): string {
  return (value ?? "").trim().slice(0, max);
}

export async function updateEcosystemTheme(
  _: ThemeActionState,
  formData: FormData,
): Promise<ThemeActionState> {
  const ecosystemId = String(formData.get("ecosystem_id") ?? "").trim();
  if (!ecosystemId) return { success: false, error: "Ecosystem is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "ecosystem_admin" || profile.status !== "approved") {
    return { success: false, error: "Only an approved ecosystem admin can edit school branding." };
  }

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("id, slug, raw_ecosystem_meta_data")
    .eq("id", ecosystemId)
    .maybeSingle();
  if (!ecosystem) return { success: false, error: "Ecosystem not found." };
  const { data: assignment } = await supabase
    .from("ecosystem_staff")
    .select("user_id")
    .eq("ecosystem_id", ecosystemId)
    .eq("user_id", user.id)
    .eq("role", "ecosystem_admin")
    .maybeSingle();
  if (!assignment) return { success: false, error: "You do not administer this ecosystem." };

  const name = cleanValue(String(formData.get("name") ?? ""), 120);
  if (name.length < 2) {
    return { success: false, error: "School name must be at least 2 characters." };
  }

  const supporting = cleanValue(String(formData.get("theme_supporting") ?? ""), 32);
  if (!isSupportingTone(supporting)) {
    return { success: false, error: "Invalid supporting tone." };
  }

  const primaryRaw = cleanValue(String(formData.get("theme_primary") ?? ""), 16);
  const accentRaw = cleanValue(String(formData.get("theme_accent") ?? ""), 16);
  const badgeUrl = cleanValue(String(formData.get("badge_url") ?? ""), 500) || null;
  const existingMeta = ecosystem.raw_ecosystem_meta_data;
  const rawMeta: Record<string, Json> =
    existingMeta && typeof existingMeta === "object" && !Array.isArray(existingMeta)
      ? Object.fromEntries(Object.entries(existingMeta).filter((entry) => entry[1] !== undefined)) as Record<string, Json>
      : {};
  for (const key of [
    "director_name", "director_contact", "director_email",
    "headteacher_name", "headteacher_contact", "headteacher_email",
    "school_location", "country", "region", "district", "sub_county", "parish",
  ]) {
    const value = cleanValue(String(formData.get(key) ?? ""), 120);
    rawMeta[key] = value;
    if (key.endsWith("_email") && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { success: false, error: `${key.replaceAll("_", " ")} is not a valid email.` };
    }
  }

  if (primaryRaw && !HEX_RE.test(primaryRaw)) {
    return { success: false, error: "Dominant color must be a hex value like #0040e0." };
  }
  if (accentRaw && !HEX_RE.test(accentRaw)) {
    return { success: false, error: "Accent must be a hex value like #10b981." };
  }
  if (badgeUrl && !URL_RE.test(badgeUrl)) {
    return { success: false, error: "Badge URL is not valid." };
  }

  const { error } = await supabase
    .from("ecosystems")
    .update({
      name,
      vision: cleanValue(String(formData.get("vision") ?? "")) || null,
      mission: cleanValue(String(formData.get("mission") ?? "")) || null,
      description: cleanValue(String(formData.get("description") ?? "")) || null,
      raw_ecosystem_meta_data: rawMeta,
      badge_url: badgeUrl,
      theme_primary: primaryRaw || null,
      theme_supporting: supporting,
      theme_accent: accentRaw || null,
    })
    .eq("id", ecosystemId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  revalidatePath(`/ecosystem/${ecosystem.slug}`, "layout");
  return { success: true };
}

export async function resetEcosystemTheme(
  _: ThemeActionState,
  formData: FormData,
): Promise<ThemeActionState> {
  const ecosystemId = String(formData.get("ecosystem_id") ?? "").trim();
  if (!ecosystemId) return { success: false, error: "Ecosystem is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "ecosystem_admin" || profile.status !== "approved") {
    return { success: false, error: "Only an approved ecosystem admin can edit school branding." };
  }

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("id, slug")
    .eq("id", ecosystemId)
    .maybeSingle();
  if (!ecosystem) return { success: false, error: "Ecosystem not found." };
  const { data: assignment } = await supabase
    .from("ecosystem_staff")
    .select("user_id")
    .eq("ecosystem_id", ecosystemId)
    .eq("user_id", user.id)
    .eq("role", "ecosystem_admin")
    .maybeSingle();
  if (!assignment) return { success: false, error: "You do not administer this ecosystem." };

  const payload: Database["public"]["Tables"]["ecosystems"]["Update"] = {
    theme_primary: DEFAULT_THEME.primary ?? null,
    theme_supporting: DEFAULT_THEME.supporting ?? "modern_blue",
    theme_accent: DEFAULT_THEME.accent ?? null,
  };

  const { error } = await supabase.from("ecosystems").update(payload).eq("id", ecosystemId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  revalidatePath(`/ecosystem/${ecosystem.slug}`, "layout");
  return { success: true };
}
