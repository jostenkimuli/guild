-- ============================================================
-- TheGuild: allow approved ecosystem admins to update spaces.
-- Approving a space edit request runs UPDATE on public.spaces,
-- but the existing spaces_update_members policy only allows the
-- creator or admin/teacher members, so RLS silently dropped the
-- update (0 rows, no error) and the edit was marked approved
-- without the space actually changing.
-- ============================================================

create policy "spaces_update_ecosystem_admin"
  on public.spaces for update
  using (
    exists (
      select 1 from public.ecosystem_staff as es
      join public.profiles as p on p.id = auth.uid()
      where es.ecosystem_id = spaces.ecosystem_id
        and es.user_id = auth.uid()
        and es.role = 'ecosystem_admin'
        and p.role = 'ecosystem_admin'
        and p.status = 'approved'
    )
  );
