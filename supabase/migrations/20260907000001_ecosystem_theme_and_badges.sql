-- ============================================================
-- Ecosystem school theming + badge storage
--
-- Adds per-ecosystem theme configuration (dominant color,
-- supporting tone preset, accent highlight) and a public badge
-- upload target for school crests/emblems.
--
-- RLS: the existing `ecosystems` UPDATE/INSERT grants and the
-- `ecosystems_update_creator` policy already cover the new
-- columns, so no additional grants/policies are needed on the
-- relation itself.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ecosystems theme columns
-- ------------------------------------------------------------

alter table public.ecosystems
  add column badge_url text,
  add column theme_primary text,
  add column theme_supporting text not null default 'modern_blue',
  add column theme_accent text;

-- ------------------------------------------------------------
-- 2. Storage bucket for school crests / badges
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ecosystem-badges',
  'ecosystem-badges',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 3. storage.objects policies
-- ------------------------------------------------------------
-- Note: RLS on storage.objects is already enabled by default in
-- Supabase; only the policies below are created here.

drop policy if exists "ecosystem_badges_public_read" on storage.objects;
create policy "ecosystem_badges_public_read"
  on storage.objects for select
  using (bucket_id = 'ecosystem-badges');

drop policy if exists "ecosystem_badges_authenticated_insert" on storage.objects;
create policy "ecosystem_badges_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ecosystem-badges');

drop policy if exists "ecosystem_badges_authenticated_update" on storage.objects;
create policy "ecosystem_badges_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'ecosystem-badges');

drop policy if exists "ecosystem_badges_authenticated_delete" on storage.objects;
create policy "ecosystem_badges_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'ecosystem-badges');