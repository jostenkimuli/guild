-- ============================================================
-- TheGuild: initial schema
-- Educational ecosystem where virtual communities solve
-- real-world problems.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- helpers
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- tables
-- ------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  avatar_url text,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  mission text not null default '',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger communities_set_updated_at
  before update on public.communities
  for each row execute function public.set_updated_at();

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'solved', 'archived')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger problems_set_updated_at
  before update on public.problems
  for each row execute function public.set_updated_at();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems (id) on delete cascade,
  name text not null,
  summary text not null default '',
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'archived')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- row level security
-- ------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

alter table public.communities enable row level security;

create policy "communities_select_public"
  on public.communities for select
  using (true);

create policy "communities_insert_own"
  on public.communities for insert
  with check (auth.uid() = created_by);

create policy "communities_update_admins"
  on public.communities for update
  using (
    exists (
      select 1 from public.community_members
      where community_id = id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

create policy "communities_delete_owners"
  on public.communities for delete
  using (
    exists (
      select 1 from public.community_members
      where community_id = id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

alter table public.community_members enable row level security;

create policy "community_members_select_public"
  on public.community_members for select
  using (true);

create policy "community_members_insert_self"
  on public.community_members for insert
  with check (auth.uid() = user_id);

create policy "community_members_update_admins"
  on public.community_members for update
  using (
    exists (
      select 1 from public.community_members as me
      where me.community_id = community_id
        and me.user_id = auth.uid()
        and me.role in ('owner', 'admin')
    )
  );

create policy "community_members_delete_admins"
  on public.community_members for delete
  using (
    exists (
      select 1 from public.community_members as me
      where me.community_id = community_id
        and me.user_id = auth.uid()
        and me.role in ('owner', 'admin')
    )
  );

alter table public.problems enable row level security;

create policy "problems_select_public"
  on public.problems for select
  using (true);

create policy "problems_insert_members"
  on public.problems for insert
  with check (
    exists (
      select 1 from public.community_members
      where community_id = community_id
        and user_id = auth.uid()
    )
  );

create policy "problems_update_members"
  on public.problems for update
  using (
    exists (
      select 1 from public.community_members
      where community_id = community_id
        and user_id = auth.uid()
    )
  );

create policy "problems_delete_admins"
  on public.problems for delete
  using (
    exists (
      select 1 from public.community_members as me
      where me.community_id = community_id
        and me.user_id = auth.uid()
        and me.role in ('owner', 'admin')
    )
  );

alter table public.projects enable row level security;

create policy "projects_select_members"
  on public.projects for select
  using (
    exists (
      select 1 from public.problems as p
      join public.community_members as cm on cm.community_id = p.community_id
      where p.id = problem_id
        and cm.user_id = auth.uid()
    )
  );

create policy "projects_insert_members"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.problems as p
      join public.community_members as cm on cm.community_id = p.community_id
      where p.id = problem_id
        and cm.user_id = auth.uid()
    )
  );

create policy "projects_update_members"
  on public.projects for update
  using (
    exists (
      select 1 from public.problems as p
      join public.community_members as cm on cm.community_id = p.community_id
      where p.id = problem_id
        and cm.user_id = auth.uid()
    )
  );

create policy "projects_delete_admins"
  on public.projects for delete
  using (
    exists (
      select 1 from public.problems as p
      join public.community_members as me
        on me.community_id = p.community_id
       and me.user_id = auth.uid()
       and me.role in ('owner', 'admin')
      where p.id = problem_id
    )
  );

-- ------------------------------------------------------------
-- grants
-- The Data API roles are not auto-granted by default in this
-- Supabase version. RLS above still enforces row-level rules;
-- these grants allow the roles to reach the tables at all.
-- ------------------------------------------------------------

grant select on public.profiles to anon;
grant select, insert, update, delete on public.profiles to authenticated;

grant select on public.communities to anon;
grant select, insert, update, delete on public.communities to authenticated;

grant select on public.community_members to anon;
grant select, insert, update, delete on public.community_members to authenticated;

grant select on public.problems to anon;
grant select, insert, update, delete on public.problems to authenticated;

grant select, insert, update, delete on public.projects to authenticated;
