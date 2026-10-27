-- ============================================================
-- Schema-as-data: payload schemas move into the node-type
-- registry, so the universal spine can carry ANY curriculum
-- definition that expresses the four universal components
-- (Intent / Content / Learning & Teaching / Assessment).
--
-- 1. Widen node_types with payload_schema / allowed_children /
--    is_root.
-- 2. node_payload_valid now resolves the schema from the registry
--    instead of a hardcoded case branch; a root-capable type
--    (is_root) must declare a component_manifest with exactly the
--    four universal component ids.
-- 3. The 10 NCDC JSON Schemas (previously inline in the case
--    branch) become data rows. Behaviour is unchanged: the
--    schemas are identical, and types without a schema still
--    validate open (the old `else true`).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Widen the registry
-- ------------------------------------------------------------

alter table public.node_types
  add column payload_schema   jsonb,
  add column allowed_children text[],
  add column is_root          boolean not null default false;

-- A payload schema is usable by the validator only if it is a JSON
-- object schema (pg_jsonschema does not expose its metaschema, so
-- this is a light structural guard against a hand-edited schema).
alter table public.node_types
  add constraint node_types_payload_schema_check
  check (
    payload_schema is null
    or (
      jsonb_typeof(payload_schema) = 'object'
      and payload_schema ->> 'type' = 'object'
    )
  );

-- ------------------------------------------------------------
-- 2. Four-component validation for standard roots
-- ------------------------------------------------------------

create or replace function public.is_component_manifest_valid(p_payload jsonb)
returns boolean
language sql immutable
as $$
  with ids as (
    select comp.value ->> 'id' as id
    from jsonb_array_elements(
      coalesce(p_payload -> 'component_manifest' -> 'components', '[]'::jsonb)
    ) as comp
  )
  select
    jsonb_typeof(p_payload -> 'component_manifest') = 'object'
    and jsonb_typeof(p_payload -> 'component_manifest' -> 'components') = 'array'
    and (select count(distinct id) from ids) = 4
    and (
      select count(*)
      from ids
      where id in ('intent', 'content', 'learning_teaching', 'assessment')
    ) = 4;
$$;

-- ------------------------------------------------------------
-- 3. Schema-as-data validator
-- ------------------------------------------------------------

create or replace function public.node_payload_valid(p_type_id bigint, p_payload jsonb)
returns boolean
language plpgsql stable
as $$
declare
  v_type    text;
  v_schema  jsonb;
  v_is_root boolean;
begin
  select type_name, payload_schema, is_root
    into v_type, v_schema, v_is_root
    from public.node_types
    where type_id = p_type_id;

  -- Unknown or unregistered types validate open (old `else true`).
  if v_type is null then
    return true;
  end if;

  if v_schema is not null then
    begin
      if not extensions.jsonb_matches_schema(v_schema::json, p_payload) then
        return false;
      end if;
    exception when others then
      raise exception 'payload_schema for node type "%" is not a valid JSON Schema', v_type;
    end;
  end if;

  if v_is_root and not public.is_component_manifest_valid(p_payload) then
    return false;
  end if;

  return true;
end
$$;

-- ------------------------------------------------------------
-- 4. Seed the NCDC payload schemas as data (verbatim from the
--    previous inline case branches — behaviour unchanged)
-- ------------------------------------------------------------

update public.node_types
set payload_schema = $js$
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
$js$::jsonb
where type_name = 'curriculum_template';

update public.node_types
set payload_schema = '{"type":"object","required":["code","sequence"],"properties":{"code":{"type":"string"},"sequence":{"type":"integer"}}}'::jsonb
where type_name = 'subject';

update public.node_types
set payload_schema = '{"type":"object","required":["code","sequence"],"properties":{"code":{"type":"string"},"sequence":{"type":"integer"}}}'::jsonb
where type_name = 'level';

update public.node_types
set payload_schema = $js$
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
$js$::jsonb
where type_name = 'national_syllabus';

update public.node_types
set payload_schema = '{"type":"object","required":["code","description","duration_weeks","sequence"],"properties":{"code":{"type":"string"},"description":{"type":["string","null"]},"duration_weeks":{"type":["integer","null"]},"sequence":{"type":"integer"}}}'::jsonb
where type_name = 'syllabus_topic';

update public.node_types
set payload_schema = '{"type":"object","required":["code","description","competence_type","sequence"],"properties":{"code":{"type":"string"},"description":{"type":"string"},"competence_type":{"enum":["knowledge","skill","attitude","value"]},"sequence":{"type":"integer"}}}'::jsonb
where type_name = 'outcome';

update public.node_types
set payload_schema = '{"type":"object","required":["sequence","description"],"properties":{"sequence":{"type":"integer"},"description":{"type":"string"}}}'::jsonb
where type_name = 'indicator';

update public.node_types
set payload_schema = $js$
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
$js$::jsonb
where type_name = 'theme';

update public.node_types
set payload_schema = $js$
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
$js$::jsonb
where type_name = 'sub_theme';

update public.node_types
set payload_schema = '{"type":"object","required":["code","outcome","organisation","notes","fidelity"],"properties":{"code":{"type":"string"},"outcome":{"type":["string","null"]},"organisation":{"type":"string"},"notes":{"type":["array","null"],"items":{"type":"string"}},"fidelity":{"enum":["mirrored","outline"]}}}'::jsonb
where type_name = 'learning_area';

-- ------------------------------------------------------------
-- 5. Mark the NCDC document root as standard-root-capable
-- ------------------------------------------------------------

update public.node_types
set is_root = true
where type_name = 'curriculum_template';