-- Subjects: the discipline taught within a grade
-- (e.g. "Mathematics", "English", "Science" under Grade 7).

create table public.subjects (
  id         uuid primary key default gen_random_uuid(),
  grade_id   uuid not null references public.grades(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create index idx_subjects_grade_id on public.subjects (grade_id);

-- RLS: scoped through grade → curriculum → space
alter table public.subjects enable row level security;

create policy "subjects_select_members"
  on public.subjects for select
  using (public.can_access_curriculum(public.grade_curriculum(grade_id)));

create policy "subjects_insert_staff"
  on public.subjects for insert
  with check (public.can_edit_curriculum(public.grade_curriculum(grade_id)));

create policy "subjects_update_staff"
  on public.subjects for update
  using (public.can_edit_curriculum(public.grade_curriculum(grade_id)))
  with check (public.can_edit_curriculum(public.grade_curriculum(grade_id)));

create policy "subjects_delete_staff"
  on public.subjects for delete
  using (public.can_edit_curriculum(public.grade_curriculum(grade_id)));

grant select, insert, update, delete on public.subjects to authenticated;
