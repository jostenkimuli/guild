#!/usr/bin/env node
// Seed the three demo standards onto the universal spine, proving the
// generic schema-as-data path: node types come from
// 20260926000000_demo_standard_types.sql; this script adds the standard
// DOCUMENTS (root + child nodes) with schema-shaped payloads and
// four-component manifests.
//
//   node scripts/seed-demo-standards.mjs
//
// Idempotent by root code: a standard whose root already exists is
// left untouched (so admin edits survive re-seeding). Requires a
// running local Supabase stack; credentials come from
// SUPABASE_API_URL / SUPABASE_SERVICE_ROLE_KEY or `supabase status`.

import { execSync } from "node:child_process";
import { componentManifestFromMap } from "../src/lib/curriculum-spine/manifest.ts";

const DEMO_TYPES = [
  "occupation_framework",
  "learning_field",
  "training_year",
  "competence_area",
  "language_syllabus",
  "general_objective",
  "topic",
  "subtopic",
  "assessment_task",
  "translation_programme",
  "module",
  "studio_session",
  "portfolio_component",
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
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

const nodeTypeRows = await api("/node_types?select=type_id,type_name");
const TYPES = {};
for (const row of nodeTypeRows || []) TYPES[row.type_name] = row.type_id;
for (const name of DEMO_TYPES) {
  if (!TYPES[name]) {
    throw new Error(`Demo node_type "${name}" missing — run db:reset first.`);
  }
}

async function insertNode({ title, code, typeName, parentNodeId = null, orderIndex = 0, payload, status }) {
  const data = await api("/curriculum_nodes", {
    method: "POST",
    prefer: "return=representation",
    body: {
      title,
      code: code ?? null,
      type_id: TYPES[typeName],
      parent_node_id: parentNodeId,
      order_index: orderIndex,
      status,
      payload: payload ?? {},
    },
  });
  const row = Array.isArray(data) ? data[0] : data;
  return row.curriculum_node_id;
}

async function findRoot(typeName, code) {
  const rows = await api(
    `/curriculum_nodes?type_id=eq.${TYPES[typeName]}&code=eq.${encodeURIComponent(code)}&select=curriculum_node_id`,
  );
  return rows?.[0]?.curriculum_node_id ?? null;
}

async function insertTree(parentId, children) {
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    const nodeId = await insertNode({
      title: child.title ?? child.name ?? child.competence ?? child.component ?? child.task ?? child.objective,
      code: child.code,
      typeName: child.type,
      parentNodeId: parentId,
      orderIndex: i + 1,
      payload: child.payload,
      status: "published",
    });
    if (child.children?.length) await insertTree(nodeId, child.children);
  }
}

// ------------------------------------------------------------
// Standard documents
// ------------------------------------------------------------

const standards = [
  {
    // Germany — KFZ-Mechatroniker (Ausbildungsrahmenplan)
    rootType: "occupation_framework",
    code: "KFZ-MECH-2020",
    title: "KFZ-Mechatroniker (Automotive Mechatronics Technician)",
    status: "published",
    payload: {
      code: "KFZ-MECH-2020",
      title: "KFZ-Mechatroniker (Automotive Mechatronics Technician)",
      issuer: "Bundesinstitut für Berufsbildung (BIBB) — IHK",
      year: 2020,
      level: 4,
      source: "Verordnung über die Berufsausbildung zum Kfz-Mechatroniker",
      intent: {
        occupation_profile: "Diagnose, service and repair of modern vehicle systems across mechanics, electrics/electronics and information systems.",
        generic_goals: [
          "Plan and document work sequences",
          "Liaise with customers and colleagues safely",
          "Understand vehicle systems in their interactions",
        ],
        required_activities: ["vehicle diagnostics", "system-specific repair", "customer handover"],
      },
      content: {
        learning_fields: ["Vehicle Technology", "Electrical & Information Systems", "Diagnostics & Repair", "Customer Service"],
      },
      learning_teaching: {
        training_modes: ["dual system: Betrieb (company) + Berufsschule (vocational school)"],
        training_years: 3.5,
      },
      assessment: {
        assessment_forms: ["Zwischenprüfung (interim)", "Gesellenprüfung (final, Teil 1 + Teil 2)"],
        grading_scale: "1–6 (IHK grades, 4 = pass)",
      },
    },
    manifest: {
      intent: [{ kind: "payload", path: "intent" }],
      content: [{ kind: "payload", path: "content" }, { kind: "node_type", type: "learning_field" }],
      learning_teaching: [{ kind: "payload", path: "learning_teaching" }],
      assessment: [{ kind: "payload", path: "assessment" }],
    },
    children: [
      {
        type: "learning_field",
        code: "LF-VEC",
        name: "Vehicle Technology",
        payload: { code: "LF-VEC", name: "Vehicle Technology", description: "Engine, drivetrain, chassis, brakes and steering." },
        children: [
          {
            type: "training_year",
            code: "TY1",
            name: "1st year of training",
            payload: { code: "TY1", name: "1st year of training", weeks: 40 },
            children: [
              {
                type: "competence_area",
                code: "CA-ENG",
                competence: "Engine systems development & maintenance",
                payload: {
                  code: "CA-ENG",
                  competence: "Engine systems development & maintenance",
                  hours_week: 6,
                  goals: ["Four-stroke fundamentals", "Fuel & air systems", "Basic inspection"],
                },
              },
              {
                type: "competence_area",
                code: "CA-CHASSIS",
                competence: "Chassis & running gear",
                payload: {
                  code: "CA-CHASSIS",
                  competence: "Chassis & running gear",
                  hours_week: 4,
                  goals: ["Steering geometry", "Suspension service"],
                },
              },
            ],
          },
        ],
      },
      {
        type: "learning_field",
        code: "LF-ELE",
        name: "Electrical & Information Systems",
        payload: { code: "LF-ELE", name: "Electrical & Information Systems", description: "Vehicle electrics, bus systems and infotainment." },
        children: [
          {
            type: "competence_area",
            code: "CA-BUS",
            competence: "Bus systems & diagnostics interfaces",
            payload: {
              code: "CA-BUS",
              competence: "Bus systems & diagnostics interfaces",
              hours_week: 5,
              goals: ["CAN bus basics", "Reading fault memory"],
            },
          },
        ],
      },
    ],
  },
  {
    // Kenya — Kiswahili syllabus (Competency Based Curriculum)
    rootType: "language_syllabus",
    code: "KNEC-KISW-CBC",
    title: "Kiswahili Syllabus (Competency Based Curriculum)",
    status: "published",
    payload: {
      code: "KNEC-KISW-CBC",
      title: "Kiswahili Syllabus (Competency Based Curriculum)",
      issuer: "Kenya Institute of Curriculum Development (KICD) / KNEC",
      year: 2021,
      language: "Kiswahili",
      level: "Junior Secondary (Grade 7)",
      intent: {
        rationale: "Kiswahili as national and official language, carrier of culture and unity.",
        general_aims: [
          "Communicate effectively in spoken and written Kiswahili",
          "Appreciate Kiswahili literature and cultural heritage",
        ],
        values: ["unity", "patriotism", "respect for diversity"],
      },
      content: {
        strand_order: ["Listening & Speaking", "Reading", "Writing", "Language & Grammar", "Literature"],
        core_competences: ["communication", "critical thinking", "creativity", "digital literacy"],
      },
      learning_teaching: {
        approaches: ["communicative approach", "task-based learning", "integrated skills"],
        periods_per_week: 4,
      },
      assessment: {
        assessment_guidance: "Formative school-based assessment plus summative national examination.",
        knec_exam_weight: 50,
      },
    },
    manifest: {
      intent: [{ kind: "payload", path: "intent" }],
      content: [{ kind: "payload", path: "content" }, { kind: "node_type", type: "general_objective" }],
      learning_teaching: [{ kind: "payload", path: "learning_teaching" }],
      assessment: [{ kind: "payload", path: "assessment" }, { kind: "node_type", type: "assessment_task" }],
    },
    children: [
      {
        type: "general_objective",
        code: "GO-LISTEN",
        objective: "Listen and respond appropriately to Kiswahili speech",
        payload: { code: "GO-LISTEN", objective: "Listen and respond appropriately to Kiswahili speech", from_strand: "Listening & Speaking" },
        children: [
          {
            type: "topic",
            code: "TP-MAZUNGUMZO",
            name: "Mazungumzo (Conversations)",
            payload: { code: "TP-MAZUNGUMZO", name: "Mazungumzo (Conversations)" },
            children: [
              {
                type: "subtopic",
                code: "ST-JIARUFU",
                name: "Kujitambulisha (Introducing oneself)",
                payload: { code: "ST-JIARUFU", name: "Kujitambulisha", weeks: 1 },
                children: [
                  {
                    type: "assessment_task",
                    code: "AT-INTRO",
                    task: "Give a 30-second self-introduction using polite forms",
                    payload: {
                      code: "AT-INTRO",
                      task: "Give a 30-second self-introduction using polite forms",
                      level: "rubric",
                      instructions: "Be assessed on fluency, etiquette, tone.",
                    },
                  },
                ],
              },
            ],
          },
          {
            type: "topic",
            code: "TP-HADITHI",
            name: "Hadithi (Stories)",
            payload: { code: "TP-HADITHI", name: "Hadithi (Stories)" },
            children: [
              {
                type: "subtopic",
                code: "ST-MATINEO",
                name: "Matini za kusimulia",
                payload: { code: "ST-MATINEO", name: "Matini za kusimulia", weeks: 2 },
                children: [
                  {
                    type: "assessment_task",
                    code: "AT-STORY",
                    task: "Retell the main events of a graded reader in sequence",
                    payload: {
                      code: "AT-STORY",
                      task: "Retell the main events of a graded reader in sequence",
                      level: "rubric",
                      instructions: "Sequence, vocabulary use and clarity are scored.",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "general_objective",
        code: "GO-WRITE",
        objective: "Write correctly in Kiswahili across text types",
        payload: { code: "GO-WRITE", objective: "Write correctly in Kiswahili across text types", from_strand: "Writing" },
        children: [
          {
            type: "topic",
            code: "TP-INSHA",
            name: "Insha (Composition)",
            payload: { code: "TP-INSHA", name: "Insha (Composition)" },
            children: [
              {
                type: "subtopic",
                code: "ST-INSHA-MAARUFU",
                name: "Muundo wa insha",
                payload: { code: "ST-INSHA-MAARUFU", name: "Muundo wa insha", weeks: 2 },
                children: [
                  {
                    type: "assessment_task",
                    code: "AT-INSHA",
                    task: "Write a 200-word expository essay on a familiar topic",
                    payload: {
                      code: "AT-INSHA",
                      task: "Write a 200-word expository essay on a familiar topic",
                      level: "grades",
                      instructions: "Structure, grammar, spelling and punctuation.",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    // Ireland — Book Translation Studio Programme
    rootType: "translation_programme",
    code: "NCAD-TRANS-01",
    title: "Book Translation Studio Programme",
    status: "published",
    payload: {
      code: "NCAD-TRANS-01",
      title: "Book Translation Studio Programme",
      provider: "NCAD — School of Culture & Creative Media",
      year: 2024,
      intent: {
        programme_outcomes: [
          "Translate full book-length works with confidence",
          "Work with source languages, registers and editorial workflows",
        ],
        graduate_profile: "Professional book translator comfortable with literary and non-fiction registers.",
      },
      content: {
        text_types: ["literary prose", "poetry", "children's literature", "non-fiction"],
        registers: ["narrative", "formal academic", "colloquial dialogue", "technical exposition"],
      },
      learning_teaching: {
        studio_rhythm: "Weekly studio sessions alternating workshop critique with craft seminars.",
        methods: ["peer-workshop critique", "paired drafting", "editorial table talks", "market briefings"],
      },
      assessment: {
        portfolio_criteria: ["fidelity to source", "register appropriateness", "editorial polish", "translation commentary"],
        public_exam: "End-of-year portfolio viva against the published criteria.",
      },
    },
    manifest: {
      intent: [{ kind: "payload", path: "intent" }],
      content: [{ kind: "payload", path: "content" }, { kind: "node_type", type: "module" }],
      learning_teaching: [{ kind: "payload", path: "learning_teaching" }],
      assessment: [{ kind: "payload", path: "assessment" }, { kind: "node_type", type: "portfolio_component" }],
    },
    children: [
      {
        type: "module",
        code: "MOD-LIT",
        name: "Literary Translation",
        payload: { code: "MOD-LIT", name: "Literary Translation", credits: 10 },
        children: [
          {
            type: "studio_session",
            code: "SS-POETRY",
            name: "Translating Poetry: form and sound",
            payload: { code: "SS-POETRY", name: "Translating Poetry: form and sound", workshop: "Poetry workshop" },
            children: [
              {
                type: "portfolio_component",
                code: "PC-POEM",
                component: "Annotated translation of three poems (Irish–English)",
                payload: { code: "PC-POEM", component: "Annotated translation of three poems (Irish–English)", weight_pct: 30 },
              },
            ],
          },
          {
            type: "studio_session",
            code: "SS-PROSE",
            name: "Prose register and voice",
            payload: { code: "SS-PROSE", name: "Prose register and voice", workshop: "Prose editing table" },
            children: [
              {
                type: "portfolio_component",
                code: "PC-FIRSTCH",
                component: "Polished first chapter with translator commentary",
                payload: { code: "PC-FIRSTCH", component: "Polished first chapter with translator commentary", weight_pct: 40 },
              },
            ],
          },
        ],
      },
      {
        type: "module",
        code: "MOD-PROF",
        name: "Professional Practice",
        payload: { code: "MOD-PROF", name: "Professional Practice", credits: 5 },
        children: [
          {
            type: "studio_session",
            code: "SS-PITCH",
            name: "Pitching to publishers",
            payload: { code: "SS-PITCH", name: "Pitching to publishers", workshop: "Industry seminar" },
            children: [
              {
                type: "portfolio_component",
                code: "PC-PITCH",
                component: "Synopsis, sample translation and rights brief",
                payload: { code: "PC-PITCH", component: "Synopsis, sample translation and rights brief", weight_pct: 30 },
              },
            ],
          },
        ],
      },
    ],
  },
];

// ------------------------------------------------------------
// Apply (idempotent by root code)
// ------------------------------------------------------------

for (const standard of standards) {
  const existing = await findRoot(standard.rootType, standard.code);
  if (existing) {
    console.log(`SKIP  ${standard.code} — already present`);
    continue;
  }

  const rootPayload = {
    ...standard.payload,
    component_manifest: componentManifestFromMap(standard.manifest),
  };
  const rootId = await insertNode({
    title: standard.title,
    code: standard.code,
    typeName: standard.rootType,
    orderIndex: 0,
    payload: rootPayload,
    status: standard.status,
  });
  await insertTree(rootId, standard.children);
  console.log(`SEED  ${standard.code} — ${standard.rootType} (root ${rootId})`);
}

console.log("Demo standards applied.");