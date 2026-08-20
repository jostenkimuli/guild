-- ============================================================
-- Rename space_type 'classroom' → 'department'
-- Uses the swap-types pattern to safely rename an enum value.
-- ============================================================

-- 1. Drop the current default so the type swap doesn't conflict
alter table public.spaces
  alter column type drop default;

-- 2. Create the replacement enum
create type public._space_type_new as enum ('department', 'innovation_hub', 'project_group');

-- 3. Migrate the column to the new type (casting existing values)
alter table public.spaces
  alter column type type public._space_type_new using
    case type::text
      when 'classroom' then 'department'
      else type::text
    end::public._space_type_new;

-- 4. Swap the types
drop type public.space_type;
alter type public._space_type_new rename to space_type;

-- 5. Set the new default
alter table public.spaces
  alter column type set default 'department';
