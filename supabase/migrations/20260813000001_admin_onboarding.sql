-- ============================================================
-- Sprint 2 (admin onboarding): ecosystem admins, approval
-- workflow, space admins, and invitation-code-based joining.
-- Adds the raw_ecosystem_meta_data jsonb column.
-- ============================================================

-- ------------------------------------------------------------
-- enums
-- ------------------------------------------------------------

create type profile_role as enum ('program_admin', 'ecosystem_admin', 'space_admin', 'member');
create type profile_status as enum ('pending', 'approved', 'rejected');
create type ecosystem_staff_role as enum ('ecosystem_admin', 'space_admin');

-- ------------------------------------------------------------
-- ecosystems: free-form metadata (school director/headteacher, etc.)
-- ------------------------------------------------------------

alter table public.ecosystems
  add column raw_ecosystem_meta_data jsonb not null default '{}'::jsonb;

-- One ecosystem per ecosystem-admin account (the account that creates it).
create unique index ecosystems_one_per_creator on public.ecosystems (created_by);

-- ------------------------------------------------------------
-- profiles: global role, approval status, first-login flag
-- ------------------------------------------------------------

alter table public.profiles
  add column role profile_role not null default 'member',
  add column status profile_status not null default 'approved',
  add column must_change_password boolean not null default false;

-- ------------------------------------------------------------
-- ecosystem_staff: which admin accounts manage which ecosystem
-- ------------------------------------------------------------

create table public.ecosystem_staff (
  ecosystem_id uuid not null references public.ecosystems (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role ecosystem_staff_role not null,
  assigned_at timestamptz not null default now(),
  primary key (ecosystem_id, user_id)
);

create index ecosystem_staff_user_idx on public.ecosystem_staff (user_id);

-- ------------------------------------------------------------
-- invitation_codes: a code grants a specific in-space role
-- ------------------------------------------------------------

create table public.invitation_codes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  code text not null unique,
  role user_space_role not null default 'learner',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0
);

create index invitation_codes_space_idx on public.invitation_codes (space_id);

-- ------------------------------------------------------------
-- handle_new_user: profile with role/status/flag + invite redemption
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role text := coalesce(v_meta ->> 'role', 'member');
  v_status text := coalesce(v_meta ->> 'status', 'approved');
  v_must_change boolean := coalesce((v_meta ->> 'must_change_password')::boolean, false);
  v_code text := nullif(v_meta ->> 'invitation_code', '');
  v_invite public.invitation_codes%rowtype;
begin
  insert into public.profiles (id, username, display_name, role, status, must_change_password)
  values (
    new.id,
    coalesce(v_meta ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(v_meta ->> 'full_name', ''),
    v_role::public.profile_role,
    v_status::public.profile_status,
    v_must_change
  );

  if v_code is not null then
    select * into v_invite
    from public.invitation_codes
    where code = v_code
      and (expires_at is null or expires_at > now())
    for update;

    if v_invite.id is null then
      raise exception 'INVALID_INVITATION_CODE';
    end if;
    if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
      raise exception 'INVITATION_CODE_EXHAUSTED';
    end if;

    update public.invitation_codes
    set used_count = used_count + 1
    where id = v_invite.id;

    insert into public.space_memberships (space_id, user_id, role)
    values (v_invite.space_id, new.id, v_invite.role)
    on conflict (space_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- admin_create_user: program/ecosystem admins create staff accounts
-- ------------------------------------------------------------

create or replace function public.admin_create_user(
  p_email text,
  p_temp_password text,
  p_role public.profile_role,
  p_full_name text default '',
  p_ecosystem_id uuid default null,
  p_status public.profile_status default 'pending'
)
returns uuid
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  v_caller_id uuid := auth.uid();
  v_caller_role public.profile_role;
  v_caller_status public.profile_status;
  v_user_id uuid := gen_random_uuid();
begin
  if v_caller_id is null then
    raise exception 'Not authenticated';
  end if;

  select role, status into v_caller_role, v_caller_status
  from public.profiles where id = v_caller_id;

  if v_caller_status is distinct from 'approved' then
    raise exception 'Account is not approved';
  end if;

  if v_caller_role = 'program_admin' then
    if p_role not in ('ecosystem_admin', 'space_admin') then
      raise exception 'Program admin can only create admin accounts';
    end if;
  elsif v_caller_role = 'ecosystem_admin' then
    if p_role <> 'space_admin' then
      raise exception 'Ecosystem admin can only create space admin accounts';
    end if;
    if p_ecosystem_id is null or not exists (
      select 1 from public.ecosystem_staff
      where ecosystem_id = p_ecosystem_id and user_id = v_caller_id and role = 'ecosystem_admin'
    ) then
      raise exception 'You are not an ecosystem admin of this ecosystem';
    end if;
  else
    raise exception 'Only program or ecosystem admins can create accounts';
  end if;

  if exists (select 1 from auth.users where lower(email) = lower(p_email)) then
    raise exception 'A user with this email already exists';
  end if;

  -- Space admins are trusted staff created by their ecosystem admin;
  -- only ecosystem admins go through the pending/approval gate.
  if p_role = 'space_admin' then
    p_status := 'approved';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current, email_change,
    phone, phone_change, phone_change_token, reauthentication_token,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    is_sso_user, is_anonymous
  )
  values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    lower(p_email), crypt(p_temp_password, gen_salt('bf')), now(),
    '', '', '', '', '', null, '', '', '',
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object(
      'username', coalesce(nullif(split_part(p_email, '@', 1), ''), 'user_' || substr(v_user_id::text, 1, 8)),
      'full_name', p_full_name,
      'role', p_role::text,
      'status', p_status::text,
      'must_change_password', 'true'
    ),
    now(), now(), false, false
  );

  if p_role in ('ecosystem_admin', 'space_admin') and p_ecosystem_id is not null then
    insert into public.ecosystem_staff (ecosystem_id, user_id, role)
    values (p_ecosystem_id, v_user_id, p_role::text::public.ecosystem_staff_role)
    on conflict (ecosystem_id, user_id) do nothing;
  end if;

  return v_user_id;
end;
$$;

-- ------------------------------------------------------------
-- invitation_code_info: public validation helper (used at sign-up)
-- ------------------------------------------------------------

create or replace function public.invitation_code_info(p_code text)
returns table (
  code_valid boolean,
  space_id uuid,
  space_name text,
  ecosystem_name text,
  role text,
  expires_at timestamptz,
  max_uses integer,
  used_count integer
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_invite public.invitation_codes%rowtype;
begin
  select * into v_invite
  from public.invitation_codes
  where code = p_code;

  if v_invite.id is null then
    return query select false, null::uuid, null::text, null::text, null::text,
      null::timestamptz, null::integer, null::integer;
    return;
  end if;

  return query
  select
    (v_invite.expires_at is null or v_invite.expires_at > now()) and
      (v_invite.max_uses is null or v_invite.used_count < v_invite.max_uses),
    v_invite.space_id,
    s.name,
    e.name,
    v_invite.role::text,
    v_invite.expires_at,
    v_invite.max_uses,
    v_invite.used_count
  from public.spaces as s
  join public.ecosystems as e on e.id = s.ecosystem_id
  where s.id = v_invite.space_id;
end;
$$;

-- ------------------------------------------------------------
-- triggers: auto-assign staff and space-admin memberships
-- ------------------------------------------------------------

create or replace function public.on_ecosystem_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.ecosystem_staff (ecosystem_id, user_id, role)
  values (new.id, new.created_by, 'ecosystem_admin')
  on conflict (ecosystem_id, user_id) do update set role = 'ecosystem_admin';
  return new;
end;
$$;

create trigger ecosystems_add_staff
  after insert on public.ecosystems
  for each row execute function public.on_ecosystem_created();

create or replace function public.on_space_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.space_memberships (space_id, user_id, role)
  values (new.id, new.created_by, 'admin')
  on conflict (space_id, user_id) do update set role = 'admin';
  return new;
end;
$$;

create trigger spaces_add_admin_membership
  after insert on public.spaces
  for each row execute function public.on_space_created();

-- ------------------------------------------------------------
-- row level security
-- ------------------------------------------------------------

-- profiles: program admins may approve/reject staff accounts
create policy "profiles_update_program_admin"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid() and p.role = 'program_admin' and p.status = 'approved'
    )
  );

-- ecosystems: creation requires an APPROVED ecosystem-admin account
drop policy if exists "ecosystems_insert_creator" on public.ecosystems;
create policy "ecosystems_insert_creator"
  on public.ecosystems for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles as p
      where p.id = auth.uid() and p.role = 'ecosystem_admin' and p.status = 'approved'
    )
  );

-- spaces: creation requires a space-admin staff member of the ecosystem
drop policy if exists "spaces_insert_creator" on public.spaces;
create policy "spaces_insert_creator"
  on public.spaces for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.ecosystem_staff as es
      where es.ecosystem_id = ecosystem_id
        and es.user_id = auth.uid()
        and es.role = 'space_admin'
    )
  );

alter table public.ecosystem_staff enable row level security;

create policy "ecosystem_staff_select_public"
  on public.ecosystem_staff for select
  using (true);

create policy "ecosystem_staff_write_program_admin"
  on public.ecosystem_staff for insert
  with check (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid() and p.role = 'program_admin' and p.status = 'approved'
    )
  );

create policy "ecosystem_staff_update_program_admin"
  on public.ecosystem_staff for update
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid() and p.role = 'program_admin' and p.status = 'approved'
    )
  );

create policy "ecosystem_staff_delete_program_admin"
  on public.ecosystem_staff for delete
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid() and p.role = 'program_admin' and p.status = 'approved'
    )
  );

alter table public.invitation_codes enable row level security;

create policy "invitation_codes_select_managers"
  on public.invitation_codes for select
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.spaces as s
      join public.ecosystem_staff as es on es.ecosystem_id = s.ecosystem_id
      where s.id = space_id and es.user_id = auth.uid()
        and es.role in ('space_admin', 'ecosystem_admin')
    )
    or exists (
      select 1 from public.space_memberships as m
      where m.space_id = space_id and m.user_id = auth.uid()
        and m.role in ('admin', 'teacher')
    )
  );

create policy "invitation_codes_insert_managers"
  on public.invitation_codes for insert
  with check (
    auth.uid() = created_by
    and (
      exists (
        select 1 from public.spaces as s
        join public.ecosystem_staff as es on es.ecosystem_id = s.ecosystem_id
        where s.id = space_id and es.user_id = auth.uid()
          and es.role in ('space_admin', 'ecosystem_admin')
      )
      or exists (
        select 1 from public.space_memberships as m
        where m.space_id = space_id and m.user_id = auth.uid()
          and m.role in ('admin', 'teacher')
      )
    )
  );

-- ------------------------------------------------------------
-- grants
-- ------------------------------------------------------------

grant select on public.ecosystem_staff to anon;
grant select, insert, update, delete on public.ecosystem_staff to authenticated;

grant select on public.invitation_codes to anon;
grant select, insert, update, delete on public.invitation_codes to authenticated;

grant execute on function public.admin_create_user(text, text, public.profile_role, text, uuid, public.profile_status) to authenticated;

grant execute on function public.invitation_code_info(text) to anon, authenticated;
