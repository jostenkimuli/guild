-- ============================================================
-- Drop the blueprint delegation schema (Sprint 2 add-on removed).
--
-- The lesson/curriculum publishing feature (and its tables) is
-- deliberately KEPT — only the blueprint delegation layer is
-- being removed:
--   * space_blueprint_delegations (space-level delegation)
--   * blueprint_delegations + its status enum (curriculum-level)
--   * the three helper RPCs (can_manage_blueprints,
--     is_ecosystem_admin, is_blueprint_delegate)
--
-- Drop order matters: tables first (this drops their RLS
-- policies, which reference the helper RPCs), then functions,
-- then the enum type.
-- ============================================================

drop table if exists public.space_blueprint_delegations;

drop table if exists public.blueprint_delegations;

drop function if exists public.can_manage_blueprints(uuid);

drop function if exists public.is_ecosystem_admin(uuid);

drop function if exists public.is_blueprint_delegate(uuid);

drop type if exists public.blueprint_delegation_status;