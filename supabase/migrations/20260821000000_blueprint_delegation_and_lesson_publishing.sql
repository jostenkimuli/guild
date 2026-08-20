-- ============================================================
-- Blueprint delegation, syllabus publishing, and scheduled
-- session support for the three delivery scenarios.
-- ============================================================

-- ------------------------------------------------------------
-- 1. NEW ENUM: blueprint delegation lifecycle
-- ------------------------------------------------------------

create type public.blueprint_delegation_status
  as enum ('pending', 'accepted', 'declined', 'revoked');

-- ------------------------------------------------------------
-- 2. NEW TABLE: blueprint_delegations — ecosystem admin
--    delegates curriculum blueprint creation to a space admin
-- ------------------------------------------------------------

create table public.blueprint_delegations (
  id              uuid primary key default gen_random_uuid(),
  ecosystem_id    uuid not null references public.ecosystems(id) on delete cascade,
  curriculum_id   uuid not null references public.curricula(id) on delete cascade,
  delegated_to    uuid not null references auth.users(id),
  delegated_by    uuid not null references auth.users(id),
  status          public.blueprint_delegation_status not null default 'pending',
  message         text,
  created_at      timestamptz not null default now(),
  responded_at    timestamptz
);

create index idx_blueprints_ecosystem_id  on public.blueprint_delegations (ecosystem_id);
create index idx_blueprints_curriculum_id on public.blueprint_delegations (curriculum_id);
create index idx_blueprints_delegated_to  on public.blueprint_delegations (delegated_to);

-- ------------------------------------------------------------
-- 3. RLS on blueprint_delegations
-- ------------------------------------------------------------

alter table public.blueprint_delegations enable row level security;

-- Ecosystem staff (admin or space_admin) and the delegated user can view
create policy "blueprint_delegations_select"
  on public.blueprint_delegations for select
  using (
    -- delegated user
    auth.uid() = delegated_to
    or
    -- ecosystem staff
    exists (
      select 1 from public.ecosystem_staff as es
      where es.ecosystem_id = ecosystem_id
        and es.user_id = auth.uid()
    )
  );

-- Only ecosystem admin can create delegations
create policy "blueprint_delegations_insert"
  on public.blueprint_delegations for insert
  with check (
    exists (
      select 1 from public.ecosystem_staff as es
      join public.profiles as p on p.id = auth.uid()
      where es.ecosystem_id = ecosystem_id
        and es.user_id = auth.uid()
        and es.role = 'ecosystem_admin'
        and p.role = 'ecosystem_admin'
        and p.status = 'approved'
    )
  );

-- Ecosystem admin can revoke; delegated user can accept/decline
create policy "blueprint_delegations_update"
  on public.blueprint_delegations for update
  using (
    -- ecosystem admin revoking
    (
      exists (
        select 1 from public.ecosystem_staff as es
        join public.profiles as p on p.id = auth.uid()
        where es.ecosystem_id = ecosystem_id
          and es.user_id = auth.uid()
          and es.role = 'ecosystem_admin'
          and p.role = 'ecosystem_admin'
          and p.status = 'approved'
      )
      and status in ('pending', 'accepted')
    )
    or
    -- delegated user accepting or declining
    (
      auth.uid() = delegated_to
      and status = 'pending'
    )
  );

-- Ecosystem admin can delete
create policy "blueprint_delegations_delete"
  on public.blueprint_delegations for delete
  using (
    exists (
      select 1 from public.ecosystem_staff as es
      join public.profiles as p on p.id = auth.uid()
      where es.ecosystem_id = ecosystem_id
        and es.user_id = auth.uid()
        and es.role = 'ecosystem_admin'
        and p.role = 'ecosystem_admin'
        and p.status = 'approved'
    )
  );

-- ------------------------------------------------------------
-- 4. GRANTS
-- ------------------------------------------------------------

grant select, insert, update, delete on public.blueprint_delegations to authenticated;

-- ------------------------------------------------------------
-- 5. HELPER: check if a user is an approved ecosystem admin
--    for a given ecosystem
-- ------------------------------------------------------------

create or replace function public.is_ecosystem_admin(p_ecosystem_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ecosystem_staff as es
    join public.profiles as p on p.id = auth.uid()
    where es.ecosystem_id = p_ecosystem_id
      and es.user_id = auth.uid()
      and es.role = 'ecosystem_admin'
      and p.role = 'ecosystem_admin'
      and p.status = 'approved'
  )
$$;

-- ------------------------------------------------------------
-- 6. HELPER: check if a user is an accepted blueprint delegate
--    for a given curriculum
-- ------------------------------------------------------------

create or replace function public.is_blueprint_delegate(p_curriculum_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blueprint_delegations as bd
    where bd.curriculum_id = p_curriculum_id
      and bd.delegated_to = auth.uid()
      and bd.status = 'accepted'
  )
$$;
