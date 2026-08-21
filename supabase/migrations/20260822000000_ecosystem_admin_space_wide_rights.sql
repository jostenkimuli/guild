-- ============================================================
-- Ecosystem admin is an effective space admin in every space
-- under their ecosystem.
--
-- Previously ecosystem admins could view spaces and update them
-- directly, but every other in-space operation (curriculum
-- read/edit, member management, space deletion, resources) was
-- gated purely on space_memberships, so an ecosystem admin was
-- powerless inside the very spaces they govern.
--
-- This migration introduces scoped SECURITY DEFINER helpers and
-- rewrites the affected policies to treat an approved ecosystem
-- admin like an in-space admin for every space of their
-- ecosystem. It also scopes the space-edit / lesson-deletion
-- review+approve policies to the space's ecosystem (previously
-- any approved ecosystem admin could approve edits in spaces of
-- other ecosystems).
-- ============================================================

-- ------------------------------------------------------------
-- helpers
-- ------------------------------------------------------------

create or replace function public.is_ecosystem_admin_for_space(p_space_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.ecosystem_staff as es
    join public.profiles as p on p.id = es.user_id
    where es.ecosystem_id = (select ecosystem_id from public.spaces where id = p_space_id)
      and es.user_id = auth.uid()
      and es.role = 'ecosystem_admin'
      and p.role = 'ecosystem_admin'
      and p.status = 'approved'
  )
$$;

-- effective in-space admin: explicit admin membership OR ecosystem admin
create or replace function public.is_effective_space_admin(p_space_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.space_memberships as m
    where m.space_id = p_space_id and m.user_id = auth.uid() and m.role = 'admin'
  )
  or public.is_ecosystem_admin_for_space(p_space_id)
$$;

-- effective in-space staff: admin/teacher membership OR ecosystem admin
create or replace function public.is_effective_space_staff(p_space_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.space_memberships as m
    where m.space_id = p_space_id and m.user_id = auth.uid() and m.role in ('admin', 'teacher')
  )
  or public.is_ecosystem_admin_for_space(p_space_id)
$$;

grant execute on function public.is_ecosystem_admin_for_space(uuid) to anon, authenticated;
grant execute on function public.is_effective_space_admin(uuid) to anon, authenticated;
grant execute on function public.is_effective_space_staff(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- curriculum read/write: ecosystem admins count as space admins
-- ------------------------------------------------------------

create or replace function public.can_access_curriculum(p_curriculum_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.curricula as c
    where c.id = p_curriculum_id
      and (
        exists (
          select 1 from public.space_memberships as m
          where m.space_id = c.space_id and m.user_id = auth.uid()
        )
        or public.is_ecosystem_admin_for_space(c.space_id)
      )
  )
$$;

create or replace function public.can_edit_curriculum(p_curriculum_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.curricula as c
    where c.id = p_curriculum_id
      and (
        exists (
          select 1 from public.space_memberships as m
          where m.space_id = c.space_id
            and m.user_id = auth.uid()
            and m.role in ('admin', 'teacher')
        )
        or public.is_ecosystem_admin_for_space(c.space_id)
      )
  )
$$;

-- curricula insert: no curriculum row exists yet, so check the space
drop policy if exists "curricula_insert_staff" on public.curricula;
create policy "curricula_insert_staff"
  on public.curricula for insert
  with check (public.is_effective_space_staff(space_id));

-- ------------------------------------------------------------
-- resources: shared library writable by any staff member —
-- ecosystem admins are ecosystem-wide staff
-- ------------------------------------------------------------

create or replace function public.is_effective_staff_anywhere()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.space_memberships as m
    where m.user_id = auth.uid() and m.role in ('admin', 'teacher')
  )
  or exists (
    select 1 from public.ecosystem_staff as es
    join public.profiles as p on p.id = es.user_id
    where es.user_id = auth.uid()
      and es.role = 'ecosystem_admin'
      and p.role = 'ecosystem_admin'
      and p.status = 'approved'
  )
$$;

-- resolve a lesson to the space it belongs to (via topic -> unit ->
-- term -> grade -> curriculum -> space)
create or replace function public.lesson_space(p_lesson_id uuid)
returns uuid
language sql stable security definer
set search_path = public
as $$
  select c.space_id
  from public.curricula as c
  where c.id = public.lesson_curriculum(p_lesson_id)
$$;

grant execute on function public.is_effective_staff_anywhere() to anon, authenticated;
grant execute on function public.lesson_space(uuid) to anon, authenticated;

drop policy if exists "resources_insert_staff" on public.resources;
create policy "resources_insert_staff"
  on public.resources for insert
  with check (public.is_effective_staff_anywhere());

drop policy if exists "resources_update_staff" on public.resources;
create policy "resources_update_staff"
  on public.resources for update
  using (public.is_effective_staff_anywhere())
  with check (public.is_effective_staff_anywhere());

drop policy if exists "resources_delete_staff" on public.resources;
create policy "resources_delete_staff"
  on public.resources for delete
  using (public.is_effective_staff_anywhere());

-- ------------------------------------------------------------
-- spaces: ecosystem admins may delete spaces of their ecosystem
-- ------------------------------------------------------------

drop policy if exists "spaces_delete_creator" on public.spaces;
create policy "spaces_delete_creator"
  on public.spaces for delete
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.space_memberships
      where space_id = id and user_id = auth.uid() and role = 'admin'
    )
    or public.is_ecosystem_admin_for_space(id)
  );

-- ------------------------------------------------------------
-- space_memberships: ecosystem admins manage members in every
-- space of their ecosystem
-- ------------------------------------------------------------

drop policy if exists "space_memberships_update_staff" on public.space_memberships;
create policy "space_memberships_update_staff"
  on public.space_memberships for update
  using (
    exists (
      select 1 from public.space_memberships as me
      where me.space_id = space_id and me.user_id = auth.uid() and me.role in ('admin', 'teacher')
    )
    or public.is_ecosystem_admin_for_space(space_id)
  );

drop policy if exists "space_memberships_delete_staff_or_self" on public.space_memberships;
create policy "space_memberships_delete_staff_or_self"
  on public.space_memberships for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.space_memberships as me
      where me.space_id = space_id and me.user_id = auth.uid() and me.role in ('admin', 'teacher')
    )
    or public.is_ecosystem_admin_for_space(space_id)
  );

-- ------------------------------------------------------------
-- space_edits / lesson_deletions: scope review+approve to the
-- space's ecosystem (previously any approved ecosystem admin
-- could review/approve edits in any ecosystem)
-- ------------------------------------------------------------

drop policy if exists "space_edits_select_ecosystem_admin" on public.space_edits;
create policy "space_edits_select_ecosystem_admin"
  on public.space_edits for select
  using (public.is_ecosystem_admin_for_space(space_id));

drop policy if exists "space_edits_insert_space_admin" on public.space_edits;
create policy "space_edits_insert_space_admin"
  on public.space_edits for insert
  with check (public.is_effective_space_admin(space_id));

drop policy if exists "space_edits_approve_ecosystem_admin" on public.space_edits;
create policy "space_edits_approve_ecosystem_admin"
  on public.space_edits for update
  using (public.is_ecosystem_admin_for_space(space_id));

drop policy if exists "lesson_deletions_select_ecosystem_admin" on public.lesson_deletions;
create policy "lesson_deletions_select_ecosystem_admin"
  on public.lesson_deletions for select
  using (
    public.is_ecosystem_admin_for_space(public.lesson_space(lesson_id))
  );

drop policy if exists "lesson_deletions_approve_ecosystem_admin" on public.lesson_deletions;
create policy "lesson_deletions_approve_ecosystem_admin"
  on public.lesson_deletions for update
  using (
    public.is_ecosystem_admin_for_space(public.lesson_space(lesson_id))
  );