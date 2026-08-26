-- ============================================================
-- Universal Node Abstraction Layer (parallel overlay)
--
-- A generic graph of typed nodes for both the organisational
-- hierarchy (ecosystems → spaces → …) and the curriculum
-- hierarchy (framework → course → module → topic).
-- Runs alongside the existing domain tables.
-- ============================================================

-- ------------------------------------------------------------
-- 1. node_types: universal look-up of architectural node kinds
-- ------------------------------------------------------------

create table public.node_types (
  type_id   bigserial primary key,
  category  varchar(20) not null check (category in ('ORGANIZATIONAL', 'EDUCATIONAL')),
  type_name varchar(50) not null unique
);

-- ------------------------------------------------------------
-- 2. ecosystem_nodes: the organisational registry ("where" / "who")
--    Self-referencing tree via parent_node_id.
-- ------------------------------------------------------------

create table public.ecosystem_nodes (
  node_id         bigserial primary key,
  parent_node_id  bigint references public.ecosystem_nodes(node_id) on delete set null,
  type_id         bigint references public.node_types(type_id) on delete set null,
  name            varchar(255) not null,
  created_at      timestamptz not null default now()
);

create index idx_ecosystem_nodes_parent on public.ecosystem_nodes (parent_node_id);
create index idx_ecosystem_nodes_type   on public.ecosystem_nodes (type_id);

-- ------------------------------------------------------------
-- 3. curriculum_nodes: the knowledge network ("what")
--    Self-referencing tree (framework → course → module → topic).
-- ------------------------------------------------------------

create table public.curriculum_nodes (
  curriculum_node_id bigserial primary key,
  parent_node_id     bigint references public.curriculum_nodes(curriculum_node_id) on delete set null,
  type_id            bigint references public.node_types(type_id) on delete set null,
  title              varchar(255) not null,
  created_at         timestamptz not null default now()
);

create index idx_curriculum_nodes_parent on public.curriculum_nodes (parent_node_id);
create index idx_curriculum_nodes_type   on public.curriculum_nodes (type_id);

-- ------------------------------------------------------------
-- 4. universal_assignments: links actors to organisational or
--    educational nodes (the universal connector).
-- ------------------------------------------------------------

create table public.universal_assignments (
  assignment_id      bigserial primary key,
  user_id            uuid references auth.users(id) on delete set null,
  ecosystem_node_id  bigint references public.ecosystem_nodes(node_id) on delete set null,
  curriculum_node_id bigint references public.curriculum_nodes(curriculum_node_id) on delete set null,
  role_type          varchar(50) not null,
  status             varchar(20) not null default 'Active',
  created_at         timestamptz not null default now()
);

create index idx_universal_assignments_user    on public.universal_assignments (user_id);
create index idx_universal_assignments_eco     on public.universal_assignments (ecosystem_node_id);
create index idx_universal_assignments_curr    on public.universal_assignments (curriculum_node_id);

-- ------------------------------------------------------------
-- 5. ROW-LEVEL SECURITY
--
--    These are overlay tables without a direct space link, so
--    RLS is permissive: any authenticated user can read, only
--    staff (admin/teacher in any space) can write.  Tighten
--    later once the overlay is wired to domain tables.
-- ------------------------------------------------------------

alter table public.node_types enable row level security;
alter table public.ecosystem_nodes enable row level security;
alter table public.curriculum_nodes enable row level security;
alter table public.universal_assignments enable row level security;

-- node_types: read by anyone, written by super_admin only
create policy "node_types_select_authenticated"
  on public.node_types for select
  using (true);

create policy "node_types_insert_super_admin"
  on public.node_types for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

create policy "node_types_update_super_admin"
  on public.node_types for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

create policy "node_types_delete_super_admin"
  on public.node_types for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

-- ecosystem_nodes: read by authenticated, write by staff
create policy "ecosystem_nodes_select_authenticated"
  on public.ecosystem_nodes for select
  using (true);

create policy "ecosystem_nodes_insert_staff"
  on public.ecosystem_nodes for insert
  with check (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  );

create policy "ecosystem_nodes_update_staff"
  on public.ecosystem_nodes for update
  using (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  )
  with check (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  );

create policy "ecosystem_nodes_delete_staff"
  on public.ecosystem_nodes for delete
  using (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  );

-- curriculum_nodes: read by authenticated, write by staff
create policy "curriculum_nodes_select_authenticated"
  on public.curriculum_nodes for select
  using (true);

create policy "curriculum_nodes_insert_staff"
  on public.curriculum_nodes for insert
  with check (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  );

create policy "curriculum_nodes_update_staff"
  on public.curriculum_nodes for update
  using (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  )
  with check (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  );

create policy "curriculum_nodes_delete_staff"
  on public.curriculum_nodes for delete
  using (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  );

-- universal_assignments: read by authenticated, write by staff
create policy "universal_assignments_select_authenticated"
  on public.universal_assignments for select
  using (true);

create policy "universal_assignments_insert_staff"
  on public.universal_assignments for insert
  with check (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  );

create policy "universal_assignments_update_staff"
  on public.universal_assignments for update
  using (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  )
  with check (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  );

create policy "universal_assignments_delete_staff"
  on public.universal_assignments for delete
  using (
    exists (
      select 1 from public.space_memberships
      where user_id = auth.uid() and role in ('admin', 'teacher')
    )
  );

-- ------------------------------------------------------------
-- 6. GRANTS
-- ------------------------------------------------------------

grant select on public.node_types to authenticated;
grant select, insert, update, delete on public.ecosystem_nodes to authenticated;
grant select, insert, update, delete on public.curriculum_nodes to authenticated;
grant select, insert, update, delete on public.universal_assignments to authenticated;
