-- Programme administrators create school ecosystems. Ecosystem administrators
-- are then assigned through ecosystem_staff and complete the school profile.

drop index if exists public.ecosystems_one_per_creator;

drop policy if exists "ecosystems_insert_creator" on public.ecosystems;
create policy "ecosystems_insert_creator"
  on public.ecosystems for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles as p
      where p.id = auth.uid()
        and p.status = 'approved'
        and p.role in ('program_admin', 'ecosystem_admin')
    )
  );

create policy "ecosystems_update_ecosystem_admin"
  on public.ecosystems for update
  using (
    exists (
      select 1
      from public.ecosystem_staff as es
      join public.profiles as p on p.id = es.user_id
      where es.ecosystem_id = ecosystems.id
        and es.user_id = auth.uid()
        and es.role = 'ecosystem_admin'
        and p.role = 'ecosystem_admin'
        and p.status = 'approved'
    )
  )
  with check (
    exists (
      select 1
      from public.ecosystem_staff as es
      join public.profiles as p on p.id = es.user_id
      where es.ecosystem_id = ecosystems.id
        and es.user_id = auth.uid()
        and es.role = 'ecosystem_admin'
        and p.role = 'ecosystem_admin'
        and p.status = 'approved'
    )
  );

-- A programme admin who creates an ecosystem is not made an ecosystem
-- administrator. Legacy ecosystem-admin-created records keep their assignment.
create or replace function public.on_ecosystem_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.profiles as p
    where p.id = new.created_by
      and p.role = 'ecosystem_admin'
      and p.status = 'approved'
  ) then
    insert into public.ecosystem_staff (ecosystem_id, user_id, role)
    values (new.id, new.created_by, 'ecosystem_admin')
    on conflict (ecosystem_id, user_id) do update set role = 'ecosystem_admin';
  end if;
  return new;
end;
$$;

-- Pending ecosystem admins receive their staff link during account creation.
-- They must not be able to create spaces until approved.
drop policy if exists "spaces_insert_creator" on public.spaces;
create policy "spaces_insert_creator"
  on public.spaces for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1
      from public.ecosystem_staff as es
      join public.profiles as p on p.id = es.user_id
      where es.ecosystem_id = spaces.ecosystem_id
        and es.user_id = auth.uid()
        and es.role = 'ecosystem_admin'
        and p.role = 'ecosystem_admin'
        and p.status = 'approved'
    )
  );

-- Validate any ecosystem scope passed when a programme admin creates an
-- ecosystem-admin account. The security-definer function remains the only
-- path that writes the staff assignment.
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
  if v_caller_id is null then raise exception 'Not authenticated'; end if;

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
    if p_ecosystem_id is null then
      raise exception 'A school must be selected for the ecosystem admin';
    end if;
    if not exists (
      select 1 from public.ecosystems
      where id = p_ecosystem_id and created_by = v_caller_id
    ) then
      raise exception 'You can only assign administrators to schools you onboarded';
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

  if p_ecosystem_id is not null and not exists (
    select 1 from public.ecosystems where id = p_ecosystem_id
  ) then
    raise exception 'Ecosystem not found';
  end if;
  if exists (select 1 from auth.users where lower(email) = lower(p_email)) then
    raise exception 'A user with this email already exists';
  end if;

  if p_role = 'space_admin' then
    p_status := 'approved';
  elsif p_role = 'program_admin' then
    p_status := 'pending';
  elsif p_role = 'ecosystem_admin' then
    if v_caller_role = 'super_admin' then p_status := 'approved';
    else p_status := 'pending'; end if;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current, email_change,
    phone, phone_change, phone_change_token, reauthentication_token,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    is_sso_user, is_anonymous
  ) values (
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
    ) || case when p_role = 'ecosystem_admin'
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
