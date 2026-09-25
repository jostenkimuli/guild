#!/usr/bin/env node
// Seed the Cycle 1 national curriculum reference standard into the
// universal node spine (curriculum_nodes), from the single source of
// truth: src/lib/playground/mock.ts + thematic-curriculum.ts.
//
//   node scripts/seed-national-standards.mjs
//
// Idempotent: existing spine rows for the national-standard node types
// are deleted first, then rebuilt from the mocks. Requires a running
// local Supabase stack (supabase start); credentials come from
// SUPABASE_API_URL / SUPABASE_SERVICE_ROLE_KEY env vars or the local
// `supabase status` output.

import { execSync } from "node:child_process";
import {
  mockNationalTemplates,
  mockTemplateSubjects,
  mockTemplateLevels,
  mockNationalSyllabi,
  mockSyllabusTopics,
  mockCurriculumOutcomes,
} from "../src/lib/playground/mock.ts";
import { mockThematicCurricula } from "../src/lib/playground/thematic-curriculum.ts";
import { ncdcComponentManifest } from "../src/lib/curriculum-spine/manifest.ts";

const SPINE_TYPES = [
  "curriculum_template",
  "subject",
  "level",
  "national_syllabus",
  "syllabus_topic",
  "outcome",
  "indicator",
  "theme",
  "sub_theme",
  "learning_area",
];

function getConfig() {
  if (process.env.SUPABASE_API_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      base: `${process.env.SUPABASE_API_URL.replace(/\/$/, "")}/rest/v1`,
      key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }
  const raw = execSync("supabase status 2>&1", { encoding: "utf8" });
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Could not parse `supabase status` output.");
  const info = JSON.parse(match[0]);
  const apiUrl = (info.API_URL ?? "http://127.0.0.1:55421").replace(/\/$/, "");
  return { base: `${apiUrl}/rest/v1`, key: info.SERVICE_ROLE_KEY };
}

const { base, key } = getConfig();

async function api(path, { method = "GET", body, prefer } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  // note: fetch never rejects on non-ok, so we materialize a real error
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${text}${body ? `\nBODY: ${JSON.stringify(body).slice(0, 400)}` : ""}`);
  }
  return text ? JSON.parse(text) : null;
}

const nodeTypes = await api("/node_types?select=type_id,type_name");
const TYPES = {};
for (const row of nodeTypes || []) TYPES[row.type_name] = row.type_id;
for (const name of SPINE_TYPES) {
  if (!TYPES[name]) throw new Error(`node_type "${name}" missing — run db:reset first.`);
}

await api(
  `/curriculum_nodes?type_id=in.(${SPINE_TYPES.map((t) => TYPES[t]).join(",")})`,
  { method: "DELETE" },
);

async function insertNode({ title, code, type_id, parent_node_id = null, order_index = 0, payload = {}, status, published_at }) {
  const [row] = await api("/curriculum_nodes", {
    method: "POST",
    prefer: "return=representation",
    body: [{ title, code, type_id, parent_node_id, order_index, payload, status, published_at }],
  });
  if (!row?.curriculum_node_id) throw new Error(`Insert failed for "${title}" (${code}).`);
  return row;
}

// ---------------------------------------------------------------
// Subject arm — national templates
// ---------------------------------------------------------------

const levelNodesByMockId = {};
const subjectNodesByMockId = {};
let totals = {};

function count(type) {
  totals[type] = (totals[type] ?? 0) + 1;
}

for (const template of mockNationalTemplates) {
  const root = await insertNode({
    title: template.name,
    code: template.code,
    type_id: TYPES.curriculum_template,
    order_index: 0,
    status: template.status,
    published_at: template.published_at ?? null,
    payload: {
      structure: "subject",
      component_manifest: ncdcComponentManifest("subject"),
      code: template.code,
      country: template.country,
      year: template.year,
      version: template.version,
      national_aims: template.national_aims,
      aims_of_primary_education: template.aims_of_primary_education,
      values_text: template.values_text,
      generic_skills: template.generic_skills,
      cross_cutting_issues: template.cross_cutting_issues,
      pedagogy_text: template.pedagogy_text,
      assessment_requirements: template.assessment_requirements,
      time_allocation: template.time_allocation,
      approved_materials: template.approved_materials,
      created_by: template.created_by,
    },
  });
  count("curriculum_template");

  const nativeSubjects = template.id === "nat-upe";
  if (!nativeSubjects) continue;

  for (const subject of mockTemplateSubjects.filter((s) => s.template_id === template.id)) {
    const nd = await insertNode({
      title: subject.name,
      code: subject.code,
      type_id: TYPES.subject,
      parent_node_id: root.curriculum_node_id,
      order_index: subject.sequence,
      payload: { code: subject.code, sequence: subject.sequence },
    });
    subjectNodesByMockId[subject.id] = nd;
    count("subject");
  }

  for (const level of mockTemplateLevels.filter((l) => l.template_id === template.id)) {
    const code = `P${level.sequence}`;
    const nd = await insertNode({
      title: level.name,
      code,
      type_id: TYPES.level,
      parent_node_id: root.curriculum_node_id,
      order_index: level.sequence,
      payload: { code, sequence: level.sequence },
    });
    levelNodesByMockId[level.id] = nd;
    count("level");
  }

  for (const syllabus of mockNationalSyllabi.filter((s) => s.template_id === template.id)) {
    const subjectNode = subjectNodesByMockId[syllabus.subject_id];
    const levelNode = levelNodesByMockId[syllabus.level_id];
    if (!subjectNode || !levelNode) continue;

    const levelCode = levelNode.code;
    const levelName = levelNode.title;
    const syl = await insertNode({
      title: syllabus.title,
      code: syllabus.code,
      type_id: TYPES.national_syllabus,
      parent_node_id: subjectNode.curriculum_node_id,
      order_index: 0,
      payload: {
        code: syllabus.code,
        subject_id: subjectNode.code,
        subject_name: subjectNode.title,
        level_id: levelCode,
        level_name: levelName,
        time_allocation: syllabus.time_allocation,
        assessment_requirements: syllabus.assessment_requirements,
        pedagogy_notes: syllabus.pedagogy_notes,
        approved_materials: syllabus.approved_materials,
        teaching_strategies: syllabus.teaching_strategies,
        typical_activities: syllabus.typical_activities,
        assessment_plan: syllabus.assessment_plan,
      },
    });
    count("national_syllabus");

    for (const topic of mockSyllabusTopics
      .filter((t) => t.syllabus_id === syllabus.id)
      .sort((a, b) => a.sequence - b.sequence)) {
      await insertNode({
        title: topic.title,
        code: topic.code,
        type_id: TYPES.syllabus_topic,
        parent_node_id: syl.curriculum_node_id,
        order_index: topic.sequence,
        payload: {
          code: topic.code,
          description: topic.description,
          duration_weeks: topic.duration_weeks,
          sequence: topic.sequence,
        },
      });
      count("syllabus_topic");
    }

    for (const outcome of mockCurriculumOutcomes
      .filter((o) => o.syllabus_id === syllabus.id)
      .sort((a, b) => a.sequence - b.sequence)) {
      const oc = await insertNode({
        title: outcome.description,
        code: outcome.code,
        type_id: TYPES.outcome,
        parent_node_id: syl.curriculum_node_id,
        order_index: outcome.sequence,
        payload: {
          code: outcome.code,
          description: outcome.description,
          competence_type: outcome.competence_type,
          sequence: outcome.sequence,
        },
      });
      count("outcome");

      for (const indicator of [...(outcome.indicators ?? [])].sort((a, b) => a.sequence - b.sequence)) {
        await insertNode({
          title: indicator.description,
          code: `${outcome.code}-I${indicator.sequence}`,
          type_id: TYPES.indicator,
          parent_node_id: oc.curriculum_node_id,
          order_index: indicator.sequence,
          payload: { sequence: indicator.sequence, description: indicator.description },
        });
        count("indicator");
      }
    }
  }
}

// ---------------------------------------------------------------
// Thematic arm — one document per level × edition
// ---------------------------------------------------------------

for (const doc of mockThematicCurricula) {
  const root = await insertNode({
    title: doc.name,
    code: doc.code,
    type_id: TYPES.curriculum_template,
    order_index: 0,
    status: doc.status,
    published_at: null,
    payload: {
      structure: "thematic",
      component_manifest: ncdcComponentManifest("thematic"),
      code: doc.code,
      country: doc.country,
      year: null,
      version: doc.version,
      level: doc.level,
      issuer: doc.issuer,
      year_note: doc.year_note,
      edition: doc.edition ?? null,
      isbn: doc.isbn,
      document_note: doc.document_note,
      national_aims: doc.national_aims,
      aims_of_primary_education: doc.aims_of_primary_education,
      approach: doc.approach,
      medium_of_instruction: doc.medium_of_instruction,
      period_allocation: doc.period_allocation,
      timetable_notes: doc.timetable_notes,
      learning_resources: doc.learning_resources,
      assessment_approach: doc.assessment_approach,
      cycles: doc.cycles,
      created_by: "super_admin",
    },
  });
  count("curriculum_template");

  for (const [themeIndex, theme] of doc.themes.entries()) {
    const th = await insertNode({
      title: theme.title,
      code: theme.code,
      type_id: TYPES.theme,
      parent_node_id: root.curriculum_node_id,
      order_index: themeIndex + 1,
      payload: {
        code: theme.code,
        term: theme.term ?? null,
        weeks: theme.weeks ?? null,
        learning_outcome: theme.learning_outcome ?? null,
        assessment_guidelines: theme.assessment_guidelines ?? [],
        fidelity: theme.fidelity,
        note: theme.note ?? null,
      },
    });
    count("theme");

    for (const [subIndex, sub] of theme.sub_themes.entries()) {
      await insertNode({
        title: sub.title,
        code: sub.code,
        type_id: TYPES.sub_theme,
        parent_node_id: th.curriculum_node_id,
        order_index: subIndex + 1,
        payload: { code: sub.code, content: sub.content, blocks: sub.blocks },
      });
      count("sub_theme");
    }
  }

  for (const [areaIndex, area] of doc.learning_areas.entries()) {
    await insertNode({
      title: area.title,
      code: area.code,
      type_id: TYPES.learning_area,
      parent_node_id: root.curriculum_node_id,
      order_index: areaIndex + 1,
      payload: {
        code: area.code,
        outcome: area.outcome ?? null,
        organisation: area.organisation,
        notes: area.notes ?? [],
        fidelity: area.fidelity,
      },
    });
    count("learning_area");
  }
}

// ---------------------------------------------------------------
// Summary
// ---------------------------------------------------------------

console.log("\nSeeded national standards into curriculum_nodes:\n");
for (const name of SPINE_TYPES) {
  console.log(`  ${name.padEnd(20)} ${(totals[name] ?? 0).toString().padStart(4)}`);
}
console.log(`\nTotal nodes: ${Object.values(totals).reduce((a, b) => a + b, 0)}`);