-- Seed data for local development.
-- Creates demo accounts for each role, a school ecosystem with metadata,
-- a department space, staff links, memberships, one invitation code, and
-- the Sprint 2 curriculum tree (curriculum → goals → grades → terms →
-- units → topics → learning objectives / content / lessons / teaching
-- guidance; lessons → activities / assessments / resources; projects per
-- unit; curriculum evaluations).

-- ------------------------------------------------------------
-- demo users
--   superadmin  super admin       (top level: creates + approves program admins,
--                                  approves ecosystem admins, delegates approvals)
--   demo        program admin    (creates ecosystem admins; approves them only
--                                  when the super admin delegates that authority)
--   ecoadmin    ecosystem admin  (owns A Sample School Ecosystem)
--   spaceadmin  space admin      (owns Primary Mathematics Space)
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
  '{"username":"ecoadmin","full_name":"Ecosystem Admin","role":"ecosystem_admin","status":"approved","must_change_password":false,"ecosystem_type":"primary_school"}',
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
  'A Sample School Ecosystem',
  'A school where every learner builds real skills for a changing world.',
  'Bring curriculum, projects and community together in one place.',
  'A demo school ecosystem used to showcase the platform.',
  'primary_school',
  '{
    "director_name": "Jane Director",
    "director_contact": "+254 700 000 000",
    "director_email": "director@sample-school.example",
    "headteacher_name": "Sam Headteacher",
    "headteacher_contact": "+254 711 000 000",
    "headteacher_email": "headteacher@sample-school.example",
    "school_location": "Nairobi, Kenya"
  }'::jsonb,
  '33333333-3333-3333-3333-333333333333'
where not exists (select 1 from public.ecosystems where name = 'A Sample School Ecosystem');

-- The ecosystems_add_staff trigger assigns the ecosystem admin as staff.
-- Add the space admin as a space_admin staff member too.

insert into public.ecosystem_staff (ecosystem_id, user_id, role)
select e.id, '44444444-4444-4444-4444-444444444444', 'space_admin'
from public.ecosystems as e
where e.name = 'A Sample School Ecosystem'
on conflict (ecosystem_id, user_id) do nothing;

-- ------------------------------------------------------------
-- department space (owned by the space admin)
-- ------------------------------------------------------------

insert into public.spaces (ecosystem_id, name, slug, description, type, created_by)
select
  e.id,
  'Primary Mathematics Space',
  'primary-mathematics',
  'Where Year 7 learners study the Primary Mathematics curriculum.',
  'department',
  '44444444-4444-4444-4444-444444444444'
from public.ecosystems as e
where e.name = 'A Sample School Ecosystem'
  and not exists (select 1 from public.spaces where slug = 'primary-mathematics');

-- The spaces_add_admin_membership trigger makes the space admin an in-space
-- admin. Add the teacher and learner memberships explicitly.

insert into public.space_memberships (space_id, user_id, role)
select s.id, '33333333-3333-3333-3333-333333333333', 'teacher'
from public.spaces as s
where s.slug = 'primary-mathematics'
on conflict (space_id, user_id) do nothing;

insert into public.space_memberships (space_id, user_id, role)
select s.id, '22222222-2222-2222-2222-222222222222', 'learner'
from public.spaces as s
where s.slug = 'primary-mathematics'
on conflict (space_id, user_id) do nothing;

-- ------------------------------------------------------------
-- one invitation code so visitors can try the sign-up flow
-- ------------------------------------------------------------

insert into public.invitation_codes (space_id, code, role, created_by, max_uses)
select s.id, 'MATHLAB', 'learner', '44444444-4444-4444-4444-444444444444', 50
from public.spaces as s
where s.slug = 'primary-mathematics'
on conflict (code) do nothing;

-- ============================================================
-- Sprint 2: the curriculum tree for Primary Mathematics Space
-- ============================================================

-- curricula: the Primary Mathematics curriculum under the space
insert into public.curricula (space_id, name, year)
select s.id, 'Primary Mathematics', 2026
from public.spaces as s
where s.slug = 'primary-mathematics'
  and not exists (select 1 from public.curricula where name = 'Primary Mathematics');

-- curriculum goals
insert into public.curriculum_goals (curriculum_id, description)
select c.id, 'Develop fluency with fractions, decimals and percentages and use them to solve real-world problems.'
from public.curricula as c
where c.name = 'Primary Mathematics'
  and not exists (select 1 from public.curriculum_goals where description like 'Develop fluency with fractions%');

insert into public.curriculum_goals (curriculum_id, description)
select c.id, 'Build confidence in measurement, geometry and data handling through practical activities.'
from public.curricula as c
where c.name = 'Primary Mathematics'
  and not exists (select 1 from public.curriculum_goals where description like 'Build confidence in measurement%');

insert into public.curriculum_goals (curriculum_id, description)
select c.id, 'Reason mathematically and communicate solutions clearly, using correct notation.'
from public.curricula as c
where c.name = 'Primary Mathematics'
  and not exists (select 1 from public.curriculum_goals where description like 'Reason mathematically%');

-- grades
insert into public.grades (curriculum_id, name)
select c.id, 'Grade 7' from public.curricula as c
where c.name = 'Primary Mathematics'
  and not exists (select 1 from public.grades where curriculum_id = c.id and name = 'Grade 7');

insert into public.grades (curriculum_id, name)
select c.id, 'Grade 8' from public.curricula as c
where c.name = 'Primary Mathematics'
  and not exists (select 1 from public.grades where curriculum_id = c.id and name = 'Grade 8');

insert into public.grades (curriculum_id, name)
select c.id, 'Grade 9' from public.curricula as c
where c.name = 'Primary Mathematics'
  and not exists (select 1 from public.grades where curriculum_id = c.id and name = 'Grade 9');

-- terms (Grade 7 only)
insert into public.terms (grade_id, name)
select g.id, 'Term 1' from public.grades as g
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and g.name = 'Grade 7'
  and not exists (select 1 from public.terms where grade_id = g.id and name = 'Term 1');

insert into public.terms (grade_id, name)
select g.id, 'Term 2' from public.grades as g
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and g.name = 'Grade 7'
  and not exists (select 1 from public.terms where grade_id = g.id and name = 'Term 2');

insert into public.terms (grade_id, name)
select g.id, 'Term 3' from public.grades as g
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and g.name = 'Grade 7'
  and not exists (select 1 from public.terms where grade_id = g.id and name = 'Term 3');

-- units
insert into public.units (term_id, name)
select t.id, 'Number and Algebra' from public.terms as t
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and t.name = 'Term 1'
  and not exists (select 1 from public.units where term_id = t.id and name = 'Number and Algebra');

insert into public.units (term_id, name)
select t.id, 'Geometry and Measurement' from public.terms as t
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and t.name = 'Term 1'
  and not exists (select 1 from public.units where term_id = t.id and name = 'Geometry and Measurement');

insert into public.units (term_id, name)
select t.id, 'Statistics and Probability' from public.terms as t
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and t.name = 'Term 2'
  and not exists (select 1 from public.units where term_id = t.id and name = 'Statistics and Probability');

-- topics
insert into public.topics (unit_id, name)
select u.id, 'Fractions, Decimals and Percentages' from public.units as u
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and u.name = 'Number and Algebra'
  and not exists (select 1 from public.topics where unit_id = u.id and name = 'Fractions, Decimals and Percentages');

insert into public.topics (unit_id, name)
select u.id, 'Algebraic Expressions' from public.units as u
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and u.name = 'Number and Algebra'
  and not exists (select 1 from public.topics where unit_id = u.id and name = 'Algebraic Expressions');

insert into public.topics (unit_id, name)
select u.id, 'Angles and Shapes' from public.units as u
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and u.name = 'Geometry and Measurement'
  and not exists (select 1 from public.topics where unit_id = u.id and name = 'Angles and Shapes');

insert into public.topics (unit_id, name)
select u.id, 'Area and Perimeter' from public.units as u
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and u.name = 'Geometry and Measurement'
  and not exists (select 1 from public.topics where unit_id = u.id and name = 'Area and Perimeter');

insert into public.topics (unit_id, name)
select u.id, 'Data Handling' from public.units as u
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and u.name = 'Statistics and Probability'
  and not exists (select 1 from public.topics where unit_id = u.id and name = 'Data Handling');

insert into public.topics (unit_id, name)
select u.id, 'Probability' from public.units as u
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and u.name = 'Statistics and Probability'
  and not exists (select 1 from public.topics where unit_id = u.id and name = 'Probability');

-- learning objectives
insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Convert between fractions, decimals and percentages.', 1 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Fractions, Decimals and Percentages'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Convert between fractions%');

insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Solve problems involving percentages of quantities.', 2 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Fractions, Decimals and Percentages'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Solve problems involving percentages%');

insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Simplify linear algebraic expressions.', 1 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Algebraic Expressions'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Simplify linear%');

insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Evaluate expressions by substituting values.', 2 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Algebraic Expressions'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Evaluate expressions by substituting%');

insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Calculate angles around a point and in triangles.', 1 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Angles and Shapes'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Calculate angles around a point%');

insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Classify quadrilaterals by their properties.', 2 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Angles and Shapes'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Classify quadrilaterals%');

insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Calculate the area and perimeter of rectangles and triangles.', 1 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Area and Perimeter'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Calculate the area and perimeter%');

insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Estimate the area of irregular shapes.', 2 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Area and Perimeter'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Estimate the area%');

insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Construct and interpret bar charts and line graphs.', 1 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Data Handling'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Construct and interpret%');

insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Calculate the mean, median and mode of a data set.', 2 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Data Handling'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Calculate the mean%');

insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Describe probabilities using fractions, decimals and percentages.', 1 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Probability'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Describe probabilities%');

insert into public.learning_objectives (topic_id, description, sequence)
select tp.id, 'Calculate the probability of a simple event.', 2 from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Probability'
  and not exists (select 1 from public.learning_objectives where topic_id = tp.id and description like 'Calculate the probability of a simple event%');

-- content
insert into public.content (topic_id, title, description)
select tp.id, 'Equivalent fractions', 'What makes two fractions equivalent, and how to find them.'
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Fractions, Decimals and Percentages'
  and not exists (select 1 from public.content where topic_id = tp.id and title = 'Equivalent fractions');

insert into public.content (topic_id, title, description)
select tp.id, 'Converting fractions to decimals', 'A step-by-step method for turning fractions into decimals.'
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Fractions, Decimals and Percentages'
  and not exists (select 1 from public.content where topic_id = tp.id and title = 'Converting fractions to decimals');

insert into public.content (topic_id, title, description)
select tp.id, 'What is a variable?', 'Letters standing for unknown values in expressions and equations.'
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Algebraic Expressions'
  and not exists (select 1 from public.content where topic_id = tp.id and title = 'What is a variable?');

insert into public.content (topic_id, title, description)
select tp.id, 'Angles around a point', 'Angles on a straight line and around a point total 180 degrees and 360 degrees.'
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Angles and Shapes'
  and not exists (select 1 from public.content where topic_id = tp.id and title = 'Angles around a point');

-- lessons (self-paced, published)
insert into public.lessons (topic_id, title, content, estimated_duration_minutes, delivery_type, is_published, published_at, teacher_id)
select tp.id, 'Fractions to decimals and percentages',
  'Convert between fractions, decimals and percentages, and solve percentage problems.',
  45, 'self_paced', true, now(),
  (select id from public.profiles where display_name = 'Demo User' limit 1)
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Fractions, Decimals and Percentages'
  and not exists (select 1 from public.lessons where topic_id = tp.id and title = 'Fractions to decimals and percentages');

insert into public.lessons (topic_id, title, content, estimated_duration_minutes, delivery_type, is_published, published_at, teacher_id)
select tp.id, 'Simplifying expressions',
  'Simplify linear expressions by collecting like terms and evaluate them by substitution.',
  45, 'self_paced', true, now(),
  (select id from public.profiles where display_name = 'Demo User' limit 1)
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Algebraic Expressions'
  and not exists (select 1 from public.lessons where topic_id = tp.id and title = 'Simplifying expressions');

insert into public.lessons (topic_id, title, content, estimated_duration_minutes, delivery_type, is_published, published_at, teacher_id)
select tp.id, 'Angles in triangles',
  'Measure angles with a protractor and calculate missing angles in triangles.',
  40, 'self_paced', true, now(),
  (select id from public.profiles where display_name = 'Demo User' limit 1)
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Angles and Shapes'
  and not exists (select 1 from public.lessons where topic_id = tp.id and title = 'Angles in triangles');

insert into public.lessons (topic_id, title, content, estimated_duration_minutes, delivery_type, is_published, published_at, teacher_id)
select tp.id, 'Drawing bar charts',
  'Collect data as a class and present it in a bar chart.',
  45, 'self_paced', true, now(),
  (select id from public.profiles where display_name = 'Demo User' limit 1)
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Data Handling'
  and not exists (select 1 from public.lessons where topic_id = tp.id and title = 'Drawing bar charts');

-- activities
insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Starter: fraction pairs', 'Match equivalent fractions and decimals in pairs.', 1
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Fractions to decimals and percentages'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Starter: fraction pairs');

insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Convert and compare', 'Convert sets of numbers and place them on a number line.', 2
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Fractions to decimals and percentages'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Convert and compare');

insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Plenary: percentage quiz', 'A quick-fire quiz on converting percentages.', 3
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Fractions to decimals and percentages'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Plenary: percentage quiz');

insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Collect like terms', 'Simplify expressions by collecting like terms.', 1
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Simplifying expressions'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Collect like terms');

insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Substitution practice', 'Evaluate expressions by substituting given values.', 2
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Simplifying expressions'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Substitution practice');

insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Exit ticket', 'Write one expression you can now simplify.', 3
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Simplifying expressions'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Exit ticket');

insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Measure angles', 'Measure the angles of a triangle with a protractor.', 1
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Angles in triangles'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Measure angles');

insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Angle hunt', 'Find triangles in the room and check their angle sums.', 2
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Angles in triangles'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Angle hunt');

insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Triangle angle challenge', 'Calculate missing angles in given triangles.', 3
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Angles in triangles'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Triangle angle challenge');

insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Tally the class data', 'Collect a tally of favourite subjects in the class.', 1
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Drawing bar charts'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Tally the class data');

insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Draw the chart', 'Draw a bar chart of the tallied data.', 2
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Drawing bar charts'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Draw the chart');

insert into public.activities (lesson_id, title, description, sequence)
select l.id, 'Swap and check', 'Swap charts with a partner and check accuracy.', 3
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Drawing bar charts'
  and not exists (select 1 from public.activities where lesson_id = l.id and title = 'Swap and check');

-- assessments
insert into public.assessments (lesson_id, title, type, description, sequence)
select l.id, 'Conversion quiz', 'quiz', 'Ten quick conversions between fractions, decimals and percentages.', 1
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Fractions to decimals and percentages'
  and not exists (select 1 from public.assessments where lesson_id = l.id and title = 'Conversion quiz');

insert into public.assessments (lesson_id, title, type, description, sequence)
select l.id, 'Percentage problems', 'exercise', 'Word problems involving percentages of quantities.', 2
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Fractions to decimals and percentages'
  and not exists (select 1 from public.assessments where lesson_id = l.id and title = 'Percentage problems');

insert into public.assessments (lesson_id, title, type, description, sequence)
select l.id, 'Simplifying practice', 'exercise', 'Simplify and substitute with worked answers.', 1
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Simplifying expressions'
  and not exists (select 1 from public.assessments where lesson_id = l.id and title = 'Simplifying practice');

insert into public.assessments (lesson_id, title, type, description, sequence)
select l.id, 'Triangle angle check-up', 'quiz', 'Five triangles; find the missing angle in each.', 1
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Angles in triangles'
  and not exists (select 1 from public.assessments where lesson_id = l.id and title = 'Triangle angle check-up');

insert into public.assessments (lesson_id, title, type, description, sequence)
select l.id, 'Chart practice set', 'exercise', 'Interpret and draw bar charts from given data.', 1
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and l.title = 'Drawing bar charts'
  and not exists (select 1 from public.assessments where lesson_id = l.id and title = 'Chart practice set');

-- resources (the shared library)
insert into public.resources (title, type, url)
select 'Fraction wall poster', 'document', 'https://example.com/fraction-wall.pdf'
where not exists (select 1 from public.resources where title = 'Fraction wall poster');

insert into public.resources (title, type, url)
select 'Equivalent fractions video', 'video', 'https://example.com/equivalent-fractions'
where not exists (select 1 from public.resources where title = 'Equivalent fractions video');

insert into public.resources (title, type, url)
select 'Simplifying expressions worksheet', 'document', 'https://example.com/simplifying-worksheet.pdf'
where not exists (select 1 from public.resources where title = 'Simplifying expressions worksheet');

insert into public.resources (title, type, url)
select 'Blank graph paper', 'document', 'https://example.com/graph-paper.pdf'
where not exists (select 1 from public.resources where title = 'Blank graph paper');

insert into public.resources (title, type, url)
select 'Protractor guide', 'text', 'https://example.com/how-to-use-a-protractor'
where not exists (select 1 from public.resources where title = 'Protractor guide');

-- lesson_resources: link resources to lessons
insert into public.lesson_resources (lesson_id, resource_id)
select l.id, r.id
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
join public.resources as r on r.title in ('Fraction wall poster', 'Equivalent fractions video')
where c.name = 'Primary Mathematics' and l.title = 'Fractions to decimals and percentages'
on conflict (lesson_id, resource_id) do nothing;

insert into public.lesson_resources (lesson_id, resource_id)
select l.id, r.id
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
join public.resources as r on r.title = 'Simplifying expressions worksheet'
where c.name = 'Primary Mathematics' and l.title = 'Simplifying expressions'
on conflict (lesson_id, resource_id) do nothing;

insert into public.lesson_resources (lesson_id, resource_id)
select l.id, r.id
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
join public.resources as r on r.title = 'Blank graph paper'
where c.name = 'Primary Mathematics' and l.title = 'Drawing bar charts'
on conflict (lesson_id, resource_id) do nothing;

insert into public.lesson_resources (lesson_id, resource_id)
select l.id, r.id
from public.lessons as l
join public.topics as tp on tp.id = l.topic_id
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
join public.resources as r on r.title = 'Protractor guide'
where c.name = 'Primary Mathematics' and l.title = 'Angles in triangles'
on conflict (lesson_id, resource_id) do nothing;

-- teaching guidance
insert into public.teaching_guidance (topic_id, guidance)
select tp.id, 'Start with concrete fraction walls before moving to abstract conversions. Use real percentages (sales, scores) every day.'
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Fractions, Decimals and Percentages'
  and not exists (select 1 from public.teaching_guidance where topic_id = tp.id);

insert into public.teaching_guidance (topic_id, guidance)
select tp.id, 'Introduce like terms with concrete shapes before notation. Check substitution one value at a time.'
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Algebraic Expressions'
  and not exists (select 1 from public.teaching_guidance where topic_id = tp.id);

insert into public.teaching_guidance (topic_id, guidance)
select tp.id, 'Use physical protractors and have learners estimate before measuring.'
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Angles and Shapes'
  and not exists (select 1 from public.teaching_guidance where topic_id = tp.id);

insert into public.teaching_guidance (topic_id, guidance)
select tp.id, 'Use squared paper and real classroom objects before abstract formulas.'
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Area and Perimeter'
  and not exists (select 1 from public.teaching_guidance where topic_id = tp.id);

insert into public.teaching_guidance (topic_id, guidance)
select tp.id, 'Use data the class collects itself to keep charts meaningful.'
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Data Handling'
  and not exists (select 1 from public.teaching_guidance where topic_id = tp.id);

insert into public.teaching_guidance (topic_id, guidance)
select tp.id, 'Use dice, spinners and coins before formal probability notation.'
from public.topics as tp
join public.units as u on u.id = tp.unit_id
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and tp.name = 'Probability'
  and not exists (select 1 from public.teaching_guidance where topic_id = tp.id);

-- projects (per unit)
insert into public.projects (unit_id, title, description)
select u.id, 'Class market stall', 'Design a mini market stall, pricing items using fractions, decimals and percentages.'
from public.units as u
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and u.name = 'Number and Algebra'
  and not exists (select 1 from public.projects where unit_id = u.id and title = 'Class market stall');

insert into public.projects (unit_id, title, description)
select u.id, 'Design a school garden', 'Plan a school garden bed, calculating area, perimeter and angles.'
from public.units as u
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and u.name = 'Geometry and Measurement'
  and not exists (select 1 from public.projects where unit_id = u.id and title = 'Design a school garden');

insert into public.projects (unit_id, title, description)
select u.id, 'Survey the school', 'Carry out a school survey, then present the results as charts.'
from public.units as u
join public.terms as t on t.id = u.term_id
join public.grades as g on g.id = t.grade_id
join public.curricula as c on c.id = g.curriculum_id
where c.name = 'Primary Mathematics' and u.name = 'Statistics and Probability'
  and not exists (select 1 from public.projects where unit_id = u.id and title = 'Survey the school');

-- curriculum evaluations
insert into public.curriculum_evaluations (curriculum_id, period, achievement_rate)
select c.id, 'Term 1 2026', 72.50
from public.curricula as c
where c.name = 'Primary Mathematics'
  and not exists (select 1 from public.curriculum_evaluations where curriculum_id = c.id and period = 'Term 1 2026');

insert into public.curriculum_evaluations (curriculum_id, period, achievement_rate)
select c.id, 'Term 2 2026', 78.00
from public.curricula as c
where c.name = 'Primary Mathematics'
  and not exists (select 1 from public.curriculum_evaluations where curriculum_id = c.id and period = 'Term 2 2026');

-- syllabus for Primary Mathematics
insert into public.syllabi (curriculum_id, grading_policy, required_materials, instructor_notes, teacher_id)
select c.id,
  '{"pass_mark": 50, "grade_breakdown": [{"label": "Homework", "weight_pct": 20}, {"label": "Mid-term exam", "weight_pct": 30}, {"label": "Final exam", "weight_pct": 50}]}'::jsonb,
  'Scientific calculator, ruler, protractor, set squares, graph paper',
  'Office hours: Tuesdays and Thursdays 3-4pm. Contact: demo@theguild.dev',
  (select id from public.profiles where display_name = 'Demo User' limit 1)
from public.curricula as c
where c.name = 'Primary Mathematics'
  and not exists (select 1 from public.syllabi where curriculum_id = c.id);
