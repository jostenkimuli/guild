-- Give each space-admin account an explicit space membership, and provide a
-- single permission-checked path for assigning, moving, and removing members.

create or replace function public.admin_create_space_admin(
  p_email text,
  p_temp_password text,
  p_full_name text,
  p_ecosystem_id uuid,
  p_space_id uuid
)
returns uuid
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  v_user_id uuid;
begin
  if not exists (
    select 1
    from public.profiles as p
    join public.ecosystem_staff as es on es.user_id = p.id
    where p.id = auth.uid()
      and p.role = 'ecosystem_admin'
      and p.status = 'approved'
      and es.ecosystem_id = p_ecosystem_id
      and es.role = 'ecosystem_admin'
  ) then
    raise exception 'Only an approved administrator of this ecosystem can create its space admins';
  end if;

  if not exists (
    select 1 from public.spaces
    where id = p_space_id and ecosystem_id = p_ecosystem_id
  ) then
    raise exception 'Choose a space in this ecosystem';
  end if;

  v_user_id := public.admin_create_user(
    p_email,
    p_temp_password,
    'space_admin'::public.profile_role,
    p_full_name,
    p_ecosystem_id,
    'approved'::public.profile_status,
    null
  );

  insert into public.space_memberships (space_id, user_id, role)
  values (p_space_id, v_user_id, 'admin')
  on conflict (space_id, user_id) do update set role = 'admin';

  return v_user_id;
end;
$$;

revoke all on function public.admin_create_space_admin(text, text, text, uuid, uuid)
  from public, anon;
grant execute on function public.admin_create_space_admin(text, text, text, uuid, uuid)
  to authenticated;

-- Reassign the spaces managed by an existing space-admin account. An empty
-- array intentionally removes all of their space-admin memberships.
create or replace function public.set_space_admin_assignments(
  p_ecosystem_id uuid,
  p_user_id uuid,
  p_space_ids uuid[]
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles as p
    join public.ecosystem_staff as target_staff
      on target_staff.user_id = p.id
    where p.id = p_user_id
      and p.role = 'space_admin'
      and p.status = 'approved'
      and target_staff.ecosystem_id = p_ecosystem_id
      and target_staff.role = 'space_admin'
  ) then
    raise exception 'Space admin is not assigned to this ecosystem';
  end if;

  if not exists (
    select 1
    from public.profiles as p
    join public.ecosystem_staff as actor_staff on actor_staff.user_id = p.id
    where p.id = auth.uid()
      and p.role = 'ecosystem_admin'
      and p.status = 'approved'
      and actor_staff.ecosystem_id = p_ecosystem_id
      and actor_staff.role = 'ecosystem_admin'
  ) then
    raise exception 'Only an approved administrator of this ecosystem can assign its space admins';
  end if;

  if exists (
    select 1 from unnest(coalesce(p_space_ids, '{}'::uuid[])) as requested(id)
    where not exists (
      select 1 from public.spaces as s
      where s.id = requested.id and s.ecosystem_id = p_ecosystem_id
    )
  ) then
    raise exception 'Every selected space must belong to this ecosystem';
  end if;

  delete from public.space_memberships as sm
  using public.spaces as s
  where sm.space_id = s.id
    and s.ecosystem_id = p_ecosystem_id
    and sm.user_id = p_user_id
    and sm.role = 'admin'
    and not (s.id = any(coalesce(p_space_ids, '{}'::uuid[])));

  insert into public.space_memberships (space_id, user_id, role)
  select requested.id, p_user_id, 'admin'::public.user_space_role
  from unnest(coalesce(p_space_ids, '{}'::uuid[])) as requested(id)
  on conflict (space_id, user_id) do update set role = 'admin';
end;
$$;

revoke all on function public.set_space_admin_assignments(uuid, uuid, uuid[])
  from public, anon;
grant execute on function public.set_space_admin_assignments(uuid, uuid, uuid[])
  to authenticated;

-- Add, change, move, or remove ordinary in-space memberships. Admin roles are
-- managed separately so a member action cannot grant or remove admin access.
drop function if exists public.manage_space_membership(
  uuid, uuid, uuid, public.user_space_role
);

create function public.manage_space_membership(
  p_user_id uuid,
  p_role public.user_space_role,
  p_source_space_id uuid default null,
  p_target_space_id uuid default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_source_ecosystem uuid;
  v_target_ecosystem uuid;
  v_existing_role public.user_space_role;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_source_space_id is null and p_target_space_id is null then
    raise exception 'A source or target space is required';
  end if;
  if p_target_space_id is not null
     and (p_role is null or p_role not in ('teacher', 'learner', 'mentor', 'collaborator')) then
    raise exception 'Choose a valid member role';
  end if;

  if p_source_space_id is not null then
    select ecosystem_id into v_source_ecosystem
    from public.spaces where id = p_source_space_id;
    if v_source_ecosystem is null then
      raise exception 'Source space not found';
    end if;
    if not public.is_effective_space_admin(p_source_space_id) then
      raise exception 'You cannot manage members in the source space';
    end if;
    select role into v_existing_role
    from public.space_memberships
    where space_id = p_source_space_id and user_id = p_user_id;
    if v_existing_role is null then
      raise exception 'Member is not assigned to the source space';
    end if;
    if v_existing_role = 'admin' then
      raise exception 'Manage space admins from the ecosystem staff page';
    end if;
  end if;

  if p_target_space_id is not null then
    select ecosystem_id into v_target_ecosystem
    from public.spaces where id = p_target_space_id;
    if v_target_ecosystem is null then
      raise exception 'Target space not found';
    end if;
    if not public.is_effective_space_admin(p_target_space_id) then
      raise exception 'You cannot manage members in the target space';
    end if;
    if v_source_ecosystem is not null
       and v_source_ecosystem <> v_target_ecosystem then
      raise exception 'Members can only be moved between spaces in the same ecosystem';
    end if;
    if not exists (
      select 1 from public.profiles
      where id = p_user_id and role = 'member' and status = 'approved'
    ) then
      raise exception 'Only approved member accounts can be assigned this way';
    end if;
    if exists (
      select 1 from public.space_memberships
      where space_id = p_target_space_id
        and user_id = p_user_id
        and role = 'admin'
        and p_source_space_id is distinct from p_target_space_id
    ) then
      raise exception 'This user is already an administrator of the target space';
    end if;

    insert into public.space_memberships (space_id, user_id, role)
    values (p_target_space_id, p_user_id, p_role)
    on conflict (space_id, user_id) do update set role = excluded.role;
  end if;

  if p_source_space_id is not null
     and p_source_space_id is distinct from p_target_space_id then
    delete from public.space_memberships
    where space_id = p_source_space_id and user_id = p_user_id;
  end if;
end;
$$;

revoke all on function public.manage_space_membership(
  uuid, public.user_space_role, uuid, uuid
) from public, anon;
grant execute on function public.manage_space_membership(
  uuid, public.user_space_role, uuid, uuid
) to authenticated;

-- A space admin may invite people only to spaces where they have an explicit
-- admin membership. Ecosystem admins can still invite across their ecosystem.
drop policy if exists "invitation_codes_select_managers" on public.invitation_codes;
create policy "invitation_codes_select_managers"
  on public.invitation_codes for select
  using (
    public.is_ecosystem_admin_for_space(space_id)
    or exists (
      select 1 from public.space_memberships as m
      where m.space_id = invitation_codes.space_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

drop policy if exists "invitation_codes_insert_managers" on public.invitation_codes;
create policy "invitation_codes_insert_managers"
  on public.invitation_codes for insert
  with check (
    auth.uid() = created_by
    and role in ('teacher', 'learner')
    and (
      public.is_ecosystem_admin_for_space(space_id)
      or exists (
        select 1 from public.space_memberships as m
        where m.space_id = invitation_codes.space_id
          and m.user_id = auth.uid()
          and m.role = 'admin'
      )
    )
  );
