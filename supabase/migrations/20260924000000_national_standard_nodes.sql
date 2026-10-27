-- ============================================================
-- Cycle 1 — National curriculum reference standard on the
-- universal node spine.
--
-- One `curriculum_nodes` row per reference node, seeded with the
-- node types below. Replaces the planned cluster of typed tables
-- (curriculum_templates, template_subjects, template_levels,
-- national_syllabi, syllabus_topics, curriculum_outcomes,
-- outcome_indicators, template_themes, template_sub_themes,
-- thematic_learning_areas) with the existing universal node layer,
-- plus one JSONB payload per node validated against per-type JSON
-- Schemas (pg_jsonschema).
--
-- Spine:
--   curriculum_template
--     ├── subject → national_syllabus
--     │               ├── syllabus_topic
--     │               ├── outcome → indicator
--     ├── level                      (the subject × level matrix is
--     │                               denormalised: a syllabus sits under
--     │                               its subject and carries the level ref)
--     └── theme → sub_theme
--         └── learning_area
-- ============================================================

do $ext$
begin
  execute 'create extension if not exists pg_jsonschema with schema extensions';
end
$ext$;

-- ------------------------------------------------------------
-- 1. Seed the node registry (idempotent)
-- ------------------------------------------------------------

insert into public.node_types (category, type_name)
select 'EDUCATIONAL', v.type_name
from (values
  ('curriculum_template'),
  ('subject'),
  ('level'),
  ('national_syllabus'),
  ('syllabus_topic'),
  ('outcome'),
  ('indicator'),
  ('theme'),
  ('sub_theme'),
  ('learning_area')
) as v(type_name)
on conflict (type_name) do nothing;

-- ------------------------------------------------------------
-- 2. Widen curriculum_nodes: document columns + JSONB payload
-- ------------------------------------------------------------

alter table public.curriculum_nodes
  add column code         text,
  add column order_index  smallint not null default 0,
  add column status       varchar(20) not null default 'draft'
    check (status in ('draft','published','archived')),
  add column published_at timestamptz,
  add column payload      jsonb not null default '{}'::jsonb;

-- Spine-level uniqueness so re-seeding is idempotent: a child code is
-- unique within its parent + type (null code rows are the root only).
create unique index curriculum_nodes_spine_key
  on public.curriculum_nodes (type_id, parent_node_id, code)
  where code is not null;

-- ------------------------------------------------------------
-- 3. Per-type payload validation (pg_jsonschema)
-- ------------------------------------------------------------

create or replace function public.node_payload_valid(p_type_id bigint, p_payload jsonb)
returns boolean
language plpgsql stable
as $$
declare
  v_type text;
begin
  select type_name into v_type from public.node_types where type_id = p_type_id;
  return case v_type
    when 'curriculum_template' then
      extensions.jsonb_matches_schema( $js$
      {
        "type": "object",
        "required": ["structure", "code", "version"],
        "properties": {
          "structure": { "enum": ["subject", "thematic"] },
          "code": { "type": "string" },
          "country": { "type": ["string", "null"] },
          "year": { "type": ["integer", "null"] },
          "version": { "type": "string" },
          "level": { "type": ["string", "null"] },
          "issuer": { "type": ["string", "null"] },
          "year_note": { "type": ["string", "null"] },
          "edition": { "type": ["string", "null"] },
          "isbn": { "type": ["string", "null"] },
          "document_note": { "type": ["string", "null"] },
          "national_aims": { "type": ["array", "null"], "items": { "type": "string" } },
          "aims_of_primary_education": { "type": ["array", "null"], "items": { "type": "string" } },
          "values_text": { "type": ["string", "null"] },
          "generic_skills": { "type": ["array", "null"], "items": { "type": "string" } },
          "cross_cutting_issues": { "type": ["array", "null"], "items": { "type": "string" } },
          "pedagogy_text": { "type": ["string", "null"] },
          "assessment_requirements": {
            "type": ["object", "null"],
            "properties": {
              "continuous_assessment": { "type": ["string", "null"] },
              "examinations": { "type": ["string", "null"] },
              "promotion_rules": { "type": ["string", "null"] }
            }
          },
          "time_allocation": {
            "type": ["array", "null"],
            "items": {
              "type": "object",
              "properties": {
                "subject": { "type": "string" },
                "weekly_minutes": { "type": "integer" }
              }
            }
          },
          "approved_materials": { "type": ["array", "null"], "items": { "type": "string" } },
          "created_by": { "type": ["string", "null"] },
          "cycles": {
            "type": ["array", "null"],
            "items": {
              "type": "object",
              "properties": {
                "code": { "type": "string" },
                "name": { "type": "string" },
                "description": { "type": "string" }
              }
            }
          },
          "approach": { "type": ["array", "null"], "items": { "type": "string" } },
          "medium_of_instruction": { "type": ["string", "null"] },
          "period_allocation": {
            "type": ["array", "null"],
            "items": {
              "type": "object",
              "properties": {
                "strand": { "type": "string" },
                "periods": { "type": "integer" },
                "note": { "type": ["string", "null"] }
              }
            }
          },
          "timetable_notes": { "type": ["array", "null"], "items": { "type": "string" } },
          "learning_resources": { "type": ["array", "null"], "items": { "type": "string" } },
          "assessment_approach": { "type": ["array", "null"], "items": { "type": "string" } }
        }
      }
      $js$::json, p_payload)
    when 'subject' then extensions.jsonb_matches_schema( '{"type":"object","required":["code","sequence"],"properties":{"code":{"type":"string"},"sequence":{"type":"integer"}}}'::json, p_payload)
    when 'level' then extensions.jsonb_matches_schema( '{"type":"object","required":["code","sequence"],"properties":{"code":{"type":"string"},"sequence":{"type":"integer"}}}'::json, p_payload)
    when 'national_syllabus' then
      extensions.jsonb_matches_schema( $js$
      {
        "type": "object",
        "required": [
          "code", "subject_id", "subject_name", "level_id", "level_name",
          "time_allocation", "assessment_requirements", "pedagogy_notes",
          "approved_materials", "teaching_strategies", "typical_activities",
          "assessment_plan"
        ],
        "properties": {
          "code": { "type": "string" },
          "subject_id": { "type": "string" },
          "subject_name": { "type": "string" },
          "level_id": { "type": "string" },
          "level_name": { "type": "string" },
          "time_allocation": { "type": ["string", "null"] },
          "assessment_requirements": { "type": ["string", "null"] },
          "pedagogy_notes": { "type": ["string", "null"] },
          "approved_materials": { "type": ["array", "null"], "items": { "type": "string" } },
          "teaching_strategies": { "type": ["array", "null"], "items": { "type": "string" } },
          "typical_activities": { "type": ["array", "null"], "items": { "type": "string" } },
          "assessment_plan": {
            "type": ["array", "null"],
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "type": { "type": "string" },
                "title": { "type": "string" },
                "weight_pct": { "type": ["number", "null"] },
                "when": { "type": ["string", "null"] },
                "description": { "type": "string" }
              }
            }
          }
        }
      }
      $js$::json, p_payload)
    when 'syllabus_topic' then
      extensions.jsonb_matches_schema( '{"type":"object","required":["code","description","duration_weeks","sequence"],"properties":{"code":{"type":"string"},"description":{"type":["string","null"]},"duration_weeks":{"type":["integer","null"]},"sequence":{"type":"integer"}}}'::json, p_payload)
    when 'outcome' then
      extensions.jsonb_matches_schema( '{"type":"object","required":["code","description","competence_type","sequence"],"properties":{"code":{"type":"string"},"description":{"type":"string"},"competence_type":{"enum":["knowledge","skill","attitude","value"]},"sequence":{"type":"integer"}}}'::json, p_payload)
    when 'indicator' then
      extensions.jsonb_matches_schema( '{"type":"object","required":["sequence","description"],"properties":{"sequence":{"type":"integer"},"description":{"type":"string"}}}'::json, p_payload)
    when 'theme' then
      extensions.jsonb_matches_schema( $js$
      {
        "type": "object",
        "required": ["code", "fidelity"],
        "properties": {
          "code": { "type": "string" },
          "term": { "type": ["integer", "null"] },
          "weeks": { "type": ["string", "null"] },
          "learning_outcome": { "type": ["string", "null"] },
          "note": { "type": ["string", "null"] },
          "fidelity": { "enum": ["mirrored", "outline"] },
          "assessment_guidelines": {
            "type": ["array", "null"],
            "items": {
              "type": "object",
              "properties": {
                "strand": { "type": "string" },
                "items": { "type": "array", "items": { "type": "string" } }
              }
            }
          }
        }
      }
      $js$::json, p_payload)
    when 'sub_theme' then
      extensions.jsonb_matches_schema( $js$
      {
        "type": "object",
        "required": ["code", "content", "blocks"],
        "properties": {
          "code": { "type": "string" },
          "content": { "type": "array", "items": { "type": "string" } },
          "blocks": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "strand": { "type": "string" },
                "heading": { "type": ["string", "null"] },
                "items": { "type": "array", "items": { "type": "string" } }
              }
            }
          }
        }
      }
      $js$::json, p_payload)
    when 'learning_area' then
      extensions.jsonb_matches_schema( '{"type":"object","required":["code","outcome","organisation","notes","fidelity"],"properties":{"code":{"type":"string"},"outcome":{"type":["string","null"]},"organisation":{"type":"string"},"notes":{"type":["array","null"],"items":{"type":"string"}},"fidelity":{"enum":["mirrored","outline"]}}}'::json, p_payload)
    else true
  end;
end
$$;

alter table public.curriculum_nodes
  add constraint curriculum_nodes_payload_check
  check (
    public.node_payload_valid(type_id, payload)
  );

-- ------------------------------------------------------------
-- 4. Indexes: GIN for payload queries (completeness gauge,
--    "documents missing Intent" via ?|), tree navigation, status.
-- ------------------------------------------------------------

create index curriculum_nodes_payload_gin
  on public.curriculum_nodes using gin (payload jsonb_path_ops);
create index curriculum_nodes_type_parent_order
  on public.curriculum_nodes (type_id, parent_node_id, order_index);
create index curriculum_nodes_status_type
  on public.curriculum_nodes (status, type_id);

-- ------------------------------------------------------------
-- 5. RLS: national standards are super-admin-minted reference
--    documents. Any signed-in user may read; only an approved
--    super admin may create/update/delete spine rows.
-- ------------------------------------------------------------

drop policy if exists "curriculum_nodes_insert_staff" on public.curriculum_nodes;
drop policy if exists "curriculum_nodes_update_staff" on public.curriculum_nodes;
drop policy if exists "curriculum_nodes_delete_staff" on public.curriculum_nodes;

create policy "curriculum_nodes_insert_super_admin"
  on public.curriculum_nodes for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'approved' and role = 'super_admin'
    )
  );

create policy "curriculum_nodes_update_super_admin"
  on public.curriculum_nodes for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'approved' and role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'approved' and role = 'super_admin'
    )
  );

create policy "curriculum_nodes_delete_super_admin"
  on public.curriculum_nodes for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'approved' and role = 'super_admin'
    )
  );

grant select on public.node_types to service_role;
grant select, insert, update, delete on public.curriculum_nodes to service_role;

-- ------------------------------------------------------------
-- 6. Provenance: a space's operational curriculum can record which
--    national-standard node it was mirrored from (adoption trace).
-- ------------------------------------------------------------

alter table public.curricula
  add column source_node_id bigint
    references public.curriculum_nodes(curriculum_node_id) on delete set null;

create index curricula_source_node_idx on public.curricula (source_node_id);