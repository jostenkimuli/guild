-- ============================================================
-- Sprint 2 (super admin): adds the super_admin role and the
-- delegation flag. The enum value must land in its own
-- transaction before any policy/function may reference it (see
-- 20260814000001_super_admin_policies.sql).
-- ============================================================

alter type public.profile_role add value 'super_admin';

alter table public.profiles
  add column can_approve_ecosystem_admins boolean not null default false;
