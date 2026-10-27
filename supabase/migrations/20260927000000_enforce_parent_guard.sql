-- ------------------------------------------------------------
-- Enforce tree-topology: non-root node types must hang off a parent.
--
-- node_payload_valid grows a parent_node_id argument so the row CHECK
-- (previously blind to lineage) can reject a non-root type used as a
-- top-level document. All existing rows satisfy the new guard: standard
-- trees start at an is_root type, and every non-root node already has a
-- parent.
-- ------------------------------------------------------------

create or replace function public.node_payload_valid(p_type_id bigint, p_parent_node_id bigint, p_payload jsonb)
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

  -- Trees start at a root type: a non-root node must have a parent.
  if not v_is_root and p_parent_node_id is null then
    return false;
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

alter table public.curriculum_nodes
  drop constraint curriculum_nodes_payload_check;

alter table public.curriculum_nodes
  add constraint curriculum_nodes_payload_check
  check (public.node_payload_valid(type_id, parent_node_id, payload));