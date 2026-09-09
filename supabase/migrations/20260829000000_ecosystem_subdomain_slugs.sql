-- ============================================================
-- Ecosystem subdomain slugs
-- ============================================================
-- Each ecosystem gets a unique, human-readable slug derived from
-- its name. That slug is used as the ecosystem's subdomain, e.g.
-- `my-school.localhost` / `my-school.<app-host>`.
-- Mirrors how `spaces.slug` powers `spaces/[slug]`.

-- ------------------------------------------------------------
-- 1. Add the column (nullable initially so we can backfill)
-- ------------------------------------------------------------

alter table public.ecosystems
  add column slug text;

-- ------------------------------------------------------------
-- 2. Backfill existing rows from their name
-- (~consistency with spaces.slug generation)
-- ------------------------------------------------------------

update public.ecosystems
set slug = lower(regexp_replace(btrim(name), '[^a-z0-9]+', '-', 'gi'))
where slug is null;

-- Trim leading/trailing dashes, truncate to 60 chars, and drop empties.
update public.ecosystems
set slug = case
  when slug = '' then null
  else btrim(substring(slug from 1 for 60), '-')
end;

-- De-duplicate any collisions.
with numbered as (
  select
    id,
    slug,
    row_number() over (
      partition by slug
      order by created_at, id
    ) as rn
  from public.ecosystems
  where slug is not null
)
update public.ecosystems as e
set slug = e.slug || '-' || n.rn
from numbered n
where e.id = n.id
  and n.rn > 1;

update public.ecosystems
set slug = null
where slug = '' or slug is null;

-- ------------------------------------------------------------
-- 3. Enforce uniqueness and non-null for forward writes
-- ------------------------------------------------------------

create unique index ecosystems_slug_key on public.ecosystems (slug) where slug is not null;
alter table public.ecosystems alter column slug set not null;

-- ------------------------------------------------------------
-- Grants
-- Existing select/insert/update/delete grants on `ecosystems`
-- cover the new column automatically (RLS already enabled).
-- ------------------------------------------------------------
