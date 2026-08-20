-- ============================================================
-- Sprint 2 (curriculum structure): the Curriculum blueprint.
-- A Curriculum lives under a Space and is organised as a tree:
--
--   curricula ── curriculum_goals
--      ├── grades → terms → units → topics
--      │                             ├── learning_objectives
--      │                             ├── content
--      │                             ├── lessons → activities
--      │                             │                  ├── assessments
--      │                             │                  └── resources (M2M)
--      │                             └── teaching_guidance
--      ├── projects (per unit)
--      └── curriculum_evaluations (per curriculum)
--
-- Every child row resolves to its curriculum via SECURITY DEFINER
-- helpers, so RLS on each table is scoped through the space the
-- curriculum belongs to: members read, staff (admin/teacher) write.
-- ============================================================

-- ------------------------------------------------------------
-- enums
-- ------------------------------------------------------------

create type resource_type as enum ('link', 'video', 'document', 'text');
create type assessment_type as enum ('quiz', 'exercise', 'test', 'project');

-- ------------------------------------------------------------
-- curricula: the root of a space's curriculum (e.g. "Primary
-- Mathematics", 2026). A curriculum belongs to exactly one space.
-- ------------------------------------------------------------

create table public.curricula (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null,
  year smallint not null check (year between 1900 and 2200),
  created_at timestamptz not null default now()
);

create index curricula_space_idx on public.curricula (space_id);

-- ------------------------------------------------------------
-- curriculum_goals: the aims a curriculum sets out to achieve
-- ------------------------------------------------------------

create table public.curriculum_goals (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curricula (id) on delete cascade,
  description text not null,
  created_at timestamptz not null default now()
);

create index curriculum_goals_curriculum_idx on public.curriculum_goals (curriculum_id);

-- ------------------------------------------------------------
-- grades → terms → units → topics (the academic tree)
-- ------------------------------------------------------------

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curricula (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index grades_curriculum_idx on public.grades (curriculum_id);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references public.grades (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index terms_grade_idx on public.terms (grade_id);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.terms (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index units_term_idx on public.units (term_id);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index topics_unit_idx on public.topics (unit_id);

-- ------------------------------------------------------------
-- topic children: what a topic teaches
-- ------------------------------------------------------------

create table public.learning_objectives (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  description text not null,
  sequence smallint not null default 1 check (sequence >= 1),
  created_at timestamptz not null default now()
);

create index learning_objectives_topic_idx on public.learning_objectives (topic_id);

create table public.content (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index content_topic_idx on public.content (topic_id);

create table public.teaching_guidance (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  guidance text not null,
  created_at timestamptz not null default now()
);

create index teaching_guidance_topic_idx on public.teaching_guidance (topic_id);

-- ------------------------------------------------------------
-- lessons: the reusable teaching plan under a topic
-- ------------------------------------------------------------

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  title text not null,
  description text not null default '',
  duration_minutes smallint not null default 45 check (duration_minutes between 1 and 480),
  created_at timestamptz not null default now()
);

create index lessons_topic_idx on public.lessons (topic_id);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  title text not null,
  description text not null default '',
  sequence smallint not null default 1 check (sequence >= 1),
  created_at timestamptz not null default now()
);

create index activities_lesson_idx on public.activities (lesson_id);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  title text not null,
  type assessment_type not null default 'quiz',
  description text not null default '',
  sequence smallint not null default 1 check (sequence >= 1),
  created_at timestamptz not null default now()
);

create index assessments_lesson_idx on public.assessments (lesson_id);

-- ------------------------------------------------------------
-- resources: a shared library linked to lessons (many-to-many)
-- ------------------------------------------------------------

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type resource_type not null default 'link',
  url text not null default '',
  created_at timestamptz not null default now()
);

create table public.lesson_resources (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lesson_id, resource_id)
);

create index lesson_resources_resource_idx on public.lesson_resources (resource_id);

-- ------------------------------------------------------------
-- projects (per unit) and curriculum_evaluations (per curriculum)
-- ------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index projects_unit_idx on public.projects (unit_id);

create table public.curriculum_evaluations (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curricula (id) on delete cascade,
  period text not null,
  achievement_rate numeric(5, 2) not null default 0 check (achievement_rate between 0 and 100),
  created_at timestamptz not null default now()
);

create index curriculum_evaluations_curriculum_idx on public.curriculum_evaluations (curriculum_id);

-- ------------------------------------------------------------
-- RLS helpers: resolve a child row to its curriculum, then check
-- the caller's membership in the curriculum's space. SECURITY
-- DEFINER so the joins bypass RLS (the policies that call them
-- still gate access for the caller).
-- ------------------------------------------------------------

create or replace function public.grade_curriculum(p_grade_id uuid)
returns uuid
language sql stable security definer
set search_path = public
as $$
  select curriculum_id from public.grades where id = p_grade_id
$$;

create or replace function public.term_curriculum(p_term_id uuid)
returns uuid
language sql stable security definer
set search_path = public
as $$
  select g.curriculum_id
  from public.terms as t
  join public.grades as g on g.id = t.grade_id
  where t.id = p_term_id
$$;

create or replace function public.unit_curriculum(p_unit_id uuid)
returns uuid
language sql stable security definer
set search_path = public
as $$
  select g.curriculum_id
  from public.units as u
  join public.terms as t on t.id = u.term_id
  join public.grades as g on g.id = t.grade_id
  where u.id = p_unit_id
$$;

create or replace function public.topic_curriculum(p_topic_id uuid)
returns uuid
language sql stable security definer
set search_path = public
as $$
  select g.curriculum_id
  from public.topics as tp
  join public.units as u on u.id = tp.unit_id
  join public.terms as t on t.id = u.term_id
  join public.grades as g on g.id = t.grade_id
  where tp.id = p_topic_id
$$;

create or replace function public.lesson_curriculum(p_lesson_id uuid)
returns uuid
language sql stable security definer
set search_path = public
as $$
  select public.topic_curriculum(topic_id)
  from public.lessons
  where id = p_lesson_id
$$;

create or replace function public.can_access_curriculum(p_curriculum_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.curricula as c
    join public.space_memberships as m on m.space_id = c.space_id
    where c.id = p_curriculum_id and m.user_id = auth.uid()
  )
$$;

create or replace function public.can_edit_curriculum(p_curriculum_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.curricula as c
    join public.space_memberships as m on m.space_id = c.space_id
    where c.id = p_curriculum_id
      and m.user_id = auth.uid()
      and m.role in ('admin', 'teacher')
  )
$$;

-- ------------------------------------------------------------
-- row level security
-- ------------------------------------------------------------

alter table public.curricula enable row level security;

create policy "curricula_select_members"
  on public.curricula for select
  using (public.can_access_curriculum(id));

create policy "curricula_insert_staff"
  on public.curricula for insert
  with check (
    exists (
      select 1 from public.space_memberships as m
      where m.space_id = space_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'teacher')
    )
  );

create policy "curricula_update_staff"
  on public.curricula for update
  using (public.can_edit_curriculum(id))
  with check (public.can_edit_curriculum(id));

create policy "curricula_delete_staff"
  on public.curricula for delete
  using (public.can_edit_curriculum(id));

-- curriculum_goals
alter table public.curriculum_goals enable row level security;

create policy "curriculum_goals_select_members"
  on public.curriculum_goals for select
  using (public.can_access_curriculum(curriculum_id));

create policy "curriculum_goals_insert_staff"
  on public.curriculum_goals for insert
  with check (public.can_edit_curriculum(curriculum_id));

create policy "curriculum_goals_update_staff"
  on public.curriculum_goals for update
  using (public.can_edit_curriculum(curriculum_id))
  with check (public.can_edit_curriculum(curriculum_id));

create policy "curriculum_goals_delete_staff"
  on public.curriculum_goals for delete
  using (public.can_edit_curriculum(curriculum_id));

-- grades
alter table public.grades enable row level security;

create policy "grades_select_members"
  on public.grades for select
  using (public.can_access_curriculum(curriculum_id));

create policy "grades_insert_staff"
  on public.grades for insert
  with check (public.can_edit_curriculum(curriculum_id));

create policy "grades_update_staff"
  on public.grades for update
  using (public.can_edit_curriculum(curriculum_id))
  with check (public.can_edit_curriculum(curriculum_id));

create policy "grades_delete_staff"
  on public.grades for delete
  using (public.can_edit_curriculum(curriculum_id));

-- terms
alter table public.terms enable row level security;

create policy "terms_select_members"
  on public.terms for select
  using (public.can_access_curriculum(public.grade_curriculum(grade_id)));

create policy "terms_insert_staff"
  on public.terms for insert
  with check (public.can_edit_curriculum(public.grade_curriculum(grade_id)));

create policy "terms_update_staff"
  on public.terms for update
  using (public.can_edit_curriculum(public.grade_curriculum(grade_id)))
  with check (public.can_edit_curriculum(public.grade_curriculum(grade_id)));

create policy "terms_delete_staff"
  on public.terms for delete
  using (public.can_edit_curriculum(public.grade_curriculum(grade_id)));

-- units
alter table public.units enable row level security;

create policy "units_select_members"
  on public.units for select
  using (public.can_access_curriculum(public.term_curriculum(term_id)));

create policy "units_insert_staff"
  on public.units for insert
  with check (public.can_edit_curriculum(public.term_curriculum(term_id)));

create policy "units_update_staff"
  on public.units for update
  using (public.can_edit_curriculum(public.term_curriculum(term_id)))
  with check (public.can_edit_curriculum(public.term_curriculum(term_id)));

create policy "units_delete_staff"
  on public.units for delete
  using (public.can_edit_curriculum(public.term_curriculum(term_id)));

-- topics
alter table public.topics enable row level security;

create policy "topics_select_members"
  on public.topics for select
  using (public.can_access_curriculum(public.unit_curriculum(unit_id)));

create policy "topics_insert_staff"
  on public.topics for insert
  with check (public.can_edit_curriculum(public.unit_curriculum(unit_id)));

create policy "topics_update_staff"
  on public.topics for update
  using (public.can_edit_curriculum(public.unit_curriculum(unit_id)))
  with check (public.can_edit_curriculum(public.unit_curriculum(unit_id)));

create policy "topics_delete_staff"
  on public.topics for delete
  using (public.can_edit_curriculum(public.unit_curriculum(unit_id)));

-- learning_objectives / content / teaching_guidance (topic children)
alter table public.learning_objectives enable row level security;

create policy "learning_objectives_select_members"
  on public.learning_objectives for select
  using (public.can_access_curriculum(public.topic_curriculum(topic_id)));

create policy "learning_objectives_insert_staff"
  on public.learning_objectives for insert
  with check (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

create policy "learning_objectives_update_staff"
  on public.learning_objectives for update
  using (public.can_edit_curriculum(public.topic_curriculum(topic_id)))
  with check (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

create policy "learning_objectives_delete_staff"
  on public.learning_objectives for delete
  using (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

alter table public.content enable row level security;

create policy "content_select_members"
  on public.content for select
  using (public.can_access_curriculum(public.topic_curriculum(topic_id)));

create policy "content_insert_staff"
  on public.content for insert
  with check (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

create policy "content_update_staff"
  on public.content for update
  using (public.can_edit_curriculum(public.topic_curriculum(topic_id)))
  with check (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

create policy "content_delete_staff"
  on public.content for delete
  using (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

alter table public.teaching_guidance enable row level security;

create policy "teaching_guidance_select_members"
  on public.teaching_guidance for select
  using (public.can_access_curriculum(public.topic_curriculum(topic_id)));

create policy "teaching_guidance_insert_staff"
  on public.teaching_guidance for insert
  with check (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

create policy "teaching_guidance_update_staff"
  on public.teaching_guidance for update
  using (public.can_edit_curriculum(public.topic_curriculum(topic_id)))
  with check (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

create policy "teaching_guidance_delete_staff"
  on public.teaching_guidance for delete
  using (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

-- lessons
alter table public.lessons enable row level security;

create policy "lessons_select_members"
  on public.lessons for select
  using (public.can_access_curriculum(public.topic_curriculum(topic_id)));

create policy "lessons_insert_staff"
  on public.lessons for insert
  with check (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

create policy "lessons_update_staff"
  on public.lessons for update
  using (public.can_edit_curriculum(public.topic_curriculum(topic_id)))
  with check (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

create policy "lessons_delete_staff"
  on public.lessons for delete
  using (public.can_edit_curriculum(public.topic_curriculum(topic_id)));

-- activities / assessments / lesson_resources (lesson children)
alter table public.activities enable row level security;

create policy "activities_select_members"
  on public.activities for select
  using (public.can_access_curriculum(public.lesson_curriculum(lesson_id)));

create policy "activities_insert_staff"
  on public.activities for insert
  with check (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

create policy "activities_update_staff"
  on public.activities for update
  using (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)))
  with check (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

create policy "activities_delete_staff"
  on public.activities for delete
  using (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

alter table public.assessments enable row level security;

create policy "assessments_select_members"
  on public.assessments for select
  using (public.can_access_curriculum(public.lesson_curriculum(lesson_id)));

create policy "assessments_insert_staff"
  on public.assessments for insert
  with check (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

create policy "assessments_update_staff"
  on public.assessments for update
  using (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)))
  with check (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

create policy "assessments_delete_staff"
  on public.assessments for delete
  using (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

alter table public.lesson_resources enable row level security;

create policy "lesson_resources_select_members"
  on public.lesson_resources for select
  using (public.can_access_curriculum(public.lesson_curriculum(lesson_id)));

create policy "lesson_resources_insert_staff"
  on public.lesson_resources for insert
  with check (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

create policy "lesson_resources_update_staff"
  on public.lesson_resources for update
  using (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)))
  with check (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

create policy "lesson_resources_delete_staff"
  on public.lesson_resources for delete
  using (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

-- projects (per unit)
alter table public.projects enable row level security;

create policy "projects_select_members"
  on public.projects for select
  using (public.can_access_curriculum(public.unit_curriculum(unit_id)));

create policy "projects_insert_staff"
  on public.projects for insert
  with check (public.can_edit_curriculum(public.unit_curriculum(unit_id)));

create policy "projects_update_staff"
  on public.projects for update
  using (public.can_edit_curriculum(public.unit_curriculum(unit_id)))
  with check (public.can_edit_curriculum(public.unit_curriculum(unit_id)));

create policy "projects_delete_staff"
  on public.projects for delete
  using (public.can_edit_curriculum(public.unit_curriculum(unit_id)));

-- curriculum_evaluations (per curriculum)
alter table public.curriculum_evaluations enable row level security;

create policy "curriculum_evaluations_select_members"
  on public.curriculum_evaluations for select
  using (public.can_access_curriculum(curriculum_id));

create policy "curriculum_evaluations_insert_staff"
  on public.curriculum_evaluations for insert
  with check (public.can_edit_curriculum(curriculum_id));

create policy "curriculum_evaluations_update_staff"
  on public.curriculum_evaluations for update
  using (public.can_edit_curriculum(curriculum_id))
  with check (public.can_edit_curriculum(curriculum_id));

create policy "curriculum_evaluations_delete_staff"
  on public.curriculum_evaluations for delete
  using (public.can_edit_curriculum(curriculum_id));

-- resources: a shared library; readable by any signed-in user and
-- writable by any staff member (they have no space link of their own)
alter table public.resources enable row level security;

create policy "resources_select_authenticated"
  on public.resources for select
  using (true);

create policy "resources_insert_staff"
  on public.resources for insert
  with check (
    exists (
      select 1 from public.space_memberships as m
      where m.user_id = auth.uid() and m.role in ('admin', 'teacher')
    )
  );

create policy "resources_update_staff"
  on public.resources for update
  using (
    exists (
      select 1 from public.space_memberships as m
      where m.user_id = auth.uid() and m.role in ('admin', 'teacher')
    )
  )
  with check (
    exists (
      select 1 from public.space_memberships as m
      where m.user_id = auth.uid() and m.role in ('admin', 'teacher')
    )
  );

create policy "resources_delete_staff"
  on public.resources for delete
  using (
    exists (
      select 1 from public.space_memberships as m
      where m.user_id = auth.uid() and m.role in ('admin', 'teacher')
    )
  );

-- ------------------------------------------------------------
-- grants
-- ------------------------------------------------------------

grant select on public.curricula to authenticated;
grant select, insert, update, delete on public.curriculum_goals to authenticated;
grant select, insert, update, delete on public.grades to authenticated;
grant select, insert, update, delete on public.terms to authenticated;
grant select, insert, update, delete on public.units to authenticated;
grant select, insert, update, delete on public.topics to authenticated;
grant select, insert, update, delete on public.learning_objectives to authenticated;
grant select, insert, update, delete on public.content to authenticated;
grant select, insert, update, delete on public.teaching_guidance to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.activities to authenticated;
grant select, insert, update, delete on public.assessments to authenticated;
grant select, insert, update, delete on public.resources to authenticated;
grant select, insert, update, delete on public.lesson_resources to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.curriculum_evaluations to authenticated;
