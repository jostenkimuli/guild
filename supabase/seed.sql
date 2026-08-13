-- Seed data for local development.
-- Creates demo users and a working ecosystem with a classroom space.

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
  '{"username":"demo","full_name":"Demo User"}',
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
  '{"username":"alex","full_name":"Alex Learner"}',
  now(),
  now(),
  false,
  false
)
on conflict (id) do nothing;

-- The on_auth_user_created trigger creates the matching profile row.

insert into public.ecosystems (name, vision, mission, description, type, created_by)
select
  'Civic Labs Academy',
  'A generation of citizens who fix public services from the inside.',
  'Turn resident ideas into testable public-service prototypes.',
  'A school ecosystem that trains learners by working on real civic problems.',
  'school',
  id
from public.profiles
where id = '11111111-1111-1111-1111-111111111111'
on conflict do nothing;

insert into public.spaces (ecosystem_id, name, slug, description, type, created_by)
select
  e.id,
  'Civic Prototyping Class',
  'civic-labs',
  'Where learners team up to prototype improvements for local government.',
  'classroom',
  '11111111-1111-1111-1111-111111111111'
from public.ecosystems as e
where e.name = 'Civic Labs Academy'
on conflict do nothing;

insert into public.space_memberships (space_id, user_id, role)
select s.id, '11111111-1111-1111-1111-111111111111', 'teacher'
from public.spaces as s
where s.slug = 'civic-labs'
on conflict (space_id, user_id) do nothing;

insert into public.space_memberships (space_id, user_id, role)
select s.id, '22222222-2222-2222-2222-222222222222', 'learner'
from public.spaces as s
where s.slug = 'civic-labs'
on conflict (space_id, user_id) do nothing;
