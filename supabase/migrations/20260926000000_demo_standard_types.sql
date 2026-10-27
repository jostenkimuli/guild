-- ============================================================
-- Demo standards — three real-world curriculum definitions on the
-- universal spine, driven entirely by schema-as-data node types.
--
--   occupation_framework    (root) — Germany, KFZ-Mechatroniker
--     └─ learning_field → training_year → competence_area
--   language_syllabus       (root) — Kenya, Kiswahili (CBC)
--     └─ general_objective → topic → subtopic → assessment_task
--   translation_programme   (root) — Ireland, book translation
--     └─ module → studio_session → portfolio_component
--
-- These are node_type CONTRACT rows (payload schemas as data). The
-- documents (curriculum_nodes rows) live in
-- scripts/seed-demo-standards.mjs. Root payload schemas declare four
-- top-level component anchors (intent / content / learning_teaching /
-- assessment) so a seeded root document can state exactly how it
-- fulfils the four universal components.
-- ============================================================

insert into public.node_types (
  category,
  type_name,
  payload_schema,
  allowed_children,
  is_root
)
values
  (
    'EDUCATIONAL',
    'occupation_framework',
    $js$
    {
      "type": "object",
      "required": ["code", "title", "level", "intent", "content", "learning_teaching", "assessment"],
      "properties": {
        "code": { "type": "string" },
        "title": { "type": "string" },
        "issuer": { "type": ["string", "null"] },
        "year": { "type": ["integer", "null"] },
        "level": { "type": ["integer", "null"], "minimum": 1, "maximum": 8 },
        "source": { "type": ["string", "null"] },
        "intent": {
          "type": "object",
          "x-order": 1,
          "x-help": "Evidence for the Intent component",
          "properties": {
            "occupation_profile": { "type": ["string", "null"] },
            "generic_goals": { "type": ["array", "null"], "items": { "type": "string" } },
            "required_activities": { "type": ["array", "null"], "items": { "type": "string" } }
          }
        },
        "content": {
          "type": "object",
          "x-order": 2,
          "x-help": "Evidence for the Content component",
          "properties": {
            "learning_fields": { "type": ["array", "null"], "items": { "type": "string" } }
          }
        },
        "learning_teaching": {
          "type": "object",
          "x-order": 3,
          "x-help": "Evidence for the Learning & Teaching component",
          "properties": {
            "training_modes": { "type": ["array", "null"], "items": { "type": "string" } },
            "training_years": { "type": ["number", "null"], "minimum": 1 }
          }
        },
        "assessment": {
          "type": "object",
          "x-order": 4,
          "x-help": "Evidence for the Assessment component",
          "properties": {
            "assessment_forms": { "type": ["array", "null"], "items": { "type": "string" } },
            "grading_scale": { "type": ["string", "null"] }
          }
        }
      }
    }
    $js$::jsonb,
    array['learning_field'],
    true
  ),
  (
    'EDUCATIONAL',
    'learning_field',
    $js$
    {
      "type": "object",
      "required": ["code", "name"],
      "properties": {
        "code": { "type": "string" },
        "name": { "type": "string" },
        "description": { "type": ["string", "null"] }
      }
    }
    $js$::jsonb,
    array['training_year', 'competence_area'],
    false
  ),
  (
    'EDUCATIONAL',
    'training_year',
    $js$
    {
      "type": "object",
      "required": ["code", "name"],
      "properties": {
        "code": { "type": "string" },
        "name": { "type": "string" },
        "weeks": { "type": ["integer", "null"] }
      }
    }
    $js$::jsonb,
    array['competence_area'],
    false
  ),
  (
    'EDUCATIONAL',
    'competence_area',
    $js$
    {
      "type": "object",
      "required": ["code", "competence"],
      "properties": {
        "code": { "type": "string" },
        "competence": { "type": "string" },
        "hours_week": { "type": ["integer", "null"] },
        "goals": { "type": ["array", "null"], "items": { "type": "string" } }
      }
    }
    $js$::jsonb,
    null,
    false
  ),
  (
    'EDUCATIONAL',
    'language_syllabus',
    $js$
    {
      "type": "object",
      "required": ["code", "title", "language", "level", "intent", "content", "learning_teaching", "assessment"],
      "properties": {
        "code": { "type": "string" },
        "title": { "type": "string" },
        "issuer": { "type": ["string", "null"] },
        "year": { "type": ["integer", "null"] },
        "language": { "type": "string" },
        "level": { "type": "string" },
        "intent": {
          "type": "object",
          "x-order": 1,
          "x-help": "Evidence for the Intent component",
          "properties": {
            "rationale": { "type": ["string", "null"] },
            "general_aims": { "type": ["array", "null"], "items": { "type": "string" } },
            "values": { "type": ["array", "null"], "items": { "type": "string" } }
          }
        },
        "content": {
          "type": "object",
          "x-order": 2,
          "x-help": "Evidence for the Content component",
          "properties": {
            "strand_order": { "type": ["array", "null"], "items": { "type": "string" } },
            "core_competences": { "type": ["array", "null"], "items": { "type": "string" } }
          }
        },
        "learning_teaching": {
          "type": "object",
          "x-order": 3,
          "x-help": "Evidence for the Learning & Teaching component",
          "properties": {
            "approaches": { "type": ["array", "null"], "items": { "type": "string" } },
            "periods_per_week": { "type": ["integer", "null"] }
          }
        },
        "assessment": {
          "type": "object",
          "x-order": 4,
          "x-help": "Evidence for the Assessment component",
          "properties": {
            "assessment_guidance": { "type": ["string", "null"] },
            "knec_exam_weight": { "type": ["integer", "null"] }
          }
        }
      }
    }
    $js$::jsonb,
    array['general_objective'],
    true
  ),
  (
    'EDUCATIONAL',
    'general_objective',
    $js$
    {
      "type": "object",
      "required": ["code", "objective"],
      "properties": {
        "code": { "type": "string" },
        "objective": { "type": "string" },
        "from_strand": { "type": ["string", "null"] }
      }
    }
    $js$::jsonb,
    array['topic'],
    false
  ),
  (
    'EDUCATIONAL',
    'topic',
    $js$
    {
      "type": "object",
      "required": ["code", "name"],
      "properties": {
        "code": { "type": "string" },
        "name": { "type": "string" }
      }
    }
    $js$::jsonb,
    array['subtopic'],
    false
  ),
  (
    'EDUCATIONAL',
    'subtopic',
    $js$
    {
      "type": "object",
      "required": ["code", "name"],
      "properties": {
        "code": { "type": "string" },
        "name": { "type": "string" },
        "weeks": { "type": ["integer", "null"] }
      }
    }
    $js$::jsonb,
    array['assessment_task'],
    false
  ),
  (
    'EDUCATIONAL',
    'assessment_task',
    $js$
    {
      "type": "object",
      "required": ["code", "task"],
      "properties": {
        "code": { "type": "string" },
        "task": { "type": "string" },
        "level": { "type": ["string", "null"] },
        "instructions": { "type": ["string", "null"] }
      }
    }
    $js$::jsonb,
    null,
    false
  ),
  (
    'EDUCATIONAL',
    'translation_programme',
    $js$
    {
      "type": "object",
      "required": ["code", "title", "intent", "content", "learning_teaching", "assessment"],
      "properties": {
        "code": { "type": "string" },
        "title": { "type": "string" },
        "provider": { "type": ["string", "null"] },
        "year": { "type": ["integer", "null"] },
        "intent": {
          "type": "object",
          "x-order": 1,
          "x-help": "Evidence for the Intent component",
          "properties": {
            "programme_outcomes": { "type": ["array", "null"], "items": { "type": "string" } },
            "graduate_profile": { "type": ["string", "null"] }
          }
        },
        "content": {
          "type": "object",
          "x-order": 2,
          "x-help": "Evidence for the Content component",
          "properties": {
            "text_types": { "type": ["array", "null"], "items": { "type": "string" } },
            "registers": { "type": ["array", "null"], "items": { "type": "string" } }
          }
        },
        "learning_teaching": {
          "type": "object",
          "x-order": 3,
          "x-help": "Evidence for the Learning & Teaching component",
          "properties": {
            "studio_rhythm": { "type": ["string", "null"] },
            "methods": { "type": ["array", "null"], "items": { "type": "string" } }
          }
        },
        "assessment": {
          "type": "object",
          "x-order": 4,
          "x-help": "Evidence for the Assessment component",
          "properties": {
            "portfolio_criteria": { "type": ["array", "null"], "items": { "type": "string" } },
            "public_exam": { "type": ["string", "null"] }
          }
        }
      }
    }
    $js$::jsonb,
    array['module'],
    true
  ),
  (
    'EDUCATIONAL',
    'module',
    $js$
    {
      "type": "object",
      "required": ["code", "name"],
      "properties": {
        "code": { "type": "string" },
        "name": { "type": "string" },
        "credits": { "type": ["integer", "null"] }
      }
    }
    $js$::jsonb,
    array['studio_session'],
    false
  ),
  (
    'EDUCATIONAL',
    'studio_session',
    $js$
    {
      "type": "object",
      "required": ["code", "name"],
      "properties": {
        "code": { "type": "string" },
        "name": { "type": "string" },
        "workshop": { "type": ["string", "null"] }
      }
    }
    $js$::jsonb,
    array['portfolio_component'],
    false
  ),
  (
    'EDUCATIONAL',
    'portfolio_component',
    $js$
    {
      "type": "object",
      "required": ["code", "component"],
      "properties": {
        "code": { "type": "string" },
        "component": { "type": "string" },
        "weight_pct": { "type": ["integer", "null"] }
      }
    }
    $js$::jsonb,
    null,
    false
  )
on conflict (type_name) do nothing;