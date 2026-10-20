import type { Database } from "@/lib/supabase/database.types";

export type RequirementLevel =
  Database["public"]["Enums"]["requirement_level"];

export const REQUIREMENT_LEVELS: readonly RequirementLevel[] = [
  "mandatory",
  "required_outcome",
  "flexible",
];

export const REQUIREMENT_LABELS: Record<RequirementLevel, string> = {
  mandatory: "Mandatory",
  required_outcome: "Required outcome",
  flexible: "Flexible",
};

export const REQUIREMENT_HELP: Record<RequirementLevel, string> = {
  mandatory: "Follow exactly as written.",
  required_outcome: "The child must be able to show it.",
  flexible: "The teacher chooses how.",
};

// Tailwind classes for the requirement badge, light and dark.
export const REQUIREMENT_STYLES: Record<RequirementLevel, string> = {
  mandatory:
    "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  required_outcome: "bg-primary/10 text-primary",
  flexible:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
};
