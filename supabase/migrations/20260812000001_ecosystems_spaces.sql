-- ============================================================
-- Sprint 1: Ecosystems, Spaces, and per-space memberships.
-- Replaces the communities / community_members layer.
-- Note: challenges (problems) and projects return redesigned
-- in Sprint 5/6; the old tables are dropped here because they
-- referenced the removed community layer.
-- ============================================================

-- ------------------------------------------------------------
-- enums
-- ------------------------------------------------------------

create type ecosystem_type as enum ('school', 'university', 'organization', 'macro_alliance');
create type space_type as enum ('classroom', 'innovation_hub', 'project_group');
create type user_space_role as enum ('teacher', 'learner', 'mentor', 'collaborator', 'admin');

-- ------------------------------------------------------------
-- ecosystems
-- ------------------------------------------------------------

create table public.ecosystems (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vision text,
  mission text,
  description text,
  type ecosystem_type not null default 'school',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- spaces
-- ------------------------------------------------------------

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  ecosystem_id uuid not null references public.ecosystems (id) on delete cascade,
  name text not null,
  slug text,
  description text,
  type space_type not null default 'classroom',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- space_memberships (the "magic link" table for flexible roles)
-- ------------------------------------------------------------

create table public.space_memberships (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role user_space_role not null,
  joined_at timestamptz not null default now(),
  unique (space_id, user_id)
);

-- ------------------------------------------------------------
-- drop the old community layer
-- ------------------------------------------------------------

drop table if exists public.projects cascade;
drop table if exists public.problems cascade;
drop table if exists public.community_members cascade;
drop table if exists public.communities cascade;

-- ------------------------------------------------------------
-- row level security
-- ------------------------------------------------------------

alter table public.ecosystems enable row level security;

create policy "ecosystems_select_public"
  on public.ecosystems for select
  using (true);

create policy "ecosystems_insert_creator"
  on public.ecosystems for insert
  with check (auth.uid() = created_by);

create policy "ecosystems_update_creator"
  on public.ecosystems for update
  using (auth.uid() = created_by);

create policy "ecosystems_delete_creator"
  on public.ecosystems for delete
  using (auth.uid() = created_by);

alter table public.spaces enable row level security;

create policy "spaces_select_public"
  on public.spaces for select
  using (true);

create policy "spaces_insert_creator"
  on public.spaces for insert
  with check (auth.uid() = created_by);

create policy "spaces_update_members"
  on public.spaces for update
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.space_memberships
      where space_id = id
        and user_id = auth.uid()
        and role in ('admin', 'teacher')
    )
  );

create policy "spaces_delete_creator"
  on public.spaces for delete
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.space_memberships
      where space_id = id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

alter table public.space_memberships enable row level security;

create policy "space_memberships_select_public"
  on public.space_memberships for select
  using (true);

-- Self-join is limited to learner/collaborator. Teacher, mentor and admin
-- assignments are made by space staff (or the seed / a create-space RPC).
create policy "space_memberships_insert_self_learner"
  on public.space_memberships for insert
  with check (
    auth.uid() = user_id
    and role in ('learner', 'collaborator')
  );

create policy "space_memberships_update_staff"
  on public.space_memberships for update
  using (
    exists (
      select 1 from public.space_memberships as me
      where me.space_id = space_id
        and me.user_id = auth.uid()
        and me.role in ('admin', 'teacher')
    )
  );

create policy "space_memberships_delete_staff_or_self"
  on public.space_memberships for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.space_memberships as me
      where me.space_id = space_id
        and me.user_id = auth.uid()
        and me.role in ('admin', 'teacher')
    )
  );

-- ------------------------------------------------------------
-- grants
-- ------------------------------------------------------------

grant select on public.ecosystems to anon;
grant select, insert, update, delete on public.ecosystems to authenticated;

grant select on public.spaces to anon;
grant select, insert, update, delete on public.spaces to authenticated;

grant select on public.space_memberships to anon;
grant select, insert, update, delete on public.space_memberships to authenticated;
