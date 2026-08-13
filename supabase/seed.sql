-- Seed data for local development.
-- Creates a demo user and a working community with a problem and project.

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
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"username":"demo","full_name":"Demo User"}',
  now(),
  now(),
  false,
  false
)
on conflict (id) do nothing;

-- The on_auth_user_created trigger creates the matching profile row.

insert into public.communities (slug, name, description, mission, created_by)
select
  'civic-labs',
  'Civic Labs',
  'A community prototyping public-service improvements for local government.',
  'Turn resident ideas into testable public-service prototypes.',
  id
from public.profiles
where id = '11111111-1111-1111-1111-111111111111'
on conflict (slug) do nothing;

insert into public.community_members (community_id, user_id, role)
select id, '11111111-1111-1111-1111-111111111111', 'owner'
from public.communities
where slug = 'civic-labs'
on conflict (community_id, user_id) do nothing;

insert into public.problems (community_id, title, description, status, created_by)
select
  id,
  'Long queues at the permit office',
  'Residents wait weeks for building permits. How might we cut the cycle time in half?',
  'open',
  '11111111-1111-1111-1111-111111111111'
from public.communities
where slug = 'civic-labs'
on conflict do nothing;

insert into public.projects (problem_id, name, summary, status, created_by)
select
  p.id,
  'Permit tracker',
  'A lightweight open tracker that shows every permit request and its status in real time.',
  'active',
  '11111111-1111-1111-1111-111111111111'
from public.problems as p
where p.title = 'Long queues at the permit office'
on conflict do nothing;
