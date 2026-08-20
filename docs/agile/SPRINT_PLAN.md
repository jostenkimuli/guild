# Sprint Plan

One-week sprints. The backlog (`PRODUCT_BACKLOG.md`) is the single list of
stories; this plan is the roadmap broken into sprints with goals and
commitments. Sprint commitments are trimmed to velocity at each planning
session.

## Phase map

| Phase | Sprints | What it unlocks |
| ----- | ------- | --------------- |
| 1. School → Classroom → Lessons → Teacher/Learner | 1–2 | Core stability + traction |
| 2. Mentor role in the classroom | 3 | Mentorship / apprenticeship |
| 3. Teams within a Space | 4 | Collaboration |
| 4. Challenge + Project entities | 5–6 | Problem-solving |
| 5. Alliances / Countries | 7–8 | Macro-level scaling |

---

## Sprint 0 — Scaffold (done)

**Goal:** reproducible full-stack scaffold with auth, a working schema, and a
green build, plus the agile process.

| Item | Description | Status |
| ---- | ----------- | ------ |
| Stack | Next.js 16 (App Router, TS strict, Turbopack) | done |
| UI | Tailwind v4 + shadcn/ui (radix base, nova preset) | done |
| Backend | Supabase CLI local dev stack on remapped ports | done |
| Schema | profiles, communities, members, problems, projects + RLS + grants | done |
| Seed | demo user + Civic Labs community/problem/project | done |
| Auth | browser/server clients, session proxy, `/login`, protected `/dashboard` | done |
| Verification | lint/typecheck/build green; auth + RLS positive/negative tests pass | done |
| Process | working agreements, DoD, backlog, sprint plan, conceptual model | done |

---

## Sprint 1 — Rooms that hold people (Phase 1a)

**Goal:** an Ecosystem exists, a Space lives inside it, and users can join —
the container layer of the product.

### Commitments (provisional)
- E-1 Create an ecosystem
- E-2 Join an ecosystem
- S-1 Create a space
- S-2 Browse spaces
- S-3 Join a space
- S-4 Space home page

### Schema work — DONE
- New `ecosystems` table (name, type, vision, mission, description,
  created_by) + RLS/grants
- New `spaces` table (ecosystem_id, name, slug, description, type, created_by)
  + RLS/grants
- New `space_memberships` table (space_id, user_id, role, joined_at, unique
  pair) + RLS/grants
- Enums `ecosystem_type`, `space_type`, `user_space_role`
- Dropped the old community layer (`communities`, `community_members`,
  `problems`, `projects`) — Challenge/Project return redesigned in Sprints
  5/6. Migrations `20260812000000` + `20260812000001` apply from scratch;
  `db:types` regenerated; seed rebuilt (demo user → A Sample School Ecosystem →
  Primary Mathematics Space, teacher role).
- RLS verified: learner self-join allowed, teacher self-join blocked, foreign
  `created_by` blocked.
- **Admin onboarding layer (migration `20260813000001`):** `profiles.role`
  (`program_admin`/`ecosystem_admin`/`space_admin`/`member`) + approval
  `status` (`pending`/`approved`) + `must_change_password`; `ecosystems` gains
  `raw_ecosystem_meta_data` jsonb; new `ecosystem_staff` and `invitation_codes`
  tables; one-ecosystem-per-creator index; RPCs `admin_create_user` (forbid
  program-admin creation) and `invitation_code_info`; triggers auto-assign
  ecosystem staff and space-admin memberships; RLS + grants. Backend flow
  E2E-verified via the API (pending gate, approval, staff/membership
  auto-assign, code redemption).
- **Super admin layer (migrations `20260814000000` + `20260814000001`):**
  `super_admin` role; `profiles.can_approve_ecosystem_admins` delegation flag;
  `admin_create_user` updated (super admin → program admin, program admin →
  ecosystem admin, ecosystem admin → space admin; program/ecosystem admins
  always created pending); update policies scoped to the super admin and to a
  *delegated* program admin; trigger locking `role`/`status`/delegation
  columns. Form inputs validated on the server and in the browser.

### UI work — DONE
- Dashboard reads ecosystems + spaces + memberships and is role-aware with
  console links (done)
- Admin onboarding flow: `/console/super` (create + approve program admins,
  delegate/revoke ecosystem-admin approvals, approve ecosystem admins),
  `/console/program` (create ecosystem admins; approve only when delegated),
  `/console/ecosystem` (create ecosystem with school metadata + space admins),
  `/console/space` (create spaces + invitation codes), server actions in
  `src/app/actions/console.ts`, client forms in
  `src/components/console/forms.tsx`
- Signup requires an invitation code (`/login` validates via
  `invitation_code_info`); admin-created accounts are redirected to
  `/setup-password` on first login
- `proxy.ts` protects `/console` + `/setup-password`; authenticated
  rendering verified for all five roles and the first-login redirect
- Form validation added throughout: required fields, email format, name and
  slug patterns, password lengths, numeric ranges (client + server side)

### DoD notes
- Fresh `db:reset` passes; `db:types` regenerated and committed.

---

## Sprint 2 — Lessons and teachers (Phase 1b) — DONE

**Goal:** teachers publish content and learners consume it — traction.

### Commitments (provisional)
- R-1 Per-space roles (role is a per-space property, not global)
- S-5 Space membership management
- L-1 Publish content
- L-2 Content library
- L-3 Lesson view
- L-4 Lesson progress

### Schema work — DONE
- Curriculum tree: `curricula` (name, year, `space_id`) + `curriculum_goals`
  (the aims); `grades` → `terms` → `units` → `topics` (the academic tree).
- Topic children: `learning_objectives` (ordered), `content`, `lessons`
  (title, description, duration), `teaching_guidance`.
- Lesson children: `activities` (ordered steps), `assessments`
  (quiz/exercise/test/project), and a shared `resources` library linked to
  lessons via `lesson_resources` (many-to-many).
- Per unit: `projects`; per curriculum: `curriculum_evaluations` (period +
  achievement rate).
- RLS: SECURITY DEFINER helpers resolve any row to its curriculum; curricula
  and all children are readable by space members and writable by space staff
  (admin/teacher); the shared `resources` library is readable by any signed-in
  user and writable by staff. Grants for `authenticated` on all new tables.
- Migration `20260815000000` (replacing the previous lesson-cycle migration)
  applies from scratch; `db:types` regenerated; seed rebuilt around a Primary
  Mathematics curriculum in Primary Mathematics Space (goals, Grade 7 terms,
  units, topics, objectives, content, 4 lessons with activities/assessments/
  resources, teaching guidance, unit projects, and two evaluations). RLS
  verified via the API: member reads, staff writes (lesson + activity +
  assessment + resource + lesson_resources), learner publish blocked (403),
  learner resource write blocked (403), non-member reads empty.

### UI work — DONE
- Space home page `/spaces/[slug]`: space info, the curriculum tree with the
  lesson library (curriculum → grades → terms → units → topics → lessons),
  member roster, and a "New lesson" button for staff (L-2, closes the S-4
  space-home gap).
- Lesson view `/spaces/[slug]/lessons/[id]`: topic breadcrumb, lesson
  description, learning objectives, content, activities, assessments and
  linked resources (L-3).
- Publish flow `/spaces/[slug]/lessons/new`: topic picker + dynamic
  activities/assessments/resources form (L-1), server actions in
  `src/app/actions/lessons.ts`.
- Server components by default; client forms only where interactivity is
  needed (`src/components/spaces/lesson-form.tsx`).

### DoD notes
- Fresh `db:reset` passes; `db:types` regenerated and committed; lint,
  typecheck, and `next build` green; positive + negative RLS checks pass.

---

## Sprint 3 — Mentors (Phase 2)

**Goal:** mentorship capability — mentors guide learners through content and
projects.

### Commitments (provisional)
- R-2 Assign mentors
- R-3 Mentor guidance (mentee list, progress view)
- R-4 Role history on profile (P2, only if sprint goal holds)

### Schema work
- Mentor assignment on space membership + mentee links.

---

## Sprint 4 — Teams (Phase 3)

**Goal:** learners form teams inside a Space — collaboration.

### Commitments (provisional)
- T-1 Form a team
- T-2 Join a team (request/accept)
- T-3 Team page (roster + mentor link)
- T-4 Leave/remove (P2, only if sprint goal holds)

### Schema work
- New `teams` + `team_members` tables + RLS/grants.

---

## Sprint 5 — Challenges (Phase 4a)

**Goal:** entities post solvable challenges — problem-solving starts.

### Commitments (provisional)
- CH-1 Post a challenge
- CH-2 Challenge visibility (ecosystem-public vs space-restricted)
- CH-3 Challenge board (filters)
- CH-4 Challenge lifecycle

### Schema work
- `problems` gains budget/prize, deadline, target_skill_level, visibility.

---

## Sprint 6 — Projects (Phase 4b)

**Goal:** teams turn challenges into submitted projects — the solving loop.

### Commitments (provisional)
- PR-1 Create a project mapped to a challenge
- PR-2 Project detail (team, status, mentor-in-charge, repo/docs links)
- PR-3 Project lifecycle (draft → in-progress → submitted)
- PR-4 Submit project

### Schema work
- `projects` gains team, mentor-in-charge, repo_url, submitted_at.

---

## Sprint 7 — Alliances (Phase 5a)

**Goal:** ecosystems nest — schools group into alliances/countries.

### Commitments (provisional)
- M-1 Ecosystem hierarchy
- M-4 Ecosystem directory

### Schema work
- Ecosystem self-relation (`parent_id`) for nesting.

---

## Sprint 8 — Impact at scale (Phase 5b)

**Goal:** solutions roll up across ecosystems — the macro payoff.

### Commitments (provisional)
- M-2 Cross-ecosystem visibility of challenges
- M-3 Impact reporting at alliance/country level

---

## Retro log

### Sprint 0
Planned experiments: verify every schema change via `db:reset` from scratch;
run `db:types` after every migration.

### Sprint 1
Built the admin onboarding layer: program → ecosystem (with approval gate) →
space admins, ecosystem/school metadata, and invitation-code signup. Verified
the whole chain E2E (API + four seeded roles + first-login password flow)
before calling it done.

### Sprint 2
Shipped the lesson delivery cycle end-to-end: curricula → scheme of work →
lesson design (objectives/activities/resources) → delivery session →
objective-level evidence. Started from the plan's single `content` table but
expanded (with agreement) to the full design because it directly serves the
MVP loop and the conceptual model; learner self-tracking on objective results
was added after the first pass so L-4 works for members, not just teachers.
