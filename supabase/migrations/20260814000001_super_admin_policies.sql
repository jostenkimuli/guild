-- ============================================================
-- Sprint 2 (super admin): role logic that references the
-- super_admin enum value (added in 20260814000000).
-- ------------------------------------------------------------
-- admin_create_user: super admin creates program admins; program
-- admins create ecosystem admins; ecosystem admins create space
-- admins. Program admins and ecosystem admins are always created
-- as pending.
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
-- guard: role/status/delegation columns are admin-only. Users can
-- still edit their own profile (name, bio, ...) through
-- profiles_update_own; this trigger blocks escalation of the
-- privileged columns by anyone other than the super admin (or a
-- delegated program admin approving ecosystem admins).
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
     or new.can_approve_ecosystem_admins is distinct from old.can_approve_ecosystem_admins then

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

create trigger profiles_guard_admin_columns
  before update on public.profiles
  for each row execute function public.protect_admin_profile_columns();

-- ------------------------------------------------------------
-- row level security: who may update other profiles
-- ------------------------------------------------------------

drop policy if exists "profiles_update_program_admin" on public.profiles;

-- The super admin approves program admins, approves ecosystem admins, and
-- toggles delegation on program admins.
create policy "profiles_update_super_admin"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid() and p.role = 'super_admin' and p.status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid() and p.role = 'super_admin' and p.status = 'approved'
    )
  );

-- A program admin that has been delegated ecosystem-admin approvals may
-- approve/reject ecosystem-admin accounts (guard trigger enforces scope).
create policy "profiles_update_delegated_program_admin"
  on public.profiles for update
  using (
    role = 'ecosystem_admin'
    and exists (
      select 1 from public.profiles as p
      where p.id = auth.uid()
        and p.role = 'program_admin'
        and p.status = 'approved'
        and p.can_approve_ecosystem_admins
    )
  )
  with check (
    role = 'ecosystem_admin'
    and exists (
      select 1 from public.profiles as p
      where p.id = auth.uid()
        and p.role = 'program_admin'
        and p.status = 'approved'
        and p.can_approve_ecosystem_admins
    )
  );

grant execute on function public.admin_create_user(text, text, public.profile_role, text, uuid, public.profile_status) to authenticated;
