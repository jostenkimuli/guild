-- ============================================================
-- Space-level blueprint delegation
-- Lets the space creator delegate blueprint authority to a
-- space admin. Only one active delegation per space at a time.
-- ============================================================

create table public.space_blueprint_delegations (
  id              uuid primary key default gen_random_uuid(),
  space_id        uuid not null references public.spaces(id) on delete cascade,
  delegated_by    uuid not null references auth.users(id),
  delegated_to    uuid not null references auth.users(id),
  status          text not null default 'active' check (status in ('active', 'revoked')),
  created_at      timestamptz not null default now(),
  unique (space_id, delegated_to)
);

create index idx_space_bp_deleg_space on public.space_blueprint_delegations (space_id);
create index idx_space_bp_deleg_to   on public.space_blueprint_delegations (delegated_to);

alter table public.space_blueprint_delegations enable row level security;

-- Space creator and the delegatee can view
create policy "space_bp_deleg_select"
  on public.space_blueprint_delegations for select
  using (
    auth.uid() = delegated_by
    or auth.uid() = delegated_to
    or exists (
      select 1 from public.space_memberships sm
      where sm.space_id = space_id
        and sm.user_id = auth.uid()
        and sm.role = 'admin'
    )
  );

-- Only the space creator can insert
create policy "space_bp_deleg_insert"
  on public.space_blueprint_delegations for insert
  with check (
    auth.uid() = delegated_by
    and exists (
      select 1 from public.spaces s
      where s.id = space_id and s.created_by = auth.uid()
    )
  );

-- Only the space creator or delegatee can update (for revoke)
create policy "space_bp_deleg_update"
  on public.space_blueprint_delegations for update
  using (
    auth.uid() = delegated_by
    or auth.uid() = delegated_to
  );

-- Helper: can this user manage blueprints for the given space?
create or replace function public.can_manage_blueprints(p_space_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select
    -- Space creator
    s.created_by = auth.uid()
    or
    -- Active delegation
    exists (
      select 1 from public.space_blueprint_delegations d
      where d.space_id = p_space_id
        and d.delegated_to = auth.uid()
        and d.status = 'active'
    )
  from public.spaces s
  where s.id = p_space_id
$$;
