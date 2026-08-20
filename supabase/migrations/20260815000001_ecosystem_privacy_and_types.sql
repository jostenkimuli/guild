-- ============================================================
-- Sprint 3: privacy by default + concrete ecosystem types.
--   * ecosystem_type narrows to the four concrete types
--     (nursery/primary/secondary school + university) with
--     'primary_school' as the default. The type is decided when
--     the ecosystem-admin account is created, stored on
--     profiles.ecosystem_type, and applied when the ecosystem is
--     created.
--   * ecosystems and spaces gain is_private (default true).
--     Private spaces are visible to space members and ecosystem
--     staff; private ecosystems to members of their spaces and
--     ecosystem staff; super/program admins see everything.
-- ============================================================

-- ------------------------------------------------------------
-- ecosystem_type: rename the legacy 'school' and add the concrete
-- school types. Legacy 'organization'/'macro_alliance' values are
-- kept for backward compatibility (drop value is unsupported on
-- this Postgres build); the UI and seed only use the four types.
-- ------------------------------------------------------------

alter type public.ecosystem_type rename value 'school' to 'primary_school';
alter type public.ecosystem_type add value 'nursery_school';
alter type public.ecosystem_type add value 'secondary_school';

alter table public.ecosystems alter column type set default 'primary_school';

-- ------------------------------------------------------------
-- profiles: the ecosystem type an ecosystem-admin will create
-- ------------------------------------------------------------

alter table public.profiles
  add column ecosystem_type public.ecosystem_type;

-- ------------------------------------------------------------
-- handle_new_user: persist the predetermined ecosystem type
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
  v_ecosystem_type public.ecosystem_type;
  v_invite public.invitation_codes%rowtype;
begin
  if v_role = 'ecosystem_admin' then
    v_ecosystem_type := coalesce(
      nullif(v_meta ->> 'ecosystem_type', '')::public.ecosystem_type,
      'primary_school'
    );
  end if;

  insert into public.profiles (id, username, display_name, role, status, must_change_password, ecosystem_type)
  values (
    new.id,
    coalesce(v_meta ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(v_meta ->> 'full_name', ''),
    v_role::public.profile_role,
    v_status::public.profile_status,
    v_must_change,
    v_ecosystem_type
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
-- admin_create_user: new p_ecosystem_type param carries the type
-- chosen at ecosystem-admin creation
-- ------------------------------------------------------------

drop function if exists public.admin_create_user(text, text, public.profile_role, text, uuid, public.profile_status);

create or replace function public.admin_create_user(
  p_email text,
  p_temp_password text,
  p_role public.profile_role,
  p_full_name text default '',
  p_ecosystem_id uuid default null,
  p_status public.profile_status default 'pending',
  p_ecosystem_type public.ecosystem_type default null
)
returns uuid
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  v_caller_id uuid := auth.uid();
  v_caller_role public.profile_role;
  v_caller_status public.profile_status;
  v_ecosystem_type public.ecosystem_type := coalesce(p_ecosystem_type, 'primary_school');
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

  if v_caller_role = 'super_admin' then
    if p_role not in ('program_admin', 'ecosystem_admin', 'space_admin') then
      raise exception 'Super admin can only create admin accounts';
    end if;
  elsif v_caller_role = 'program_admin' then
    if p_role <> 'ecosystem_admin' then
      raise exception 'Program admin can only create ecosystem admin accounts';
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
    raise exception 'Only super, program or ecosystem admins can create accounts';
  end if;

  if exists (select 1 from auth.users where lower(email) = lower(p_email)) then
    raise exception 'A user with this email already exists';
  end if;

  -- Program admins and ecosystem admins always start pending (approval by
  -- the super admin, or a delegated program admin). Space admins are
  -- trusted staff and are auto-approved.
  if p_role = 'space_admin' then
    p_status := 'approved';
  elsif p_role in ('program_admin', 'ecosystem_admin') then
    p_status := 'pending';
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
    )
    || case when p_role = 'ecosystem_admin'
        then jsonb_build_object('ecosystem_type', v_ecosystem_type::text)
        else '{}'::jsonb end,
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

grant execute on function public.admin_create_user(text, text, public.profile_role, text, uuid, public.profile_status, public.ecosystem_type) to authenticated;

-- ------------------------------------------------------------
-- privacy: ecosystems and spaces are private by default
-- ------------------------------------------------------------

alter table public.ecosystems add column is_private boolean not null default true;
alter table public.spaces add column is_private boolean not null default true;

-- ------------------------------------------------------------
-- visibility helpers (security definer so policy checks don't
-- recurse through RLS)
-- ------------------------------------------------------------

create or replace function public.can_view_space(p_space_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.spaces as s
    where s.id = p_space_id
      and (
        s.is_private = false
        or exists (
          select 1 from public.space_memberships as m
          where m.space_id = s.id and m.user_id = auth.uid()
        )
        or exists (
          select 1 from public.ecosystem_staff as es
          where es.ecosystem_id = s.ecosystem_id and es.user_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles as p
          where p.id = auth.uid()
            and p.role in ('super_admin', 'program_admin')
            and p.status = 'approved'
        )
      )
  );
$$;

create or replace function public.can_view_ecosystem(p_ecosystem_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.ecosystems as e
    where e.id = p_ecosystem_id
      and (
        e.is_private = false
        or exists (
          select 1
          from public.space_memberships as m
          join public.spaces as s on s.id = m.space_id
          where s.ecosystem_id = e.id and m.user_id = auth.uid()
        )
        or exists (
          select 1 from public.ecosystem_staff as es
          where es.ecosystem_id = e.id and es.user_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles as p
          where p.id = auth.uid()
            and p.role in ('super_admin', 'program_admin')
            and p.status = 'approved'
        )
      )
  );
$$;

grant execute on function public.can_view_space(uuid) to anon, authenticated;
grant execute on function public.can_view_ecosystem(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- row level security: replace the public-select policies
-- ------------------------------------------------------------

drop policy if exists "ecosystems_select_public" on public.ecosystems;
create policy "ecosystems_select_visible"
  on public.ecosystems for select
  using (public.can_view_ecosystem(id));

drop policy if exists "spaces_select_public" on public.spaces;
create policy "spaces_select_visible"
  on public.spaces for select
  using (public.can_view_space(id));

-- ------------------------------------------------------------
-- guard: ecosystem_type is admin-determined; users may not change
-- their own (extends protect_admin_profile_columns)
-- ------------------------------------------------------------

create or replace function public.protect_admin_profile_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role public.profile_role;
  v_actor_status public.profile_status;
begin
  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.can_approve_ecosystem_admins is distinct from old.can_approve_ecosystem_admins
     or new.ecosystem_type is distinct from old.ecosystem_type then

    if v_actor is null then
      raise exception 'Not authenticated';
    end if;

    select role, status into v_actor_role, v_actor_status
    from public.profiles where id = v_actor;

    if v_actor_role = 'super_admin' and v_actor_status = 'approved' then
      return new;
    end if;

    -- A delegated program admin may approve/reject a pending ecosystem admin
    if v_actor_role = 'program_admin' and v_actor_status = 'approved'
       and old.role = 'ecosystem_admin'
       and new.role = old.role
       and new.can_approve_ecosystem_admins = old.can_approve_ecosystem_admins
       and new.ecosystem_type is not distinct from old.ecosystem_type
       and new.status in ('approved', 'rejected')
       and exists (
         select 1 from public.profiles as p
         where p.id = v_actor and p.can_approve_ecosystem_admins
       ) then
      return new;
    end if;

    raise exception 'Not authorized to change admin profile columns';
  end if;

  return new;
end;
$$;
