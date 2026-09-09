// Client-side helpers for uploading a school crest/badge to
// Supabase Storage. Only import from client components.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export const BADGE_BUCKET = "ecosystem-badges";
export const BADGE_MAX_BYTES = 5 * 1024 * 1024;

const BADGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

function badgePath(ecosystemId: string, file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  return `${ecosystemId}/badge.${ext}`;
}

export function validateBadgeFile(file: File): string | null {
  if (!BADGE_MIME_TYPES.has(file.type)) {
    return "Badge must be a PNG, JPG, WEBP or SVG image.";
  }
  if (file.size > BADGE_MAX_BYTES) {
    return "Badge must be 5 MB or smaller.";
  }
  return null;
}

/**
 * Uploads the badge for an ecosystem and returns its public URL.
 * Any previously uploaded badge objects for the ecosystem are
 * removed so the storage path stays tidy.
 */
export async function uploadBadge(
  supabase: SupabaseClient<Database>,
  ecosystemId: string,
  file: File,
): Promise<{ url: string; error?: never } | { url?: never; error: string }> {
  const invalid = validateBadgeFile(file);
  if (invalid) return { error: invalid };

  const path = badgePath(ecosystemId, file);

  const { error: uploadError } = await supabase.storage
    .from(BADGE_BUCKET)
    .upload(path, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type,
    });

  if (uploadError) return { error: uploadError.message };

  // Clean up stale extensions (e.g. previous .png when now .webp).
  const { data: stale, error: listError } = await supabase.storage
    .from(BADGE_BUCKET)
    .list(ecosystemId);
  if (!listError && stale) {
    const removable = stale
      .filter((o) => o.name.startsWith("badge.") && o.name !== path.split("/").pop())
      .map((o) => `${ecosystemId}/${o.name}`);
    if (removable.length > 0) {
      await supabase.storage.from(BADGE_BUCKET).remove(removable);
    }
  }

  const { data } = supabase.storage.from(BADGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function removeBadge(
  supabase: SupabaseClient<Database>,
  ecosystemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error: listError } = await supabase.storage
    .from(BADGE_BUCKET)
    .list(ecosystemId);
  if (listError) return { ok: false, error: listError.message };

  const removable = (data ?? [])
    .filter((o) => o.name.startsWith("badge."))
    .map((o) => `${ecosystemId}/${o.name}`);
  if (removable.length === 0) return { ok: true };

  const { error } = await supabase.storage.from(BADGE_BUCKET).remove(removable);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}