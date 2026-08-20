-- ============================================================
-- Optimization pass: fix missing grants (bugs) and add
-- high-impact indexes.
-- ============================================================

-- ------------------------------------------------------------
-- 1. GRANTS (missing grants are runtime bugs)
--    - space_blueprint_delegations had NO grants at all
--    - curricula was select-only, but staff insert curricula
--    - the blueprint helper RPCs had no execute grant
-- ------------------------------------------------------------

grant select, insert, update, delete on public.space_blueprint_delegations to authenticated;

grant insert, update, delete on public.curricula to authenticated;

grant execute on function public.can_manage_blueprints(uuid) to authenticated;
grant execute on function public.is_ecosystem_admin(uuid) to authenticated;
grant execute on function public.is_blueprint_delegate(uuid) to authenticated;

-- ------------------------------------------------------------
-- 2. HIGH-IMPACT INDEXES
-- ------------------------------------------------------------

-- spaces.slug: the route lookup column on every space page load.
-- Make it unique (the app already assumes uniqueness via maybeSingle).
create unique index spaces_slug_key on public.spaces (slug) where slug is not null;

-- spaces.ecosystem_id: hottest join/filter path (RLS visibility checks,
-- ecosystem console listings).
create index spaces_ecosystem_idx on public.spaces (ecosystem_id);

-- space_memberships.user_id: per-user lookups (dashboard, layout,
-- resources staff checks) scan the table without it.
create index space_memberships_user_idx on public.space_memberships (user_id, role);

-- space_edits: filtered by space_id, edited_by, and (status, created_at)
create index space_edits_space_idx on public.space_edits (space_id);
create index space_edits_edited_by_idx on public.space_edits (edited_by);
create index space_edits_status_created_at_idx on public.space_edits (status, created_at desc);

-- profiles: console listings filter by role + status
create index profiles_role_status_idx on public.profiles (role, status);

-- ------------------------------------------------------------
-- 3. DROP DUPLICATE INDEXES
--    (idx_* in 20260820000000 duplicate Sprint-2 *_idx indexes
--    or unique constraints; each costs a write on every row)
-- ------------------------------------------------------------

drop index if exists public.idx_grades_curriculum_id;
drop index if exists public.idx_terms_grade_id;
drop index if exists public.idx_units_term_id;
drop index if exists public.idx_topics_unit_id;
drop index if exists public.idx_syllabi_curriculum_id;
drop index if exists public.idx_scheduled_sessions_lesson_id;
