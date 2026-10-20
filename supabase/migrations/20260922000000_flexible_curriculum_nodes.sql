-- ============================================================
-- Flexible curriculum tree
--
-- Replaces the P1-only national_themes -> national_subthemes ->
-- national_competences chain with one generic, self-referencing
-- curriculum_nodes tree, typed by a plain `node_type` text column
-- rather than a separate lookup table (no node_types). A new
-- national curriculum level (subject-based O-Level, modular BTVET,
-- ...) adds a new node_type value later -- widening the check
-- constraint in a follow-up migration -- not a new table.
--
-- Everything NOT part of the theme/sub-theme/competence chain keeps
-- its name: national_curricula, national_strands, national_aims,
-- national_period_allocations, national_rules, national_area_units,
-- and every Cycle 2 (school implementation) table. Only their FK
-- columns are repointed where the tree underneath them changed.
--
-- No production data depends on the tables being dropped here --
-- this feature shipped this session and only Theme 1 was seeded --
-- so this migration drops and recreates rather than attempting a
-- risky in-place ALTER of a tree structure. Mirrors the precedent
-- already in this repo: 20260821000002_space_blueprint_delegation.sql
-- followed by 20260821000004_drop_blueprint_delegation_schema.sql.
-- ============================================================

-- ------------------------------------------------------------
-- drop what changes shape (cascades to their dependents)
-- ------------------------------------------------------------

drop table if exists public.national_assessment_guidelines cascade;
drop table if exists public.national_competences cascade;
drop table if exists public.national_subthemes cascade;
drop table if exists public.national_themes cascade;
drop table if exists public.implementation_week_strand_plans cascade;
drop table if exists public.implementation_weeks cascade;
drop function if exists public.save_implementation_week(
  uuid, uuid, public.implementation_status, jsonb,
  uuid, date, date, text, text, text, text
);
drop function if exists public.implementation_week_ecosystem(uuid);

-- The name curriculum_nodes already belongs to the empty, unused
-- "universal node abstraction" scaffold from 20260825000003 (bigserial PK,
-- type_id -> node_types, no space/curriculum scoping, nothing in src/ reads
-- it). That table depended on node_types, which this migration deliberately
-- avoids. Drop it -- cascade removes universal_assignments' now-orphaned FK
-- to it, but leaves universal_assignments itself (and node_types,
-- ecosystem_nodes) in place; they're independent of this curriculum work.
drop table if exists public.curriculum_nodes cascade;

-- ------------------------------------------------------------
-- curriculum_nodes: the one flexible tree
-- ------------------------------------------------------------

create table public.curriculum_nodes (
  id uuid primary key default gen_random_uuid(),
  national_curriculum_id uuid not null
    references public.national_curricula (id) on delete cascade,
  parent_id uuid references public.curriculum_nodes (id) on delete cascade,
  -- Widen this constraint in a later migration when a new level needs a
  -- new kind of node (e.g. 'subject', 'sub_strand', 'assessment_objective',
  -- 'module') -- an ordinary ALTER, not a new table.
  node_type text not null check (node_type in ('theme', 'sub_theme', 'competence')),
  -- Only meaningful for node_type = 'competence': which of the framework's
  -- strands this competence belongs to. Thematic curricula (P1-P3) cross-cut
  -- strands through every sub-theme, so a competence's strand isn't its tree
  -- ancestor -- it's a second, non-hierarchical classification.
  strand_id uuid references public.national_strands (id) on delete set null,
  title text not null,
  description text not null default '',
  sequence_order smallint not null default 0,
  -- Only meaningful for node_type = 'competence'.
  requirement_level public.requirement_level,
  -- Type-specific facts that don't earn their own column: a theme's
  -- {theme_no, term_no}, a sub-theme's {code, position}. New node types add
  -- new keys here, never a new column.
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (node_type <> 'competence' or parent_id is not null)
);

create index curriculum_nodes_curriculum_idx on public.curriculum_nodes (national_curriculum_id);
create index curriculum_nodes_parent_idx on public.curriculum_nodes (parent_id);
create index curriculum_nodes_strand_idx on public.curriculum_nodes (strand_id) where strand_id is not null;
create index curriculum_nodes_type_idx on public.curriculum_nodes (node_type);

alter table public.curriculum_nodes enable row level security;

create policy "curriculum_nodes_select_authenticated"
  on public.curriculum_nodes for select to authenticated using (true);
create policy "curriculum_nodes_insert_platform_admin"
  on public.curriculum_nodes for insert to authenticated with check (public.is_platform_admin());
create policy "curriculum_nodes_update_platform_admin"
  on public.curriculum_nodes for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "curriculum_nodes_delete_platform_admin"
  on public.curriculum_nodes for delete to authenticated using (public.is_platform_admin());

grant select, insert, update, delete on public.curriculum_nodes to authenticated;

-- ------------------------------------------------------------
-- national_assessment_guidelines: now points at a theme node
-- ------------------------------------------------------------

create table public.national_assessment_guidelines (
  id uuid primary key default gen_random_uuid(),
  theme_node_id uuid not null references public.curriculum_nodes (id) on delete cascade,
  strand_id uuid not null references public.national_strands (id) on delete cascade,
  description text not null,
  sort_order smallint not null default 0
);

create index national_assessment_guidelines_theme_idx
  on public.national_assessment_guidelines (theme_node_id);
create index national_assessment_guidelines_strand_idx
  on public.national_assessment_guidelines (strand_id);

alter table public.national_assessment_guidelines enable row level security;

create policy "national_assessment_guidelines_select_authenticated"
  on public.national_assessment_guidelines for select to authenticated using (true);
create policy "national_assessment_guidelines_insert_platform_admin"
  on public.national_assessment_guidelines for insert to authenticated with check (public.is_platform_admin());
create policy "national_assessment_guidelines_update_platform_admin"
  on public.national_assessment_guidelines for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "national_assessment_guidelines_delete_platform_admin"
  on public.national_assessment_guidelines for delete to authenticated using (public.is_platform_admin());

grant select, insert, update, delete on public.national_assessment_guidelines to authenticated;

-- ------------------------------------------------------------
-- implementation_weeks: now plans against any curriculum_node,
-- not specifically a sub-theme. A future subject-based level plans
-- against its own leaf node type the same way.
-- ------------------------------------------------------------

create table public.implementation_weeks (
  id uuid primary key default gen_random_uuid(),
  ecosystem_id uuid not null references public.ecosystems (id) on delete cascade,
  node_id uuid not null references public.curriculum_nodes (id) on delete cascade,
  teacher_id uuid references public.profiles (id) on delete set null,
  planned_start date,
  planned_end date,
  status public.implementation_status not null default 'draft',
  local_language_notes text not null default '',
  sne_adaptations text not null default '',
  checking_notes text not null default '',
  review_comment text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ecosystem_id, node_id),
  check (
    planned_start is null or planned_end is null or planned_end >= planned_start
  )
);

create index implementation_weeks_node_idx on public.implementation_weeks (node_id);
create index implementation_weeks_teacher_idx on public.implementation_weeks (teacher_id);

create trigger implementation_weeks_set_updated_at
  before update on public.implementation_weeks
  for each row execute function public.set_updated_at();

create table public.implementation_week_strand_plans (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.implementation_weeks (id) on delete cascade,
  strand_id uuid not null references public.national_strands (id) on delete cascade,
  how_we_teach text not null default '',
  unique (week_id, strand_id)
);

create index implementation_week_strand_plans_strand_idx
  on public.implementation_week_strand_plans (strand_id);

create or replace function public.implementation_week_ecosystem(p_week_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select ecosystem_id from public.implementation_weeks where id = p_week_id
$$;

grant execute on function public.implementation_week_ecosystem(uuid) to authenticated;

alter table public.implementation_weeks enable row level security;

create policy "implementation_weeks_select_school"
  on public.implementation_weeks for select to authenticated
  using (public.can_view_school_plan(ecosystem_id));
create policy "implementation_weeks_insert_owner"
  on public.implementation_weeks for insert to authenticated
  with check (public.is_ecosystem_owner(ecosystem_id));
create policy "implementation_weeks_update_owner"
  on public.implementation_weeks for update to authenticated
  using (public.is_ecosystem_owner(ecosystem_id))
  with check (public.is_ecosystem_owner(ecosystem_id));
create policy "implementation_weeks_delete_owner"
  on public.implementation_weeks for delete to authenticated
  using (public.is_ecosystem_owner(ecosystem_id));

alter table public.implementation_week_strand_plans enable row level security;

create policy "implementation_week_strand_plans_select_school"
  on public.implementation_week_strand_plans for select to authenticated
  using (public.can_view_school_plan(public.implementation_week_ecosystem(week_id)));
create policy "implementation_week_strand_plans_insert_owner"
  on public.implementation_week_strand_plans for insert to authenticated
  with check (public.is_ecosystem_owner(public.implementation_week_ecosystem(week_id)));
create policy "implementation_week_strand_plans_update_owner"
  on public.implementation_week_strand_plans for update to authenticated
  using (public.is_ecosystem_owner(public.implementation_week_ecosystem(week_id)))
  with check (public.is_ecosystem_owner(public.implementation_week_ecosystem(week_id)));
create policy "implementation_week_strand_plans_delete_owner"
  on public.implementation_week_strand_plans for delete to authenticated
  using (public.is_ecosystem_owner(public.implementation_week_ecosystem(week_id)));

grant select, insert, update, delete on public.implementation_weeks to authenticated;
grant select, insert, update, delete on public.implementation_week_strand_plans to authenticated;

-- ------------------------------------------------------------
-- save_implementation_week: plans against a curriculum_node
-- ------------------------------------------------------------

create or replace function public.save_implementation_week(
  p_ecosystem_id uuid,
  p_node_id uuid,
  p_status public.implementation_status,
  p_strand_plans jsonb,
  p_teacher_id uuid default null,
  p_planned_start date default null,
  p_planned_end date default null,
  p_local_language_notes text default '',
  p_sne_adaptations text default '',
  p_checking_notes text default '',
  p_review_comment text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_week_id uuid;
  v_curriculum_id uuid;
  v_comment text := nullif(btrim(coalesce(p_review_comment, '')), '');
  v_reviewed boolean;
begin
  if not public.is_ecosystem_owner(p_ecosystem_id) then
    raise exception 'Only the school owner can plan implementation weeks';
  end if;

  select national_curriculum_id into v_curriculum_id
  from public.curriculum_nodes
  where id = p_node_id;

  if v_curriculum_id is null then
    raise exception 'Curriculum node not found';
  end if;

  if not exists (
    select 1 from public.school_curriculum_adoptions
    where ecosystem_id = p_ecosystem_id and national_curriculum_id = v_curriculum_id
  ) then
    raise exception 'Adopt the national curriculum before planning its nodes';
  end if;

  if p_teacher_id is not null and not exists (
    select 1
    from public.space_memberships as m
    join public.spaces as s on s.id = m.space_id
    where s.ecosystem_id = p_ecosystem_id
      and m.user_id = p_teacher_id
      and m.role in ('teacher', 'admin')
    union all
    select 1
    from public.ecosystem_staff as es
    where es.ecosystem_id = p_ecosystem_id and es.user_id = p_teacher_id
  ) then
    raise exception 'The assigned teacher does not belong to this school';
  end if;

  v_reviewed := p_status = 'approved' or v_comment is not null;

  insert into public.implementation_weeks (
    ecosystem_id, node_id, teacher_id, planned_start, planned_end,
    status, local_language_notes, sne_adaptations, checking_notes,
    review_comment, reviewed_by, reviewed_at
  )
  values (
    p_ecosystem_id, p_node_id, p_teacher_id, p_planned_start, p_planned_end,
    p_status,
    coalesce(p_local_language_notes, ''),
    coalesce(p_sne_adaptations, ''),
    coalesce(p_checking_notes, ''),
    case when p_status = 'approved' then null else v_comment end,
    case when v_reviewed then v_actor end,
    case when v_reviewed then now() end
  )
  on conflict (ecosystem_id, node_id) do update set
    teacher_id = excluded.teacher_id,
    planned_start = excluded.planned_start,
    planned_end = excluded.planned_end,
    status = excluded.status,
    local_language_notes = excluded.local_language_notes,
    sne_adaptations = excluded.sne_adaptations,
    checking_notes = excluded.checking_notes,
    review_comment = case
      when p_status = 'approved' then null
      else coalesce(v_comment, public.implementation_weeks.review_comment)
    end,
    reviewed_by = case
      when v_reviewed then v_actor else public.implementation_weeks.reviewed_by
    end,
    reviewed_at = case
      when v_reviewed then now() else public.implementation_weeks.reviewed_at
    end
  returning id into v_week_id;

  delete from public.implementation_week_strand_plans where week_id = v_week_id;

  -- Only strands that belong to the same national curriculum are accepted.
  insert into public.implementation_week_strand_plans (week_id, strand_id, how_we_teach)
  select v_week_id, s.id, btrim(e ->> 'how_we_teach')
  from jsonb_array_elements(coalesce(p_strand_plans, '[]'::jsonb)) as e
  join public.national_strands as s
    on s.id = (e ->> 'strand_id')::uuid and s.national_curriculum_id = v_curriculum_id
  where nullif(btrim(coalesce(e ->> 'how_we_teach', '')), '') is not null;

  return v_week_id;
end;
$$;

grant execute on function public.save_implementation_week(
  uuid, uuid, public.implementation_status, jsonb,
  uuid, date, date, text, text, text, text
) to authenticated;
