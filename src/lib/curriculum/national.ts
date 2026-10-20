import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { RequirementLevel } from "./requirement";

// Reads from the national reference tables. The client is passed in, so this
// module stays importable from client components (types + pure helpers).
type SupabaseLike = SupabaseClient<Database>;

export type NationalStrand = {
  id: string;
  key: string;
  name: string;
  is_thematic: boolean;
  sort_order: number;
};

export type NationalCompetence = {
  id: string;
  strand_id: string;
  description: string;
  requirement_level: RequirementLevel;
  sort_order: number;
};

export type NationalSubtheme = {
  id: string;
  code: string;
  position: number;
  name: string;
  content: string;
  competences: NationalCompetence[];
};

export type NationalGuideline = {
  id: string;
  strand_id: string;
  description: string;
  sort_order: number;
};

export type NationalTheme = {
  id: string;
  term_no: number;
  theme_no: number;
  name: string;
  learning_outcome: string;
  subthemes: NationalSubtheme[];
  guidelines: NationalGuideline[];
};

export type NationalAllocation = {
  id: string;
  key: string;
  label: string;
  group_label: string | null;
  periods: number;
  block_size: number;
  follows_key: string | null;
  note: string | null;
  sort_order: number;
};

export type NationalRule = {
  id: string;
  rule_group: "language" | "timetable" | "assessment" | "teaching";
  description: string;
  requirement_level: RequirementLevel;
  sort_order: number;
};

export type NationalAim = {
  id: string;
  kind: "national" | "primary";
  position: number;
  description: string;
};

export type NationalAreaUnit = {
  id: string;
  strand_id: string;
  term_no: number;
  weeks_label: string;
  title: string;
  learning_outcome: string | null;
  sort_order: number;
};

export type NationalCurriculumSummary = {
  id: string;
  slug: string;
  class_level: string;
  title: string;
};

export type NationalCurriculum = {
  id: string;
  slug: string;
  title: string;
  authority: string;
  cycle_label: string;
  class_level: string;
  edition: string;
  source_url: string | null;
  orientation_terms: number[];
  aims: NationalAim[];
  strands: NationalStrand[];
  themes: NationalTheme[];
  allocations: NationalAllocation[];
  rules: NationalRule[];
  areaUnits: NationalAreaUnit[];
};

const bySort = <T extends { sort_order: number }>(a: T, b: T) =>
  a.sort_order - b.sort_order;

/** The national curricula a school of this type can adopt. */
export async function listNationalCurricula(
  supabase: SupabaseLike,
  ecosystemType: Database["public"]["Enums"]["ecosystem_type"],
): Promise<NationalCurriculumSummary[]> {
  const { data } = await supabase
    .from("national_curricula")
    .select("id, slug, class_level, title")
    .eq("ecosystem_type", ecosystemType)
    .order("class_level");
  return data ?? [];
}

export type AdminCurriculumSummary = {
  id: string;
  slug: string;
  title: string;
  class_level: string;
  ecosystem_type: Database["public"]["Enums"]["ecosystem_type"];
  authority: string;
  edition: string;
  created_at: string;
  theme_count: number;
  strand_count: number;
};

/** Every national curriculum, for the platform-admin authoring list. */
export async function listAllNationalCurricula(
  supabase: SupabaseLike,
): Promise<AdminCurriculumSummary[]> {
  const { data } = await supabase
    .from("national_curricula")
    .select(
      "id, slug, title, class_level, ecosystem_type, authority, edition, created_at, curriculum_nodes(node_type), national_strands(id)",
    )
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    class_level: row.class_level,
    ecosystem_type: row.ecosystem_type,
    authority: row.authority,
    edition: row.edition,
    created_at: row.created_at,
    theme_count: row.curriculum_nodes.filter((n) => n.node_type === "theme").length,
    strand_count: row.national_strands.length,
  }));
}

type CurriculumNodeRow = {
  id: string;
  parent_id: string | null;
  node_type: string;
  strand_id: string | null;
  title: string;
  description: string;
  sequence_order: number;
  requirement_level: RequirementLevel | null;
  attributes: Record<string, unknown>;
};

/**
 * Rebuilds the theme -> sub-theme -> competence tree from a flat node list.
 * Node "type" is a plain string (no node_types lookup table) and per-type
 * facts (theme_no/term_no, code/position) live in `attributes` rather than
 * dedicated columns, so a future node_type widens the check constraint, not
 * the schema. Themes and sub-themes are the only node_types loaded today.
 */
function buildThemeTree(
  nodes: CurriculumNodeRow[],
  guidelinesByTheme: Map<string, NationalGuideline[]>,
): NationalTheme[] {
  const byParent = new Map<string | null, CurriculumNodeRow[]>();
  for (const node of nodes) {
    const list = byParent.get(node.parent_id) ?? [];
    list.push(node);
    byParent.set(node.parent_id, list);
  }
  const children = (parentId: string) =>
    [...(byParent.get(parentId) ?? [])].sort(
      (a, b) => a.sequence_order - b.sequence_order,
    );

  const themes = (byParent.get(null) ?? []).filter((n) => n.node_type === "theme");

  return [...themes]
    .sort((a, b) => a.sequence_order - b.sequence_order)
    .map((theme) => ({
      id: theme.id,
      term_no: Number(theme.attributes.term_no ?? 0),
      theme_no: Number(theme.attributes.theme_no ?? theme.sequence_order),
      name: theme.title,
      learning_outcome: theme.description,
      subthemes: children(theme.id)
        .filter((n) => n.node_type === "sub_theme")
        .map((st) => ({
          id: st.id,
          code: String(st.attributes.code ?? ""),
          position: Number(st.attributes.position ?? st.sequence_order),
          name: st.title,
          content: st.description,
          competences: children(st.id)
            .filter((n) => n.node_type === "competence")
            .map((c) => ({
              id: c.id,
              strand_id: c.strand_id ?? "",
              description: c.title,
              requirement_level: (c.requirement_level ?? "required_outcome") as RequirementLevel,
              sort_order: c.sequence_order,
            })),
        })),
      guidelines: guidelinesByTheme.get(theme.id) ?? [],
    }));
}

/** One national curriculum with everything nested, sorted for display. */
export async function loadNationalCurriculum(
  supabase: SupabaseLike,
  id: string,
): Promise<NationalCurriculum | null> {
  const { data } = await supabase
    .from("national_curricula")
    .select(
      `id, slug, title, authority, cycle_label, class_level, edition, source_url,
       orientation_terms,
       national_aims(id, kind, position, description),
       national_strands(id, key, name, is_thematic, sort_order),
       national_period_allocations(id, key, label, group_label, periods, block_size, follows_key, note, sort_order),
       national_rules(id, rule_group, description, requirement_level, sort_order)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const strands = [...data.national_strands].sort(bySort);
  const strandIds = strands.map((s) => s.id);

  const [{ data: nodes }, { data: units }] = await Promise.all([
    supabase
      .from("curriculum_nodes")
      .select(
        "id, parent_id, node_type, strand_id, title, description, sequence_order, requirement_level, attributes",
      )
      .eq("national_curriculum_id", id),
    supabase
      .from("national_area_units")
      .select("id, strand_id, term_no, weeks_label, title, learning_outcome, sort_order")
      .in("strand_id", strandIds),
  ]);

  const nodeRows = (nodes ?? []) as CurriculumNodeRow[];
  const themeNodeIds = nodeRows.filter((n) => n.node_type === "theme").map((n) => n.id);
  const { data: guidelineRows } =
    themeNodeIds.length > 0
      ? await supabase
          .from("national_assessment_guidelines")
          .select("id, theme_node_id, strand_id, description, sort_order")
          .in("theme_node_id", themeNodeIds)
      : { data: [] };

  const guidelinesByTheme = new Map<string, NationalGuideline[]>();
  for (const g of guidelineRows ?? []) {
    const list = guidelinesByTheme.get(g.theme_node_id) ?? [];
    list.push({ id: g.id, strand_id: g.strand_id, description: g.description, sort_order: g.sort_order });
    guidelinesByTheme.set(g.theme_node_id, list);
  }
  for (const list of guidelinesByTheme.values()) list.sort(bySort);

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    authority: data.authority,
    cycle_label: data.cycle_label,
    class_level: data.class_level,
    edition: data.edition,
    source_url: data.source_url,
    orientation_terms: data.orientation_terms ?? [],
    aims: [...data.national_aims].sort(
      (a, b) => a.kind.localeCompare(b.kind) || a.position - b.position,
    ) as NationalAim[],
    strands,
    themes: buildThemeTree(nodeRows, guidelinesByTheme),
    allocations: [...data.national_period_allocations].sort(bySort),
    rules: [...data.national_rules].sort(
      (a, b) =>
        a.rule_group.localeCompare(b.rule_group) || a.sort_order - b.sort_order,
    ) as NationalRule[],
    areaUnits: [...(units ?? [])].sort(
      (a, b) => a.term_no - b.term_no || a.sort_order - b.sort_order,
    ),
  };
}

export type TermWeek = {
  /** Teaching-week number within the term (orientation week counts). */
  weekNo: number;
  theme: NationalTheme;
  subtheme: NationalSubtheme;
};

/** The term's sub-themes in teaching order, numbered as school weeks. */
export function termWeeks(curriculum: NationalCurriculum, term: number): TermWeek[] {
  const offset = curriculum.orientation_terms.includes(term) ? 1 : 0;
  const weeks: TermWeek[] = [];
  for (const theme of curriculum.themes) {
    if (theme.term_no !== term) continue;
    for (const subtheme of theme.subthemes) {
      weeks.push({ weekNo: weeks.length + 1 + offset, theme, subtheme });
    }
  }
  return weeks;
}

export const TERMS = [1, 2, 3] as const;

export function thematicStrands(curriculum: NationalCurriculum) {
  return curriculum.strands.filter((s) => s.is_thematic);
}

export function areaStrands(curriculum: NationalCurriculum) {
  return curriculum.strands.filter((s) => !s.is_thematic);
}

/** Total periods a week the national curriculum requires. */
export function requiredPeriods(curriculum: NationalCurriculum): number {
  return curriculum.allocations.reduce((sum, a) => sum + a.periods, 0);
}
