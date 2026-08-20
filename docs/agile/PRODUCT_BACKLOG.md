# Product Backlog

## Vision

TheGuild is a macro-level educational ecosystem where large-scale virtual
communities solve real-world problems. Learners grow skills by working on real
challenges, guided by mentors, inside spaces that belong to bigger ecosystems.

### North-star outcome

> A school can create classrooms, teachers can publish lessons, learners form
> teams, teams solve challenges into projects, and the results roll up across
> alliances of schools — without leaving TheGuild.

### MVP loop (the thing we optimize for)

`join space → learn from content → form/join a team → take on a challenge →
build a project → see progress` — every feature must feed this loop or wait.

## Conceptual model

Entities (nouns), relationships (verbs), and rules are defined in
`docs/CONCEPTUAL_MODEL.md`. In short:

- **Ecosystem** hosts Spaces and Users (e.g. a school, a corporation, an
  alliance).
- **Space** is a sub-community where engagement happens (e.g. a Physics Class,
  a Regional Hackathon Group).
- **User** plays fluid roles per space: Teacher, Learner, Mentor, Industry
  Partner.
- **Content** is what teachers publish inside a Space (lessons, videos,
  documents).
- **Challenge** is a problem statement posted by an entity (a country, a
  company), public to the ecosystem or restricted to specific Spaces.
- **Project** is a team's collaborative solution submitted against a Challenge.

Rules: roles are per-space (a user can teach in one Space and learn in
another); a Project must map to at least one Challenge; a Challenge can be
ecosystem-public or space-restricted.

## Backlog format

Each item: `ID — title — user story (As a…, I want…, so that…) — size (S/M/L) —
priority (P0/P1/P2)`.

- **P0**: blocks the MVP loop.
- **P1**: strengthens the MVP loop.
- **P2**: nice to have; keep out of sprint unless the sprint goal is met.

## Sprint/phase mapping (roadmap → sprints)

| Phase | Sprints | Unlocks |
| ----- | ------- | ------- |
| 1. School → Classroom → Lessons → Teacher/Learner | 1–2 | Core system stability and user traction |
| 2. Mentor role | 3 | Mentorship / apprenticeship |
| 3. Teams within a Space | 4 | Collaboration |
| 4. Challenge + Project entities | 5–6 | Problem-solving |
| 5. Alliances / Countries | 7–8 | Macro-level ecosystem scaling |

---

## Epic 1 — Ecosystems & Spaces (Phase 1, P0)

- **E-1** — Create an ecosystem — As a founder, I want to create an ecosystem
  with a name, type (academic/corporate/geographic), and location scale, so
  that it can host spaces. (S, P0)
- **E-2** — Join an ecosystem — As a user, I want to join an ecosystem via
  invite, so that I can see its spaces. (S, P0)
- **S-1** — Create a space — As a teacher, I want to create a classroom inside
  an ecosystem, so that learners have a home for lessons. (S, P0)
- **S-2** — Browse spaces — As a member, I want to list the spaces in my
  ecosystem, so that I can find the right one. (S, P0)
- **S-3** — Join a space — As a learner, I want to join a space with an invite
  code or open join, so that I become a member. (S, P0)
- **S-4** — Space home page — As a member, I want a space page with its
  mission, roster, and recent activity, so that I can orient quickly. (M, P0)
- **S-5** — Space membership — As an owner, I want to manage roles and remove
  members, so that the space stays healthy. (M, P1)

## Epic 2 — Content & Learning (Phase 1, P0)

- **L-1** — Publish content — As a teacher, I want to publish lessons (title,
  body, attachments) into a space, so that learners can engage. (M, P0)
- **L-2** — Content library — As a member, I want to see a space's published
  content, so that I can choose what to study. (S, P0)
- **L-3** — Lesson view — As a learner, I want to open a lesson and read/watch
  it, so that I learn the material. (S, P0)
- **L-4** — Lesson progress — As a learner, I want to mark lessons complete, so
  that my progress is visible. (S, P1)

## Epic 3 — Roles (fluid) (Phases 1–2)

- **R-1** — Per-space roles — As a user, I want my role (teacher/learner/
  mentor/partner) to be defined per space, so that I can teach here and learn
  elsewhere. (M, P0 — foundation for all other epics)
- **R-2** — Assign mentors — As an owner, I want to appoint mentors to a space,
  so that learners have guides. (S, P1)
- **R-3** — Mentor guidance — As a mentor, I want to see my mentees and their
  content/project progress, so that I can guide them. (M, P1)
- **R-4** — Role history — As a user, I want my profile to show role history
  and affiliations, so that my path is credible. (S, P2)

## Epic 4 — Teams (Phase 3, P1)

- **T-1** — Form a team — As a learner, I want to create a team within a space,
  so that we can collaborate. (S, P1)
- **T-2** — Join a team — As a learner, I want to request to join a team and be
  accepted, so that teams stay intentional. (S, P1)
- **T-3** — Team page — As a member, I want a team page with its roster and
  mentor link, so that everyone knows who is doing what. (M, P1)
- **T-4** — Leave/remove — As a member, I want to leave a team or remove a
  member, so that membership stays accurate. (S, P2)

## Epic 5 — Challenges (Phase 4, P0)

- **CH-1** — Post a challenge — As an entity, I want to post a challenge with a
  title, description, budget/prize, deadline, and target skill level, so that
  solvers have a brief. (M, P0)
- **CH-2** — Challenge visibility — As an owner, I want a challenge to be
  ecosystem-public or restricted to specific spaces, so that access is
  controlled. (M, P0)
- **CH-3** — Challenge board — As a member, I want to browse open challenges
  with deadline and skill filters, so that I can pick one. (M, P0)
- **CH-4** — Challenge lifecycle — As an owner, I want challenges to move
  through open → accepting → closed → resolved, so that status is clear. (S, P1)

## Epic 6 — Projects (Phase 4, P0)

- **PR-1** — Create a project — As a team, I want to start a project that maps
  to at least one challenge, so that the work qualifies for problem-solving
  tracks. (S, P0)
- **PR-2** — Project detail — As a member, I want to see the project's team,
  status, mentor-in-charge, and repository/docs links, so that the work is
  legible. (M, P0)
- **PR-3** — Project lifecycle — As a member, I want to move a project through
  draft → in-progress → submitted, so that progress is visible. (S, P1)
- **PR-4** — Submit — As a member, I want to submit the project against its
  challenge, so that it enters the judging/solving track. (S, P1)

## Epic 7 — Macro scale (Phase 5, P2)

- **M-1** — Ecosystem hierarchy — As a founder, I want to group schools into
  alliances/countries, so that ecosystems nest at macro scale. (L, P2)
- **M-2** — Cross-ecosystem visibility — As an alliance, I want challenges
  shared across member schools, so that solutions scale beyond one ecosystem.
  (L, P2)
- **M-3** — Impact reporting — As an alliance, I want solved challenges to roll
  up into reports, so that impact is concrete. (M, P2)
- **M-4** — Ecosystem directory — As a visitor, I want to browse all public
  ecosystems, so that discovery is possible. (S, P2)

---

## Notes for sprint planning

- Sprint 0 (done) = scaffold: stack, auth, schema, green build, agile process.
- Schema status: `ecosystems`, `spaces`, `space_memberships` + enums exist;
  Sprint 1 added the admin layer (`ecosystem_staff`, `invitation_codes`,
  `profiles.role`/`status`, super admin + delegation); Sprint 2 added the
  curriculum structure (`curricula` + `curriculum_goals`, `grades` → `terms`
  → `units` → `topics`, `learning_objectives`/`content`/`lessons`/
  `teaching_guidance`, `activities`/`assessments` + shared `resources` via
  `lesson_resources`, `projects` per unit, `curriculum_evaluations` per
  curriculum). The old community layer
  (`communities`, `community_members`, `problems`, `projects`) is gone —
  Challenge and Project return redesigned in Sprints 5/6. Keep the RLS +
  grants + `db:types` discipline from the DoD on every migration.
