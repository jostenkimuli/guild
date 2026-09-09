import type { Database } from "@/lib/supabase/database.types";

export type EcosystemType = Database["public"]["Enums"]["ecosystem_type"];
export type SpaceType = Database["public"]["Enums"]["space_type"];

export const SPACE_TYPE_ORDER: readonly SpaceType[] = [
  "department",
  "innovation_hub",
  "project_group",
];

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  department: "Department",
  innovation_hub: "Innovation hub",
  project_group: "Project group",
};

export const SPACE_TYPE_PLURALS: Record<SpaceType, string> = {
  department: "Departments",
  innovation_hub: "Innovation hubs",
  project_group: "Project groups",
};

export const SPACE_TYPE_NAV_LABELS: Record<SpaceType, string> = {
  department: "Departments",
  innovation_hub: "Innovation hubs",
  project_group: "Project groups",
};

export function spaceTypeLabel(type: string | null | undefined): string {
  if (type && type in SPACE_TYPE_LABELS) {
    return SPACE_TYPE_LABELS[type as SpaceType];
  }
  return type ?? "Space";
}

export function spaceTypePlural(type: string | null | undefined): string {
  if (type && type in SPACE_TYPE_PLURALS) {
    return SPACE_TYPE_PLURALS[type as SpaceType];
  }
  return type ?? "Spaces";
}

export type ConcreteEcosystemType = Exclude<
  EcosystemType,
  "organization" | "macro_alliance"
>;

export const ECOSYSTEM_TYPE_LABELS: Record<ConcreteEcosystemType, string> = {
  nursery_school: "Nursery School",
  primary_school: "Primary School",
  secondary_school: "Secondary School",
  university: "University",
};

export function ecosystemTypeLabel(type: string | null | undefined): string {
  if (type && type in ECOSYSTEM_TYPE_LABELS) {
    return ECOSYSTEM_TYPE_LABELS[type as ConcreteEcosystemType];
  }
  return type ?? "School";
}

/**
 * K-12 school ecosystems (nursery, primary, secondary). These get
 * the dash.html school-creation wizard, the school admin dashboard
 * and the theme/badge customization experience. Universities and
 * macro/organization ecosystems keep the generic flow.
 */
export const SCHOOL_TYPES: ReadonlySet<ConcreteEcosystemType> = new Set([
  "nursery_school",
  "primary_school",
  "secondary_school",
]);

export function isSchoolType(type: string | null | undefined): boolean {
  return !!type && SCHOOL_TYPES.has(type as ConcreteEcosystemType);
}

/**
 * The display identity of an ecosystem: name followed by the type
 * (e.g. "Maggie Primary School"), unless the name already contains
 * any of the words from the type (e.g. "A Sample School Ecosystem"
 * already contains "School", so it stays as-is).
 */
export function ecosystemDisplayName(ecosystem: {
  name: string;
  type: string;
}): string {
  const typeLabel = ecosystemTypeLabel(ecosystem.type);
  const typeWords = typeLabel.toLowerCase().split(/\s+/);
  const nameWords = new Set(ecosystem.name.toLowerCase().split(/\s+/));
  const containsTypeWord = typeWords.some((word) => nameWords.has(word));
  return containsTypeWord ? ecosystem.name : `${ecosystem.name} ${typeLabel}`;
}
