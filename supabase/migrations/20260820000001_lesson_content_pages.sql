-- ============================================================
-- Lesson content pages: break the single content blob into
-- ordered pages (tabs) and let activities / assessments attach
-- to a specific page.
-- ============================================================

-- ------------------------------------------------------------
-- 1. NEW TABLE: lesson_pages
-- ------------------------------------------------------------

create table public.lesson_pages (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references public.lessons(id) on delete cascade,
  title      varchar(255) not null,
  body       text,
  sequence   smallint not null default 1 check (sequence >= 1),
  created_at timestamptz not null default now()
);

create index idx_lesson_pages_lesson_id on public.lesson_pages (lesson_id);

-- ------------------------------------------------------------
-- 2. Drop the now-redundant lessons.content column
-- ------------------------------------------------------------

alter table public.lessons
  drop column if exists content;

-- ------------------------------------------------------------
-- 3. Add optional page_id to activities and assessments
--    ON DELETE SET NULL: deleting a page demotes items to
--    lesson-level (page_id becomes NULL).
-- ------------------------------------------------------------

alter table public.activities
  add column page_id uuid references public.lesson_pages(id) on delete set null;

alter table public.assessments
  add column page_id uuid references public.lesson_pages(id) on delete set null;

-- ------------------------------------------------------------
-- 4. Indexes for the new FK columns
-- ------------------------------------------------------------

create index idx_activities_page_id  on public.activities  (page_id);
create index idx_assessments_page_id on public.assessments (page_id);

-- ------------------------------------------------------------
-- 5. ROW-LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.lesson_pages enable row level security;

create policy "lesson_pages_select_members"
  on public.lesson_pages for select
  using (public.can_access_curriculum(public.lesson_curriculum(lesson_id)));

create policy "lesson_pages_insert_staff"
  on public.lesson_pages for insert
  with check (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

create policy "lesson_pages_update_staff"
  on public.lesson_pages for update
  using (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)))
  with check (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

create policy "lesson_pages_delete_staff"
  on public.lesson_pages for delete
  using (public.can_edit_curriculum(public.lesson_curriculum(lesson_id)));

-- ------------------------------------------------------------
-- 6. GRANTS
-- ------------------------------------------------------------

grant select, insert, update, delete on public.lesson_pages to authenticated;
