-- ============================================================
-- Sprint additions: syllabi, delivery-layer enums, scheduled
-- sessions, and enriched topics / lessons.
-- ============================================================

-- ------------------------------------------------------------
-- 1. NEW ENUMS
-- ------------------------------------------------------------

create type public.lesson_delivery_type as enum ('self_paced', 'scheduled');
create type public.session_medium_type as enum ('online', 'physical');

-- ------------------------------------------------------------
-- 2. ALTER curricula — add creator tracking
-- ------------------------------------------------------------

alter table public.curricula
  add column created_by uuid references auth.users(id);

-- ------------------------------------------------------------
-- 3. ALTER topics — enrich with description, duration, ordering,
--    and a back-link to a curriculum goal
-- ------------------------------------------------------------

alter table public.topics
  add column description text,
  add column duration_weeks int default 1,
  add column sequence_order int not null default 0,
  add column linked_goal_id uuid references public.curriculum_goals(id) on delete set null;

-- ------------------------------------------------------------
-- 4. ALTER lessons — overhaul to support teacher-owned,
--    publishable lessons with delivery metadata
-- ------------------------------------------------------------

-- Add the new columns first
alter table public.lessons
  add column teacher_id uuid references auth.users(id),
  add column content text,
  add column video_url text,
  add column is_published boolean default false,
  add column published_at timestamptz,
  add column delivery_type public.lesson_delivery_type not null default 'self_paced',
  add column estimated_duration_minutes int;

-- Drop the old columns that are replaced / relocated
alter table public.lessons
  drop column if exists description,
  drop column if exists duration_minutes;

-- ------------------------------------------------------------
-- 5. NEW TABLE: syllabi — ties a curriculum to a grading
--    policy, required materials, and a specific teacher
-- ------------------------------------------------------------

create table public.syllabi (
  id                uuid primary key default gen_random_uuid(),
  curriculum_id     uuid not null unique references public.curricula(id) on delete cascade,
  grading_policy    jsonb not null,
  required_materials text,
  instructor_notes  text,
  teacher_id        uuid references auth.users(id),
  created_at        timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. NEW TABLE: scheduled_sessions — the "scheduled" delivery
--    arm for lessons that happen at a specific time/place
-- ------------------------------------------------------------

create table public.scheduled_sessions (
  id                uuid primary key default gen_random_uuid(),
  lesson_id         uuid not null unique references public.lessons(id) on delete cascade,
  medium            public.session_medium_type not null default 'physical',
  scheduled_start   timestamptz not null,
  scheduled_end     timestamptz not null,
  session_status    varchar(50) default 'scheduled',
  meeting_url       text,
  location_room     text,
  recording_url     text,
  handout_notes_url text,
  created_at        timestamptz not null default now(),

  constraint check_session_times       check (scheduled_start < scheduled_end),
  constraint check_medium_data_integrity check (
    (medium = 'online'   and meeting_url   is not null) or
    (medium = 'physical' and location_room is not null)
  )
);

-- ------------------------------------------------------------
-- 7. INDEXES (supplement the idx_ names requested; existing
--    *_idx indexes from Sprint 2 are left untouched)
-- ------------------------------------------------------------

create index idx_grades_curriculum_id  on public.grades  (curriculum_id);
create index idx_terms_grade_id        on public.terms   (grade_id);
create index idx_units_term_id         on public.units   (term_id);
create index idx_topics_unit_id        on public.topics  (unit_id);

-- Useful query-path indexes for the new structures
create index idx_syllabi_curriculum_id        on public.syllabi            (curriculum_id);
create index idx_topics_linked_goal_id        on public.topics             (linked_goal_id);
create index idx_lessons_teacher_id           on public.lessons            (teacher_id);
create index idx_scheduled_sessions_lesson_id on public.scheduled_sessions (lesson_id);
create index idx_scheduled_sessions_time      on public.scheduled_sessions (scheduled_start);

-- ------------------------------------------------------------
-- 8. ROW-LEVEL SECURITY
-- ------------------------------------------------------------

-- syllabi — scoped through curriculum → space
alter table public.syllabi enable row level security;

create policy "syllabi_select_members"
  on public.syllabi for select
  using (public.can_access_curriculum(curriculum_id));

create policy "syllabi_insert_staff"
  on public.syllabi for insert
  with check (public.can_edit_curriculum(curriculum_id));

create policy "syllabi_update_staff"
  on public.syllabi for update
  using (public.can_edit_curriculum(curriculum_id))
  with check (public.can_edit_curriculum(curriculum_id));

create policy "syllabi_delete_staff"
  on public.syllabi for delete
  using (public.can_edit_curriculum(curriculum_id));

-- scheduled_sessions — scoped through lesson → topic → curriculum → space
-- (lesson_curriculum helper already exists from Sprint 2)
alter table public.scheduled_sessions enable row level security;

create policy "scheduled_sessions_select_members"
  on public.scheduled_sessions for select
  using (public.can_access_curriculum(public.lesson_curriculum(lesson_id)));

create policy "scheduled_sessions_insert_staff"
  on public.scheduled_sessions for insert
  with check (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

create policy "scheduled_sessions_update_staff"
  on public.scheduled_sessions for update
  using (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)))
  with check (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

create policy "scheduled_sessions_delete_staff"
  on public.scheduled_sessions for delete
  using (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

-- ------------------------------------------------------------
-- 9. GRANTS
-- ------------------------------------------------------------

grant select, insert, update, delete on public.syllabi             to authenticated;
grant select, insert, update, delete on public.scheduled_sessions  to authenticated;
