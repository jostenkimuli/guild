-- ============================================================
-- Sprint: Syllabus Localization & Materials Chip Support
-- ============================================================
-- Adds office_hours and classroom_expectations columns to syllabi.
-- Materials stored as newline-separated text (chips UI compatible).
-- ============================================================

alter table public.syllabi
  add column office_hours text,
  add column classroom_expectations text;