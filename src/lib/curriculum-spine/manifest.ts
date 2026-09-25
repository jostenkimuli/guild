// The four universal components every curriculum reference standard
// must be able to express — the schema-level contract enforced for
// root-capable node types by `is_component_manifest_valid` (see
// 20260925000000_node_schema_data.sql).
//
// A root document's `component_manifest` states which payload keys
// (`kind: "payload"`) and/or descendant node types (`kind:
// "node_type"`) satisfy each component. Coverage is computed from the
// document's own manifest, so any standard — NCDC primary, a German
// vocational occupation, a Kenyan language syllabus — is measured
// against the same four components.

export const CURRICULUM_COMPONENT_IDS = [
  "intent",
  "content",
  "learning_teaching",
  "assessment",
] as const;

export type CurriculumComponentId = (typeof CURRICULUM_COMPONENT_IDS)[number];

export interface ComponentManifestSource {
  kind: "payload" | "node_type";
  /** Top-level payload key (or dotted path) for `kind: "payload"`. */
  path?: string;
  /** Node type name for `kind: "node_type"`. */
  type?: string;
}

export interface ComponentManifestEntry {
  id: CurriculumComponentId;
  label: string;
  sources: ComponentManifestSource[];
}

export interface ComponentManifest {
  components: ComponentManifestEntry[];
}

const COMPONENT_LABELS: Record<CurriculumComponentId, string> = {
  intent: "Intent",
  content: "Content",
  learning_teaching: "Learning & Teaching",
  assessment: "Assessment",
};

/** A manifest whose four components are declared but have no sources. */
export function emptyComponentManifest(): ComponentManifest {
  return {
    components: CURRICULUM_COMPONENT_IDS.map((id) => ({
      id,
      label: COMPONENT_LABELS[id],
      sources: [],
    })),
  };
}

/**
 * Build a manifest from per-component source lists; components without
 * an entry stay declared-but-empty. Used by the generic standard tooling
 * and the demo-standard seeds.
 */
export function componentManifestFromMap(
  sources: Partial<
    Record<CurriculumComponentId, ComponentManifestSource[]>
  >,
): ComponentManifest {
  const manifest = emptyComponentManifest();
  for (const entry of manifest.components) {
    const entrySources = sources[entry.id];
    if (entrySources) entry.sources = entrySources;
  }
  return manifest;
}

/**
 * The machine-readable four-component statement for the NCDC
 * reference arm. The sources mirror the bespoke coverage maps used
 * by the admin preview (curriculum-admin-preview.tsx): for a subject
 * template, Intent = the aims/skills payload keys, Content =
 * syllabus presence, Learning & Teaching = pedagogy + materials,
 * Assessment = assessment requirements. The thematic arm maps the
 * equivalent thematic payload keys and theme/learning-area nodes.
 */
export function ncdcComponentManifest(structure: "subject" | "thematic"): ComponentManifest {
  const manifest = emptyComponentManifest();
  const byId = new Map(manifest.components.map((entry) => [entry.id, entry]));

  if (structure === "thematic") {
    byId.get("intent")!.sources = [
      { kind: "payload", path: "cycles" },
      { kind: "payload", path: "national_aims" },
      { kind: "payload", path: "aims_of_primary_education" },
    ];
    byId.get("content")!.sources = [
      { kind: "node_type", type: "theme" },
      { kind: "node_type", type: "learning_area" },
    ];
    byId.get("learning_teaching")!.sources = [
      { kind: "payload", path: "approach" },
      { kind: "payload", path: "learning_resources" },
      { kind: "payload", path: "period_allocation" },
    ];
    byId.get("assessment")!.sources = [
      { kind: "payload", path: "assessment_approach" },
      { kind: "node_type", type: "theme" },
    ];
    return manifest;
  }

  byId.get("intent")!.sources = [
    { kind: "payload", path: "national_aims" },
    { kind: "payload", path: "aims_of_primary_education" },
    { kind: "payload", path: "generic_skills" },
  ];
  byId.get("content")!.sources = [{ kind: "node_type", type: "national_syllabus" }];
  byId.get("learning_teaching")!.sources = [
    { kind: "payload", path: "pedagogy_text" },
    { kind: "payload", path: "approved_materials" },
    { kind: "node_type", type: "national_syllabus" },
  ];
  byId.get("assessment")!.sources = [
    { kind: "payload", path: "assessment_requirements" },
    { kind: "node_type", type: "national_syllabus" },
  ];
  return manifest;
}