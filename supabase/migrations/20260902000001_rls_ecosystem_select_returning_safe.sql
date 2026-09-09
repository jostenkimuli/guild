-- 20260902000001_rls_ecosystem_select_returning_safe.sql
--
-- PG17 enforces the table's SELECT policy on rows RETURNED by data-modifying
-- statements (INSERT/UPDATE .. RETURNING). That check runs in
-- ExecWithCheckOptions BEFORE the transaction snapshot can see the pending row.
-- The old ecosystems_select_visible policy delegated to
-- public.can_view_ecosystem(id), which re-queries ecosystems by id against the
-- current snapshot -- so a brand-new row was never found and the visibility
-- function always returned false. Every insert that asked for the row back
-- (the createEcosystem server action inserts with .select("id").single(), which
-- makes PostgREST send Prefer: return=representation) died with
--   new row violates row-level security policy for table "ecosystems"
-- even for the creator, a super_admin, or is_private = false.
--
-- The policy below evaluates row-native columns (is_private / created_by)
-- instead of re-reading the same table, so it can see the row being returned.
-- The four original visibility branches from can_view_ecosystem are preserved,
-- plus creators can always read their own ecosystem (they own and manage it,
-- and ecosystems_delete_creator already treats them as such).

drop policy if exists "ecosystems_select_visible" on public.ecosystems;
create policy "ecosystems_select_visible"
  on public.ecosystems for select
  using (
    is_private = false
    or created_by = auth.uid()
    or exists (
      select 1
      from public.space_memberships as m
      join public.spaces as s on s.id = m.space_id
      where s.ecosystem_id = ecosystems.id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.ecosystem_staff as es
      where es.ecosystem_id = ecosystems.id and es.user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles as p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'program_admin')
        and p.status = 'approved'
    )
  );

-- NOTE: can_view_ecosystem(uuid) is intentionally kept for non-policy uses. It
-- must NOT be restored as the ecosystems SELECT policy predicate: for
-- INSERT/UPDATE .. RETURNING rows it runs against a stale snapshot and always
-- reports the new row as invisible. The same trap applies to
-- can_view_space(uuid)/spaces_select_visible if any future code inserts a
-- space with a .select() chained on.