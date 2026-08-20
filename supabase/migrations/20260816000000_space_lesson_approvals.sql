-- ============================================================
-- TheGuild: space edits and lesson deletions approval flow
-- Space admins can edit spaces and delete lessons, but changes
-- only take effect after ecosystem admin approval.
-- ============================================================

-- ------------------------------------------------------------
-- space_edits table: tracks pending space edits by space admins
-- ------------------------------------------------------------

create table public.space_edits (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  edited_by uuid not null references public.profiles (id) on delete set null,
  changes jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger space_edits_set_updated_at
  before update on public.space_edits
  for each row execute function public.set_updated_at();

-- Row level security for space_edits

alter table public.space_edits enable row level security;

create policy "space_edits_select_own"
  on public.space_edits for select
  using (edited_by = auth.uid());

create policy "space_edits_approve_ecosystem_admin"
  on public.space_edits for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'ecosystem_admin'
        and status = 'approved'
    )
  );

create policy "space_edits_insert_space_admin"
  on public.space_edits for insert
  with check (
    exists (
      select 1 from public.space_memberships
      where space_id = space_edits.space_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- lesson_deletions table: tracks pending lesson deletions
-- ------------------------------------------------------------

create table public.lesson_deletions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger lesson_deletions_set_updated_at
  before update on public.lesson_deletions
  for each row execute function public.set_updated_at();

-- Row level security for lesson_deletions

alter table public.lesson_deletions enable row level security;

create policy "lesson_deletions_select_own"
  on public.lesson_deletions for select
  using (requested_by = auth.uid());

create policy "lesson_deletions_approve_ecosystem_admin"
  on public.lesson_deletions for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'ecosystem_admin'
        and status = 'approved'
    )
  );

create policy "lesson_deletions_insert_space_admin"
  on public.lesson_deletions for insert
  with check (
    exists (
      select 1 from public.space_memberships
      where space_id in (
        select space_id from public.lessons where id = lesson_id
      )
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- Grant access to authenticated API role
-- ------------------------------------------------------------

grant select, insert, update, delete on public.space_edits to authenticated;
grant select, insert, update, delete on public.lesson_deletions to authenticated;