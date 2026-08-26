-- Grade enrollments: tracks who is enrolled in what grade for
-- a given academic year. Uses the existing public.grades table
-- (UUID PK) and auth.users.

create table public.grade_enrollments (
  enrollment_id bigserial primary key,
  user_id       uuid references auth.users(id) on delete set null,
  grade_id      uuid not null references public.grades(id) on delete cascade,
  academic_year varchar(9) not null,  -- e.g. '2026-2027'
  status        varchar(20) not null default 'Active'
                check (status in ('Active', 'Completed', 'Dropped')),
  created_at    timestamptz not null default now()
);

create index idx_grade_enrollments_user  on public.grade_enrollments (user_id);
create index idx_grade_enrollments_grade on public.grade_enrollments (grade_id);

-- RLS: scoped through grade → curriculum → space
alter table public.grade_enrollments enable row level security;

create policy "grade_enrollments_select_members"
  on public.grade_enrollments for select
  using (public.can_access_curriculum(public.grade_curriculum(grade_id)));

create policy "grade_enrollments_insert_staff"
  on public.grade_enrollments for insert
  with check (public.can_edit_curriculum(public.grade_curriculum(grade_id)));

create policy "grade_enrollments_update_staff"
  on public.grade_enrollments for update
  using (public.can_edit_curriculum(public.grade_curriculum(grade_id)))
  with check (public.can_edit_curriculum(public.grade_curriculum(grade_id)));

create policy "grade_enrollments_delete_staff"
  on public.grade_enrollments for delete
  using (public.can_edit_curriculum(public.grade_curriculum(grade_id)));

grant select, insert, update, delete on public.grade_enrollments to authenticated;
