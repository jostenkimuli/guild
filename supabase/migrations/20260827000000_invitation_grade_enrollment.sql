-- ============================================================
-- Invitation-code grade linkage + ecosystem-admin insert rights
-- ============================================================
-- 1. Add grade_id to invitation_codes (nullable)
-- 2. Update handle_new_user to create grade_enrollments on redeem
-- 3. Update invitation_code_info RPC to return grade info
-- 4. Widen RLS so ecosystem admins can create codes too

-- ------------------------------------------------------------
-- 1. grade_id column
-- ------------------------------------------------------------

alter table public.invitation_codes
  add column grade_id uuid references public.grades(id) on delete set null;

-- ------------------------------------------------------------
-- 2. handle_new_user: create grade_enrollments when code has
--    a grade_id
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
  v_calendar_year smallint;
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

    -- Grade enrollment: if the code targets a specific grade,
    -- enroll the learner and derive the academic year from the
    -- ecosystem's calendar_year.
    if v_invite.grade_id is not null and v_invite.role = 'learner' then
      select e.calendar_year into v_calendar_year
      from public.spaces as s
      join public.ecosystems as e on e.id = s.ecosystem_id
      where s.id = v_invite.space_id;

      insert into public.grade_enrollments (user_id, grade_id, academic_year, status)
      values (
        new.id,
        v_invite.grade_id,
        coalesce(v_calendar_year::text, extract(year from now())::text)
          || '-' ||
          coalesce((v_calendar_year + 1)::text, (extract(year from now()) + 1)::text),
        'Active'
      )
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3. invitation_code_info: return grade_id + grade_name
--    Must DROP first — PostgreSQL forbids changing the return type
--    of an existing function via CREATE OR REPLACE.

drop function if exists public.invitation_code_info(text);

create function public.invitation_code_info(p_code text)
returns table (
  code_valid boolean,
  space_id uuid,
  space_name text,
  ecosystem_name text,
  role text,
  expires_at timestamptz,
  max_uses integer,
  used_count integer,
  grade_id uuid,
  grade_name text
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
      null::timestamptz, null::integer, null::integer, null::uuid, null::text;
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
    v_invite.used_count,
    v_invite.grade_id,
    g.name
  from public.spaces as s
  join public.ecosystems as e on e.id = s.ecosystem_id
  left join public.grades as g on g.id = v_invite.grade_id
  where s.id = v_invite.space_id;
end;
$$;

-- ------------------------------------------------------------
-- 4. RLS: let ecosystem admins insert codes for their spaces
-- ------------------------------------------------------------

drop policy if exists "invitation_codes_insert_managers" on public.invitation_codes;

create policy "invitation_codes_insert_managers"
  on public.invitation_codes for insert
  with check (
    auth.uid() = created_by
    and (
      exists (
        select 1 from public.spaces as s
        join public.ecosystem_staff as es on es.ecosystem_id = s.ecosystem_id
        where s.id = space_id
          and es.user_id = auth.uid()
          and es.role = 'space_admin'
      )
      or exists (
        select 1 from public.spaces as s
        join public.ecosystems as e on e.id = s.ecosystem_id
        where s.id = space_id
          and e.created_by = auth.uid()
      )
    )
  );
