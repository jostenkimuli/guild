-- Seed data for local development.
-- Creates demo accounts for each role, a school ecosystem with metadata,
-- a classroom space, staff links, memberships, and one invitation code.

-- ------------------------------------------------------------
-- demo users
--   superadmin  super admin       (top level: creates + approves program admins,
--                                  approves ecosystem admins, delegates approvals)
--   demo        program admin    (creates ecosystem admins; approves them only
--                                  when the super admin delegates that authority)
--   ecoadmin    ecosystem admin  (owns Civic Labs Academy)
--   spaceadmin  space admin      (owns Civic Prototyping Class)
--   learner     member           (joined via an invitation code)
-- ------------------------------------------------------------

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  phone,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
values (
  '00000000-0000-0000-0000-000000000000',
  '55555555-5555-5555-5555-555555555555',
  'authenticated',
  'authenticated',
  'superadmin@theguild.dev',
  crypt('superadmin-password', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  null,
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"username":"superadmin","full_name":"Super Admin","role":"super_admin","status":"approved","must_change_password":false}',
  now(),
  now(),
  false,
  false
),
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'demo@theguild.dev',
  crypt('demo-password', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  null,
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"username":"demo","full_name":"Program Admin","role":"program_admin","status":"approved","must_change_password":false}',
  now(),
  now(),
  false,
  false
),
(
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated',
  'authenticated',
  'ecoadmin@theguild.dev',
  crypt('ecoadmin-password', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  null,
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"username":"ecoadmin","full_name":"Ecosystem Admin","role":"ecosystem_admin","status":"approved","must_change_password":false}',
  now(),
  now(),
  false,
  false
),
(
  '00000000-0000-0000-0000-000000000000',
  '44444444-4444-4444-4444-444444444444',
  'authenticated',
  'authenticated',
  'spaceadmin@theguild.dev',
  crypt('spaceadmin-password', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  null,
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"username":"spaceadmin","full_name":"Space Admin","role":"space_admin","status":"approved","must_change_password":false}',
  now(),
  now(),
  false,
  false
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'learner@theguild.dev',
  crypt('learner-password', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  null,
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"username":"alex","full_name":"Alex Learner","role":"member","status":"approved","must_change_password":false}',
  now(),
  now(),
  false,
  false
)
on conflict (id) do nothing;

-- The on_auth_user_created trigger creates the matching profile row.

-- ------------------------------------------------------------
-- ecosystem (owned by the ecosystem admin) with school metadata
-- ------------------------------------------------------------

insert into public.ecosystems (name, vision, mission, description, type, raw_ecosystem_meta_data, created_by)
select
  'Civic Labs Academy',
  'A generation of citizens who fix public services from the inside.',
  'Turn resident ideas into testable public-service prototypes.',
  'A school ecosystem that trains learners by working on real civic problems.',
  'school',
  '{
    "director_name": "Jane Director",
    "director_contact": "+254 700 000 000",
    "director_email": "director@civiclabs.example",
    "headteacher_name": "Sam Headteacher",
    "headteacher_contact": "+254 711 000 000",
    "headteacher_email": "headteacher@civiclabs.example",
    "school_location": "Nairobi, Kenya"
  }'::jsonb,
  '33333333-3333-3333-3333-333333333333'
where not exists (select 1 from public.ecosystems where name = 'Civic Labs Academy');

-- The ecosystems_add_staff trigger assigns the ecosystem admin as staff.
-- Add the space admin as a space_admin staff member too.

insert into public.ecosystem_staff (ecosystem_id, user_id, role)
select e.id, '44444444-4444-4444-4444-444444444444', 'space_admin'
from public.ecosystems as e
where e.name = 'Civic Labs Academy'
on conflict (ecosystem_id, user_id) do nothing;

-- ------------------------------------------------------------
-- classroom space (owned by the space admin)
-- ------------------------------------------------------------

insert into public.spaces (ecosystem_id, name, slug, description, type, created_by)
select
  e.id,
  'Civic Prototyping Class',
  'civic-labs',
  'Where learners team up to prototype improvements for local government.',
  'classroom',
  '44444444-4444-4444-4444-444444444444'
from public.ecosystems as e
where e.name = 'Civic Labs Academy'
  and not exists (select 1 from public.spaces where slug = 'civic-labs');

-- The spaces_add_admin_membership trigger makes the space admin an in-space
-- admin. Add the teacher and learner memberships explicitly.

insert into public.space_memberships (space_id, user_id, role)
select s.id, '33333333-3333-3333-3333-333333333333', 'teacher'
from public.spaces as s
where s.slug = 'civic-labs'
on conflict (space_id, user_id) do nothing;

insert into public.space_memberships (space_id, user_id, role)
select s.id, '22222222-2222-2222-2222-222222222222', 'learner'
from public.spaces as s
where s.slug = 'civic-labs'
on conflict (space_id, user_id) do nothing;

-- ------------------------------------------------------------
-- one invitation code so visitors can try the sign-up flow
-- ------------------------------------------------------------

insert into public.invitation_codes (space_id, code, role, created_by, max_uses)
select s.id, 'CIVICLABS', 'learner', '44444444-4444-4444-4444-444444444444', 50
from public.spaces as s
where s.slug = 'civic-labs'
on conflict (code) do nothing;
