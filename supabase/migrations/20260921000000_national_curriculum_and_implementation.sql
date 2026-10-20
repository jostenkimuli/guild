-- ============================================================
-- Curriculum cycles 1 and 2
--
--   Cycle 1  Define the national curriculum clearly.
--            Platform-managed reference data: the framework a school
--            follows (aims, themes, sub-themes, competences, weekly
--            time allocation, rules). Read by any signed-in user,
--            written by platform admins only.
--
--   Cycle 2  Translate it into implementation standards.
--            Per-school data: which framework the school adopted, its
--            week-by-week plan, its timetable and the decisions the
--            framework leaves to the school. Read by school staff and
--            teachers, written by the school owner (ecosystem admin).
-- ============================================================

-- ------------------------------------------------------------
-- enums
-- ------------------------------------------------------------

create type public.requirement_level as enum (
  'mandatory',
  'required_outcome',
  'flexible'
);

create type public.implementation_status as enum (
  'not_started',
  'draft',
  'ready',
  'approved'
);

-- ------------------------------------------------------------
-- RLS helpers (security definer so policies do not recurse)
-- ------------------------------------------------------------

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles as p
    where p.id = auth.uid()
      and p.role in ('super_admin', 'program_admin')
      and p.status = 'approved'
  )
$$;

-- The approved ecosystem admin who runs this ecosystem (the school owner).
create or replace function public.is_ecosystem_owner(p_ecosystem_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.ecosystem_staff as es
    join public.profiles as p on p.id = es.user_id
    where es.ecosystem_id = p_ecosystem_id
      and es.user_id = auth.uid()
      and es.role = 'ecosystem_admin'
      and p.role = 'ecosystem_admin'
      and p.status = 'approved'
  )
$$;

-- Who may read a school's implementation plan: its owner, its staff, its
-- teachers/space admins, and platform admins.
create or replace function public.can_view_school_plan(p_ecosystem_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    public.is_ecosystem_owner(p_ecosystem_id)
    or public.is_platform_admin()
    or exists (
      select 1 from public.ecosystem_staff as es
      where es.ecosystem_id = p_ecosystem_id and es.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.space_memberships as m
      join public.spaces as s on s.id = m.space_id
      where s.ecosystem_id = p_ecosystem_id
        and m.user_id = auth.uid()
        and m.role in ('teacher', 'admin')
    )
$$;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_ecosystem_owner(uuid) to authenticated;
grant execute on function public.can_view_school_plan(uuid) to authenticated;

-- ============================================================
-- CYCLE 1: national curriculum (reference data)
-- ============================================================

create table public.national_curricula (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  authority text not null,
  cycle_label text not null,
  class_level text not null,
  ecosystem_type public.ecosystem_type not null default 'primary_school',
  edition text not null,
  source_url text,
  -- Terms that open with an orientation week before the themed weeks.
  orientation_terms smallint[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.national_aims (
  id uuid primary key default gen_random_uuid(),
  national_curriculum_id uuid not null
    references public.national_curricula (id) on delete cascade,
  kind text not null check (kind in ('national', 'primary')),
  position smallint not null check (position >= 1),
  description text not null,
  unique (national_curriculum_id, kind, position)
);

create index national_aims_curriculum_idx
  on public.national_aims (national_curriculum_id);

-- A strand is a learning area. Thematic strands appear in every sub-theme;
-- the others (religious and physical education) run on their own schedule.
create table public.national_strands (
  id uuid primary key default gen_random_uuid(),
  national_curriculum_id uuid not null
    references public.national_curricula (id) on delete cascade,
  key text not null,
  name text not null,
  is_thematic boolean not null default true,
  sort_order smallint not null default 0,
  unique (national_curriculum_id, key)
);

create index national_strands_curriculum_idx
  on public.national_strands (national_curriculum_id);

create table public.national_themes (
  id uuid primary key default gen_random_uuid(),
  national_curriculum_id uuid not null
    references public.national_curricula (id) on delete cascade,
  term_no smallint not null check (term_no between 1 and 3),
  theme_no smallint not null check (theme_no >= 1),
  name text not null,
  learning_outcome text not null,
  unique (national_curriculum_id, theme_no)
);

create index national_themes_curriculum_idx
  on public.national_themes (national_curriculum_id);

-- One sub-theme is one teaching week.
create table public.national_subthemes (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.national_themes (id) on delete cascade,
  code text not null,
  position smallint not null check (position >= 1),
  name text not null,
  content text not null default '',
  unique (theme_id, position)
);

create index national_subthemes_theme_idx on public.national_subthemes (theme_id);

create table public.national_competences (
  id uuid primary key default gen_random_uuid(),
  subtheme_id uuid not null
    references public.national_subthemes (id) on delete cascade,
  strand_id uuid not null references public.national_strands (id) on delete cascade,
  description text not null,
  requirement_level public.requirement_level not null default 'required_outcome',
  sort_order smallint not null default 0
);

create index national_competences_subtheme_idx
  on public.national_competences (subtheme_id);
create index national_competences_strand_idx
  on public.national_competences (strand_id);

-- "Competences that can be assessed" at the end of each theme.
create table public.national_assessment_guidelines (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.national_themes (id) on delete cascade,
  strand_id uuid not null references public.national_strands (id) on delete cascade,
  description text not null,
  sort_order smallint not null default 0
);

create index national_assessment_guidelines_theme_idx
  on public.national_assessment_guidelines (theme_id);
create index national_assessment_guidelines_strand_idx
  on public.national_assessment_guidelines (strand_id);

-- Periods per week. follows_key: every period must directly follow a period of
-- that allocation. block_size: periods come in consecutive blocks of this size.
create table public.national_period_allocations (
  id uuid primary key default gen_random_uuid(),
  national_curriculum_id uuid not null
    references public.national_curricula (id) on delete cascade,
  key text not null,
  label text not null,
  group_label text,
  periods smallint not null check (periods >= 0),
  block_size smallint not null default 1 check (block_size >= 1),
  follows_key text,
  note text,
  sort_order smallint not null default 0,
  unique (national_curriculum_id, key)
);

create index national_period_allocations_curriculum_idx
  on public.national_period_allocations (national_curriculum_id);

create table public.national_rules (
  id uuid primary key default gen_random_uuid(),
  national_curriculum_id uuid not null
    references public.national_curricula (id) on delete cascade,
  rule_group text not null
    check (rule_group in ('language', 'timetable', 'assessment', 'teaching')),
  description text not null,
  requirement_level public.requirement_level not null default 'mandatory',
  sort_order smallint not null default 0
);

create index national_rules_curriculum_idx
  on public.national_rules (national_curriculum_id);

-- Learning areas outside the themes (RE, PE): what runs in which weeks.
create table public.national_area_units (
  id uuid primary key default gen_random_uuid(),
  strand_id uuid not null references public.national_strands (id) on delete cascade,
  term_no smallint not null check (term_no between 1 and 3),
  weeks_label text not null,
  title text not null,
  learning_outcome text,
  sort_order smallint not null default 0
);

create index national_area_units_strand_idx on public.national_area_units (strand_id);

-- ============================================================
-- CYCLE 2: school implementation (per ecosystem)
-- ============================================================

create table public.school_curriculum_adoptions (
  id uuid primary key default gen_random_uuid(),
  ecosystem_id uuid not null references public.ecosystems (id) on delete cascade,
  national_curriculum_id uuid not null
    references public.national_curricula (id) on delete cascade,
  adopted_by uuid references public.profiles (id) on delete set null,
  adopted_at timestamptz not null default now(),
  notify_on_change boolean not null default false,
  unique (ecosystem_id, national_curriculum_id)
);

create index school_curriculum_adoptions_curriculum_idx
  on public.school_curriculum_adoptions (national_curriculum_id);

-- The school's plan for one teaching week (one national sub-theme).
create table public.implementation_weeks (
  id uuid primary key default gen_random_uuid(),
  ecosystem_id uuid not null references public.ecosystems (id) on delete cascade,
  national_subtheme_id uuid not null
    references public.national_subthemes (id) on delete cascade,
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
  unique (ecosystem_id, national_subtheme_id),
  check (
    planned_start is null or planned_end is null or planned_end >= planned_start
  )
);

create index implementation_weeks_subtheme_idx
  on public.implementation_weeks (national_subtheme_id);
create index implementation_weeks_teacher_idx
  on public.implementation_weeks (teacher_id);

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

create table public.implementation_timetables (
  id uuid primary key default gen_random_uuid(),
  ecosystem_id uuid not null references public.ecosystems (id) on delete cascade,
  national_curriculum_id uuid not null
    references public.national_curricula (id) on delete cascade,
  periods_per_day smallint not null default 8 check (periods_per_day between 1 and 12),
  published_at timestamptz,
  published_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (ecosystem_id, national_curriculum_id)
);

create index implementation_timetables_curriculum_idx
  on public.implementation_timetables (national_curriculum_id);

create trigger implementation_timetables_set_updated_at
  before update on public.implementation_timetables
  for each row execute function public.set_updated_at();

create table public.implementation_timetable_slots (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null
    references public.implementation_timetables (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 5),
  period_no smallint not null check (period_no >= 1),
  allocation_id uuid not null
    references public.national_period_allocations (id) on delete cascade,
  unique (timetable_id, day_of_week, period_no)
);

create index implementation_timetable_slots_allocation_idx
  on public.implementation_timetable_slots (allocation_id);

-- Choices the national curriculum leaves to the school.
create table public.school_decisions (
  id uuid primary key default gen_random_uuid(),
  ecosystem_id uuid not null references public.ecosystems (id) on delete cascade,
  national_curriculum_id uuid not null
    references public.national_curricula (id) on delete cascade,
  decision_key text not null check (
    decision_key in (
      'language_of_instruction',
      'religious_education',
      'competence_recording',
      'parent_reports'
    )
  ),
  value text not null,
  detail text,
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz not null default now(),
  unique (ecosystem_id, national_curriculum_id, decision_key)
);

create index school_decisions_curriculum_idx
  on public.school_decisions (national_curriculum_id);

-- ------------------------------------------------------------
-- child-row helpers
-- ------------------------------------------------------------

create or replace function public.implementation_week_ecosystem(p_week_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select ecosystem_id from public.implementation_weeks where id = p_week_id
$$;

create or replace function public.implementation_timetable_ecosystem(p_timetable_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select ecosystem_id from public.implementation_timetables where id = p_timetable_id
$$;

grant execute on function public.implementation_week_ecosystem(uuid) to authenticated;
grant execute on function public.implementation_timetable_ecosystem(uuid) to authenticated;

-- ------------------------------------------------------------
-- row level security: national reference data
-- Any signed-in user reads; only platform admins write.
-- ------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'national_curricula',
    'national_aims',
    'national_strands',
    'national_themes',
    'national_subthemes',
    'national_competences',
    'national_assessment_guidelines',
    'national_period_allocations',
    'national_rules',
    'national_area_units'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select_authenticated', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_platform_admin())',
      t || '_insert_platform_admin', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin())',
      t || '_update_platform_admin', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_platform_admin())',
      t || '_delete_platform_admin', t
    );

    execute format(
      'grant select, insert, update, delete on public.%I to authenticated', t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- row level security: school implementation
-- Owner writes; school staff and teachers read.
-- ------------------------------------------------------------

alter table public.school_curriculum_adoptions enable row level security;

create policy "school_curriculum_adoptions_select_school"
  on public.school_curriculum_adoptions for select to authenticated
  using (public.can_view_school_plan(ecosystem_id));

create policy "school_curriculum_adoptions_insert_owner"
  on public.school_curriculum_adoptions for insert to authenticated
  with check (public.is_ecosystem_owner(ecosystem_id) and adopted_by = auth.uid());

create policy "school_curriculum_adoptions_update_owner"
  on public.school_curriculum_adoptions for update to authenticated
  using (public.is_ecosystem_owner(ecosystem_id))
  with check (public.is_ecosystem_owner(ecosystem_id));

create policy "school_curriculum_adoptions_delete_owner"
  on public.school_curriculum_adoptions for delete to authenticated
  using (public.is_ecosystem_owner(ecosystem_id));

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

alter table public.implementation_timetables enable row level security;

create policy "implementation_timetables_select_school"
  on public.implementation_timetables for select to authenticated
  using (public.can_view_school_plan(ecosystem_id));

create policy "implementation_timetables_insert_owner"
  on public.implementation_timetables for insert to authenticated
  with check (public.is_ecosystem_owner(ecosystem_id));

create policy "implementation_timetables_update_owner"
  on public.implementation_timetables for update to authenticated
  using (public.is_ecosystem_owner(ecosystem_id))
  with check (public.is_ecosystem_owner(ecosystem_id));

create policy "implementation_timetables_delete_owner"
  on public.implementation_timetables for delete to authenticated
  using (public.is_ecosystem_owner(ecosystem_id));

alter table public.implementation_timetable_slots enable row level security;

create policy "implementation_timetable_slots_select_school"
  on public.implementation_timetable_slots for select to authenticated
  using (public.can_view_school_plan(public.implementation_timetable_ecosystem(timetable_id)));

create policy "implementation_timetable_slots_insert_owner"
  on public.implementation_timetable_slots for insert to authenticated
  with check (public.is_ecosystem_owner(public.implementation_timetable_ecosystem(timetable_id)));

create policy "implementation_timetable_slots_update_owner"
  on public.implementation_timetable_slots for update to authenticated
  using (public.is_ecosystem_owner(public.implementation_timetable_ecosystem(timetable_id)))
  with check (public.is_ecosystem_owner(public.implementation_timetable_ecosystem(timetable_id)));

create policy "implementation_timetable_slots_delete_owner"
  on public.implementation_timetable_slots for delete to authenticated
  using (public.is_ecosystem_owner(public.implementation_timetable_ecosystem(timetable_id)));

alter table public.school_decisions enable row level security;

create policy "school_decisions_select_school"
  on public.school_decisions for select to authenticated
  using (public.can_view_school_plan(ecosystem_id));

create policy "school_decisions_insert_owner"
  on public.school_decisions for insert to authenticated
  with check (public.is_ecosystem_owner(ecosystem_id) and decided_by = auth.uid());

create policy "school_decisions_update_owner"
  on public.school_decisions for update to authenticated
  using (public.is_ecosystem_owner(ecosystem_id))
  with check (public.is_ecosystem_owner(ecosystem_id));

create policy "school_decisions_delete_owner"
  on public.school_decisions for delete to authenticated
  using (public.is_ecosystem_owner(ecosystem_id));

grant select, insert, update, delete on
  public.school_curriculum_adoptions,
  public.implementation_weeks,
  public.implementation_week_strand_plans,
  public.implementation_timetables,
  public.implementation_timetable_slots,
  public.school_decisions
to authenticated;

-- ------------------------------------------------------------
-- save_implementation_week
-- Upserts a week plan and replaces its per-strand notes in one transaction.
-- SECURITY INVOKER: row level security still applies to the caller.
-- ------------------------------------------------------------

create or replace function public.save_implementation_week(
  p_ecosystem_id uuid,
  p_subtheme_id uuid,
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
  v_comment text := nullif(btrim(coalesce(p_review_comment, '')), '');
  v_reviewed boolean;
begin
  if not public.is_ecosystem_owner(p_ecosystem_id) then
    raise exception 'Only the school owner can plan implementation weeks';
  end if;

  if not exists (
    select 1
    from public.national_subthemes as st
    join public.national_themes as th on th.id = st.theme_id
    join public.school_curriculum_adoptions as a
      on a.national_curriculum_id = th.national_curriculum_id
     and a.ecosystem_id = p_ecosystem_id
    where st.id = p_subtheme_id
  ) then
    raise exception 'Adopt the national curriculum before planning its weeks';
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
    ecosystem_id, national_subtheme_id, teacher_id, planned_start, planned_end,
    status, local_language_notes, sne_adaptations, checking_notes,
    review_comment, reviewed_by, reviewed_at
  )
  values (
    p_ecosystem_id, p_subtheme_id, p_teacher_id, p_planned_start, p_planned_end,
    p_status,
    coalesce(p_local_language_notes, ''),
    coalesce(p_sne_adaptations, ''),
    coalesce(p_checking_notes, ''),
    case when p_status = 'approved' then null else v_comment end,
    case when v_reviewed then v_actor end,
    case when v_reviewed then now() end
  )
  on conflict (ecosystem_id, national_subtheme_id) do update set
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
  join public.national_strands as s on s.id = (e ->> 'strand_id')::uuid
  join public.national_subthemes as st on st.id = p_subtheme_id
  join public.national_themes as th
    on th.id = st.theme_id and th.national_curriculum_id = s.national_curriculum_id
  where nullif(btrim(coalesce(e ->> 'how_we_teach', '')), '') is not null;

  return v_week_id;
end;
$$;

grant execute on function public.save_implementation_week(
  uuid, uuid, public.implementation_status, jsonb,
  uuid, date, date, text, text, text, text
) to authenticated;

-- ------------------------------------------------------------
-- save_implementation_timetable
-- Replaces the school's weekly timetable atomically. Editing un-publishes it;
-- publishing requires every required period to be placed.
-- p_slots: [{ "day": 1-5, "period": 1.., "allocation_id": uuid }]
-- ------------------------------------------------------------

create or replace function public.save_implementation_timetable(
  p_ecosystem_id uuid,
  p_national_curriculum_id uuid,
  p_periods_per_day smallint,
  p_slots jsonb,
  p_publish boolean
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_timetable_id uuid;
  v_expected integer := jsonb_array_length(coalesce(p_slots, '[]'::jsonb));
  v_inserted integer;
begin
  if not public.is_ecosystem_owner(p_ecosystem_id) then
    raise exception 'Only the school owner can change the timetable';
  end if;

  if not exists (
    select 1 from public.school_curriculum_adoptions
    where ecosystem_id = p_ecosystem_id
      and national_curriculum_id = p_national_curriculum_id
  ) then
    raise exception 'Adopt the national curriculum before building its timetable';
  end if;

  insert into public.implementation_timetables (
    ecosystem_id, national_curriculum_id, periods_per_day
  )
  values (p_ecosystem_id, p_national_curriculum_id, p_periods_per_day)
  on conflict (ecosystem_id, national_curriculum_id) do update set
    periods_per_day = excluded.periods_per_day,
    published_at = null,
    published_by = null
  returning id into v_timetable_id;

  delete from public.implementation_timetable_slots where timetable_id = v_timetable_id;

  insert into public.implementation_timetable_slots (
    timetable_id, day_of_week, period_no, allocation_id
  )
  select v_timetable_id, (e ->> 'day')::smallint, (e ->> 'period')::smallint, a.id
  from jsonb_array_elements(coalesce(p_slots, '[]'::jsonb)) as e
  join public.national_period_allocations as a
    on a.id = (e ->> 'allocation_id')::uuid
   and a.national_curriculum_id = p_national_curriculum_id
  where (e ->> 'day')::smallint between 1 and 5
    and (e ->> 'period')::smallint between 1 and p_periods_per_day;

  get diagnostics v_inserted = row_count;
  if v_inserted <> v_expected then
    raise exception 'The timetable contains an invalid slot';
  end if;

  if p_publish then
    if exists (
      select 1
      from public.national_period_allocations as a
      where a.national_curriculum_id = p_national_curriculum_id
        and a.periods <> (
          select count(*) from public.implementation_timetable_slots as s
          where s.timetable_id = v_timetable_id and s.allocation_id = a.id
        )
    ) then
      raise exception 'Place every required period before publishing the timetable';
    end if;

    update public.implementation_timetables
    set published_at = now(), published_by = v_actor
    where id = v_timetable_id;
  end if;

  return v_timetable_id;
end;
$$;

grant execute on function public.save_implementation_timetable(
  uuid, uuid, smallint, jsonb, boolean
) to authenticated;
