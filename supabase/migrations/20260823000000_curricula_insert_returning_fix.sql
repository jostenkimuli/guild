-- ============================================================
-- curricula INSERT ... RETURNING RLS fix
--
-- The SELECT policy curricula_select_members used
-- can_access_curriculum(id), which self-references `curricula`
-- by id. During INSERT ... RETURNING (what PostgREST's
-- .insert().select() round trips use), the freshly inserted row
-- is not yet visible to that subquery, so the policy spuriously
-- rejected the row just created and every create-curriculum call
-- failed with "new row violates row-level security policy".
--
-- This is the same bug already fixed for `spaces` in
-- 20260815000002_ecosystem_console_roles.sql. We apply the same
-- remedy: OR a NEW-row-only predicate on space_id (which is
-- available on the new row and needs no self-join) into the
-- SELECT policy, so staff can see the curriculum they just made.
-- ============================================================

drop policy if exists "curricula_select_members" on public.curricula;
create policy "curricula_select_members"
  on public.curricula for select
  using (
    public.can_access_curriculum(id)
    or public.is_effective_space_staff(space_id)
  );