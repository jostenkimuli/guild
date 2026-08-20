-- ============================================================
-- Ecosystem console: clear role split for managing spaces and
-- invitation codes.
--   * Only ecosystem admins create spaces (was: only space
--     admins). Space admins manage the spaces created for them.
--   * Only space admins generate invitation codes (was: both
--     staff roles plus admin/teacher members).
-- ============================================================

-- NOTE on qualification: the unqualified `ecosystem_id` inside the EXISTS
-- subquery would resolve to es.ecosystem_id (a self-comparison, always true),
-- so the ecosystem must be qualified as spaces.ecosystem_id.
drop policy if exists "spaces_insert_creator" on public.spaces;
create policy "spaces_insert_creator"
  on public.spaces for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.ecosystem_staff as es
      where es.ecosystem_id = spaces.ecosystem_id
        and es.user_id = auth.uid()
        and es.role = 'ecosystem_admin'
    )
  );

-- The SELECT policy must pass for INSERT ... RETURNING (the row PostgREST
-- returns). can_view_space(id) self-references `spaces`, and the freshly
-- inserted row is not yet visible to that subquery during the RETURNING
-- check, which made every create-space round trip fail with a spurious RLS
-- violation. A NEW-row-only predicate (created_by = auth.uid()) avoids the
-- self-join and lets creators see the space they just made.
drop policy if exists "spaces_select_visible" on public.spaces;
create policy "spaces_select_visible"
  on public.spaces for select
  using (public.can_view_space(id) or created_by = auth.uid());

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
    )
  );
