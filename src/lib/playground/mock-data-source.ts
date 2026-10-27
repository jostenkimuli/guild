// Adapter that lets the curriculum-admin preview toggle between the mock
// data layer and the database-backed `public.curriculum_nodes` spine.
//
// The preview (and its getters) read the mock module arrays directly.
// Instead of rewriting every call site, the active source is applied by
// bulk-swapping those module arrays (via the setters in mock.ts /
// thematic-curriculum.ts). `buildDatabaseDataset` reconstructs the
// mock-shaped national-standard documents FROM the spine rows — the
// inverse of `scripts/seed-national-standards.mjs`.

import {
  type MockCompetenceType,
  type MockCurriculumOutcome,
  type MockNationalSyllabus,
  type MockNationalTemplate,
  type MockTemplateLevel,
  type MockTemplateStatus,
  type MockTemplateSubject,
  type MockSyllabusAssessment,
  type MockSyllabusTopic,
  mockCurriculumOutcomes,
  mockNationalSyllabi,
  mockNationalTemplates,
  mockSyllabusTopics,
  mockTemplateLevels,
  mockTemplateSubjects,
  setMockNationalStandardDataset,
} from "@/lib/playground/mock";
import {
  type MockThematicCurriculum,
  type MockThematicFidelity,
  type MockThematicLearningArea,
  type MockThematicSubTheme,
  type MockThematicTheme,
  mockThematicCurricula,
  setMockThematicCurricula,
} from "@/lib/playground/thematic-curriculum";
import type { Tables } from "@/lib/supabase/database.types";

export type CurriculumNodeRow = Pick<
  Tables<"curriculum_nodes">,
  | "curriculum_node_id"
  | "parent_node_id"
  | "type_id"
  | "title"
  | "code"
  | "order_index"
  | "status"
  | "published_at"
  | "payload"
>;
export type NodeTypeRow = Tables<"node_types">;

export interface CurriculumDatabaseDataset {
  nodeCount: number;
  counts: Record<string, number>;
  templates: MockNationalTemplate[];
  templateSubjects: MockTemplateSubject[];
  templateLevels: MockTemplateLevel[];
  nationalSyllabi: MockNationalSyllabus[];
  syllabusTopics: MockSyllabusTopic[];
  curriculumOutcomes: MockCurriculumOutcome[];
  thematicCurricula: MockThematicCurriculum[];
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Slug used to derive mock-style ids from spine `code` values. */
export const spineSlug = slug;

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Reconstruct the mock-shaped national standard from spine rows. */
export function buildDatabaseDataset(
  nodes: CurriculumNodeRow[],
  typeIdsByTypeName: Map<string, number>,
): CurriculumDatabaseDataset {
  const typeNameById = new Map<number, string>();
  for (const [name, id] of typeIdsByTypeName) typeNameById.set(id, name);
  const typeName = (node: CurriculumNodeRow) =>
    typeNameById.get(node.type_id ?? -1) ?? "unknown";

  const childrenBy = new Map<number, CurriculumNodeRow[]>();
  for (const node of nodes) {
    if (node.parent_node_id == null) continue;
    const list = childrenBy.get(node.parent_node_id) ?? [];
    list.push(node);
    childrenBy.set(node.parent_node_id, list);
  }
  const childrenOf = (id: number | null, type?: string) =>
    (id == null ? [] : childrenBy.get(id) ?? [])
      .filter((node) => !type || typeName(node) === type)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const payload = (node: CurriculumNodeRow) =>
    (node.payload ?? {}) as Record<string, unknown>;

  const counts: Record<string, number> = {};
  for (const node of nodes) {
    const name = typeName(node);
    counts[name] = (counts[name] ?? 0) + 1;
  }

  const templates: MockNationalTemplate[] = [];
  const templateSubjects: MockTemplateSubject[] = [];
  const templateLevels: MockTemplateLevel[] = [];
  const nationalSyllabi: MockNationalSyllabus[] = [];
  const syllabusTopics: MockSyllabusTopic[] = [];
  const curriculumOutcomes: MockCurriculumOutcome[] = [];
  const thematicCurricula: MockThematicCurriculum[] = [];

  for (const root of nodes.filter(
    (node) => typeName(node) === "curriculum_template",
  )) {
    const p = payload(root);
    const templateId = `nat-${slug(root.code ?? root.title)}`;

    if (p.structure === "thematic") {
      const doc: MockThematicCurriculum = {
        id: `thematic-${slug(root.code ?? root.title)}`,
        name: root.title,
        code: root.code ?? "",
        level: asString(p.level) ?? "P1",
        version: asString(p.version) ?? "1.0",
        country: asString(p.country) ?? "Uganda",
        issuer: asString(p.issuer) ?? "",
        year_note: asString(p.year_note) ?? "",
        edition: asString(p.edition),
        isbn: asString(p.isbn),
        status: root.status as MockThematicCurriculum["status"],
        cycles: asArray(p.cycles),
        document_note: asString(p.document_note) ?? "",
        national_aims: asArray<string>(p.national_aims),
        aims_of_primary_education: asArray<string>(p.aims_of_primary_education),
        approach: asArray<string>(p.approach),
        medium_of_instruction: asString(p.medium_of_instruction),
        period_allocation: asArray(p.period_allocation),
        timetable_notes: asArray<string>(p.timetable_notes),
        learning_resources: asArray<string>(p.learning_resources),
        assessment_approach: asArray<string>(p.assessment_approach),
        themes: [],
        learning_areas: [],
      };

      for (const themeNode of childrenOf(root.curriculum_node_id, "theme")) {
        const tp = payload(themeNode);
        const subThemes: MockThematicSubTheme[] = childrenOf(
          themeNode.curriculum_node_id,
          "sub_theme",
        ).map((subTheme) => {
          const sp = payload(subTheme);
          return {
            id: `sub-${slug(subTheme.code ?? subTheme.title)}`,
            code: subTheme.code ?? "",
            title: subTheme.title,
            content: asArray<string>(sp.content),
            blocks: asArray(sp.blocks),
          };
        });
        const theme: MockThematicTheme = {
          id: `thm-${slug(themeNode.code ?? themeNode.title)}`,
          code: themeNode.code ?? "",
          title: themeNode.title,
          term: asNumber(tp.term),
          weeks: asString(tp.weeks),
          learning_outcome: asString(tp.learning_outcome),
          sub_themes: subThemes,
          assessment_guidelines: asArray(tp.assessment_guidelines),
          fidelity: (tp.fidelity as MockThematicFidelity) ?? "outline",
          note: asString(tp.note) ?? undefined,
        };
        doc.themes.push(theme);
      }

      for (const areaNode of childrenOf(
        root.curriculum_node_id,
        "learning_area",
      )) {
        const ap = payload(areaNode);
        const area: MockThematicLearningArea = {
          id: `area-${slug(areaNode.code ?? areaNode.title)}`,
          title: areaNode.title,
          code: areaNode.code ?? "",
          outcome: asString(ap.outcome),
          organisation: asString(ap.organisation) ?? "",
          notes: asArray<string>(ap.notes),
          fidelity: (ap.fidelity as MockThematicFidelity) ?? "outline",
        };
        doc.learning_areas.push(area);
      }

      thematicCurricula.push(doc);
      continue;
    }

    templates.push({
      id: templateId,
      name: root.title,
      code: root.code ?? "",
      country: asString(p.country) ?? "Uganda",
      year: asNumber(p.year) ?? new Date().getFullYear(),
      version: asString(p.version) ?? "1.0",
      status: root.status as MockTemplateStatus,
      national_aims: asArray<string>(p.national_aims).length
        ? asArray<string>(p.national_aims)
        : null,
      aims_of_primary_education: asArray<string>(p.aims_of_primary_education)
        .length
        ? asArray<string>(p.aims_of_primary_education)
        : null,
      values_text: asString(p.values_text),
      generic_skills: asArray<string>(p.generic_skills).length
        ? asArray<string>(p.generic_skills)
        : null,
      cross_cutting_issues: asArray<string>(p.cross_cutting_issues).length
        ? asArray<string>(p.cross_cutting_issues)
        : null,
      pedagogy_text: asString(p.pedagogy_text),
      assessment_requirements: (p.assessment_requirements as MockNationalTemplate["assessment_requirements"]) ?? null,
      time_allocation: asArray(p.time_allocation).length
        ? (p.time_allocation as MockNationalTemplate["time_allocation"])
        : null,
      approved_materials: asArray<string>(p.approved_materials).length
        ? asArray<string>(p.approved_materials)
        : [],
      published_at: root.published_at,
      created_by: asString(p.created_by) ?? "Super admin",
    });

    for (const subjectNode of childrenOf(root.curriculum_node_id, "subject")) {
      templateSubjects.push({
        id: `subj-${slug(subjectNode.code ?? subjectNode.title)}`,
        template_id: templateId,
        name: subjectNode.title,
        code: subjectNode.code ?? "",
        sequence: subjectNode.order_index ?? 0,
      });
    }

    for (const levelNode of childrenOf(root.curriculum_node_id, "level")) {
      templateLevels.push({
        id: `lvl-${slug(levelNode.code ?? levelNode.title)}`,
        template_id: templateId,
        name: levelNode.title,
        sequence: levelNode.order_index ?? 0,
      });
    }

    for (const subjectNode of childrenOf(root.curriculum_node_id, "subject")) {
      const subjectId = `subj-${slug(subjectNode.code ?? subjectNode.title)}`;
      for (const syllabusNode of childrenOf(
        subjectNode.curriculum_node_id,
        "national_syllabus",
      )) {
        const sp = payload(syllabusNode);
        const syllabusId = `syl-${slug(syllabusNode.code ?? syllabusNode.title)}`;
        const syllabus: MockNationalSyllabus = {
          id: syllabusId,
          template_id: templateId,
          subject_id: subjectId,
          level_id: `lvl-${slug(asString(sp.level_id) ?? "")}`,
          code: syllabusNode.code ?? "",
          title: syllabusNode.title,
          time_allocation: asString(sp.time_allocation),
          assessment_requirements: asString(sp.assessment_requirements),
          pedagogy_notes: asString(sp.pedagogy_notes),
          approved_materials: asArray<string>(sp.approved_materials),
          teaching_strategies: asArray<string>(sp.teaching_strategies),
          typical_activities: asArray<string>(sp.typical_activities),
          assessment_plan: asArray<MockSyllabusAssessment>(sp.assessment_plan)
            .length
            ? asArray<MockSyllabusAssessment>(sp.assessment_plan)
            : null,
        };
        nationalSyllabi.push(syllabus);

        for (const topicNode of childrenOf(
          syllabusNode.curriculum_node_id,
          "syllabus_topic",
        )) {
          const tp = payload(topicNode);
          syllabusTopics.push({
            id: `top-${slug(topicNode.code ?? topicNode.title)}`,
            syllabus_id: syllabusId,
            code: topicNode.code ?? "",
            title: topicNode.title,
            description: asString(tp.description),
            duration_weeks: asNumber(tp.duration_weeks),
            sequence: topicNode.order_index ?? 0,
          });
        }

        for (const outcomeNode of childrenOf(
          syllabusNode.curriculum_node_id,
          "outcome",
        )) {
          const op = payload(outcomeNode);
          const outcomeCode = outcomeNode.code ?? outcomeNode.title;
          curriculumOutcomes.push({
            id: `oc-${slug(outcomeCode)}`,
            syllabus_id: syllabusId,
            code: outcomeCode,
            description: outcomeNode.title,
            competence_type:
              (op.competence_type as MockCompetenceType) ?? "knowledge",
            sequence: asNumber(op.sequence) ?? outcomeNode.order_index ?? 0,
            indicators: childrenOf(
              outcomeNode.curriculum_node_id,
              "indicator",
            ).map((indicatorNode) => ({
              id: `ind-${slug(indicatorNode.code ?? indicatorNode.title)}`,
              sequence: indicatorNode.order_index ?? 1,
              description: indicatorNode.title,
            })),
          });
        }
      }
    }
  }

  return {
    nodeCount: nodes.length,
    counts,
    templates,
    templateSubjects,
    templateLevels,
    nationalSyllabi,
    syllabusTopics,
    curriculumOutcomes,
    thematicCurricula,
  };
}

const originalNationalStandard = {
  templates: mockNationalTemplates,
  templateSubjects: mockTemplateSubjects,
  templateLevels: mockTemplateLevels,
  nationalSyllabi: mockNationalSyllabi,
  syllabusTopics: mockSyllabusTopics,
  curriculumOutcomes: mockCurriculumOutcomes,
};

const originalThematic = mockThematicCurricula;

let activeSource: "mock" | "database" = "mock";

/** Which data source the module arrays currently point at. */
export function getActiveSource(): "mock" | "database" {
  return activeSource;
}

/** Point the mock module arrays at a DB-reconstructed dataset. */
export function applyDatabaseDataset(
  dataset: CurriculumDatabaseDataset,
): void {
  setMockNationalStandardDataset({
    templates: dataset.templates.map((row) => ({ ...row })),
    templateSubjects: dataset.templateSubjects.map((row) => ({ ...row })),
    templateLevels: dataset.templateLevels.map((row) => ({ ...row })),
    nationalSyllabi: dataset.nationalSyllabi.map((row) => ({ ...row })),
    syllabusTopics: dataset.syllabusTopics.map((row) => ({ ...row })),
    curriculumOutcomes: dataset.curriculumOutcomes.map((row) => ({ ...row })),
  });
  setMockThematicCurricula(
    dataset.thematicCurricula.map((row) => ({ ...row })),
  );
  activeSource = "database";
}

/** Restore the original mock module arrays. */
export function applyMockDataset(): void {
  setMockNationalStandardDataset({
    templates: originalNationalStandard.templates.map((row) => ({ ...row })),
    templateSubjects: originalNationalStandard.templateSubjects.map((row) => ({
      ...row,
    })),
    templateLevels: originalNationalStandard.templateLevels.map((row) => ({
      ...row,
    })),
    nationalSyllabi: originalNationalStandard.nationalSyllabi.map((row) => ({
      ...row,
    })),
    syllabusTopics: originalNationalStandard.syllabusTopics.map((row) => ({
      ...row,
    })),
    curriculumOutcomes: originalNationalStandard.curriculumOutcomes.map(
      (row) => ({ ...row }),
    ),
  });
  setMockThematicCurricula(originalThematic.map((row) => ({ ...row })));
  activeSource = "mock";
}