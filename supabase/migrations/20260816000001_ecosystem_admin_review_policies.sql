-- ============================================================
-- TheGuild: allow approved ecosystem admins to list space edits
-- and lesson deletions so they can review pending requests.
-- ============================================================

create policy "space_edits_select_ecosystem_admin"
  on public.space_edits for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'ecosystem_admin'
        and status = 'approved'
    )
  );

create policy "lesson_deletions_select_ecosystem_admin"
  on public.lesson_deletions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'ecosystem_admin'
        and status = 'approved'
    )
  );
