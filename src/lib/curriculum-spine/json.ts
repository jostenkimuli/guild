import type { Json } from "@/lib/supabase/database.types";

/**
 * Marshals a validated payload literal into the generated `Json` type.
 * The payloads are already CHECK-validated against their per-type JSON
 * Schemas by `node_payload_valid`, so the structural cast is safe.
 * Lives outside `"use server"` modules — server actions must all be
 * async, but this cast is synchronous.
 */
export function toJson(value: unknown): Json {
  return value as Json;
}