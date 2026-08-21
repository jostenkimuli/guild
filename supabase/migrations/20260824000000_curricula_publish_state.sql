-- ============================================================
-- Curriculum publish state
--
-- The curriculum ("blueprint") wizard distinguishes drafts from
-- published blueprints, mirroring the lessons pattern
-- (lessons.is_published / lessons.published_at).
-- ============================================================

alter table public.curricula
  add column is_published boolean default false;

alter table public.curricula
  add column published_at timestamptz;