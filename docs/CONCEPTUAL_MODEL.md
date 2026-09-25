# Conceptual Model

The domain blueprint for TheGuild: entities, relationships, attributes, and
rules. This is the single source of truth for naming and structure; the schema
should stay in lockstep with it.

## 1. Main entities (the nouns)

- **Ecosystem** — the highest-level boundary (a university, a corporation, an
  alliance of countries). Hosts Spaces and Users.
- **User** — any individual on the platform, categorized by fluid roles
  (Teacher, Learner, Mentor, Industry Partner).
- **Space** — a sub-community within an Ecosystem where specific engagement
  happens (a Physics Class, a Regional Hackathon Group).
- **Content** — educational materials used for teaching and learning (courses,
  videos, documents).
- **Challenge** — a problem statement posted by an entity (a country or
  company) seeking solutions.
- **Project** — a collaborative solution built by users in response to a
  Challenge.

## 2. Core relationships (the verbs)

- Ecosystems host multiple Spaces and Users.
- Teachers publish Content inside a Space.
- Mentors guide Learners through Projects or Content.
- Users form teams to collaborate on Projects.
- Projects are submitted to solve specific Challenges.

## 3. Suggested key attributes

| Entity | Attributes |
| ------ | ---------- |
| Ecosystem | Name, Type (Academic/Corporate/Geographic), Location Scale |
| Challenge | Title, Description, Budget/Prize, Deadline, Target Skill Level |
| Project | Team Members, Status (Draft/In-Progress/Submitted), Mentor-in-Charge, Repository/Documentation Link |
| User | Profile, Skills Inventory, Role History, Ecosystem Affiliation |

## 4. Structural constraints (the rules)

- A Challenge can be public to the whole Ecosystem or restricted to specific
  Spaces.
- A User can be a Teacher in one Space but a Learner or Collaborator in
  another (roles are per-space, never global).
- A Project must map directly to at least one Challenge to qualify for
  problem-solving tracks.

## 5. User journey

```
[Ecosystem: Country/School]
       │
       ├──► [Space: Innovation Hub]
       │         │
       │         ├──► [Challenge Posted] ──► [Teams Formed] ──► [Project Created]
       │                                                               ▲
       └──► [Learning Track] ──────────────────────────────────────────┘
                 │
           (Mentors Guide)
```

## 6. Schema mapping

| Model entity | Current table | Notes |
| ------------ | ------------- | ----- |
| User | `profiles` | platform `role` (`super_admin`/`program_admin`/`ecosystem_admin`/`space_admin`/`member`), approval `status`, `must_change_password`, `can_approve_ecosystem_admins` (delegation) |
| Ecosystem | `ecosystems` | Sprint 1; `raw_ecosystem_meta_data` jsonb for school metadata |
| Ecosystem staff | `ecosystem_staff` | Sprint 1; who administers an ecosystem |
| Space | `spaces` | Sprint 1 (replaces old `communities`) |
| Space membership | `space_memberships` | Sprint 1 (replaces old `community_members`); per-space roles |
| Invitation codes | `invitation_codes` | Sprint 1; signup-with-code joins a space |
| Curriculum | `curricula` (+ `curriculum_goals`) | Sprint 2; one per Space, organised as a tree |
| Academic tree | `grades` → `terms` → `units` → `topics` | Sprint 2; the structure under a curriculum |
| Topic parts | `learning_objectives`, `content`, `lessons`, `teaching_guidance` | Sprint 2; what a topic teaches |
| Lesson parts | `activities`, `assessments`; shared `resources` via `lesson_resources` (M2M) | Sprint 2; parts of a lesson plan |
| Unit projects | `projects` | Sprint 2; one project per unit |
| Curriculum evaluation | `curriculum_evaluations` | Sprint 2; period + achievement rate per curriculum |
| National curriculum (reference) | `national_curricula`, `national_aims`, `national_strands`, `curriculum_nodes`, `national_assessment_guidelines`, `national_period_allocations`, `national_rules`, `national_area_units` | Sprint 2 addendum; see §7 |
| School implementation | `school_curriculum_adoptions`, `implementation_weeks` (+ strand plans), `implementation_timetables` (+ slots), `school_decisions` | Sprint 2 addendum; see §7 |
| Challenge | — | returns as redesigned table (Sprint 5) |
| Project | — | returns as redesigned table (Sprint 6) |

### Curriculum structure (Sprint 2)

A Space hosts one or more `curricula`. Each curriculum is a tree:

`curricula → grades → terms → units → topics → (learning_objectives / content
/ lessons / teaching_guidance); lessons → activities / assessments /
lesson_resources → resources; projects (per unit); curriculum_evaluations
(per curriculum)`

- A **curriculum** (name, year) belongs to exactly one Space and sets the
  **curriculum goals** it aims to achieve. Its outcomes are tracked by
  **curriculum evaluations** (period + achievement rate).
- **Grades → Terms → Units → Topics** is the academic tree a curriculum is
  taught through.
- A **topic** carries what is taught: **learning objectives** (ordered),
  **content** items, reusable **lessons**, and **teaching guidance** for the
  teacher.
- A **lesson** is a plan with a title, duration and description, plus
  **activities** (ordered steps), **assessments** (quiz/exercise/test/
  project), and **resources** from a shared library, linked many-to-many.
- Each **unit** may define one or more **projects** for learners.
- Every row resolves to its curriculum (SECURITY DEFINER helpers); RLS then
  scopes access through the curriculum's Space: members read, space staff
  (admin/teacher) write.

### National curriculum compliance (Sprint 2 addendum)

A Space's `curricula` (§6) is the school's *own* record of what it teaches.
Underneath it sits a second, distinct layer: what the *national* curriculum
authority (NCDC, Uganda) actually requires, and the school's plan for
delivering it. Full research on all six NCDC levels — pre-primary through
BTVET — is in
[`docs/NCDC_CURRICULUM_REFERENCE.md`](NCDC_CURRICULUM_REFERENCE.md); only
one level (Lower Primary, P1) is loaded so far.

**Reference layer** — platform data, the same for every school, read by any
signed-in user and written only by a platform admin:

```
national_curricula                              (one row per NCDC document/level)
  ├─ national_aims                               (national + primary-education aims)
  ├─ national_strands                            (Mathematics, Literacy, ... ; thematic or not)
  ├─ national_period_allocations                 (the level's fixed weekly periods, if it has any)
  ├─ national_rules                               (language / timetable / assessment / teaching rules)
  ├─ national_area_units                         (subjects run on their own schedule, e.g. RE, PE)
  └─ curriculum_nodes                            (the curriculum tree — see below)
       └─ national_assessment_guidelines         (per theme-type node, per strand)
```

`curriculum_nodes` is one generic, self-referencing tree rather than a
level-specific table set. A row's kind is a plain `node_type` text column
(`theme` / `sub_theme` / `competence` today), not a separate lookup table —
NCDC's other levels are subject/strand/competency-based, not thematic, so a
future level adds a `node_type` value (an ordinary migration widening a
check constraint) instead of a parallel schema. Type-specific facts that
don't earn their own column (a theme's `theme_no`/`term_no`, a sub-theme's
`code`) live in a `jsonb attributes` column.

**Implementation layer** — one school's own plan, written only by that
school's owner (approved `ecosystem_admin`), read by its staff and teachers:

```
school_curriculum_adoptions      (which national_curricula this school follows)
implementation_weeks             (per curriculum_node: teacher, dates, status, notes)
  └─ implementation_week_strand_plans   (per strand: "how we will teach this")
implementation_timetables        (per school + national_curriculum, periods/day)
  └─ implementation_timetable_slots     (day/period → national_period_allocations)
school_decisions                 (choices the curriculum leaves to the school,
                                   e.g. language of instruction)
```

Two RPCs (`save_implementation_week`, `save_implementation_timetable`) write
the multi-row plan and timetable atomically; the timetable RPC refuses to
publish until every national period allocation is placed.

### Approval chain (Sprint 1)

- **Super admin** creates program admins (pending) and approves them.
- **Program admin** (approved) creates ecosystem admins (pending).
- Ecosystem-admin approvals always land with the **super admin**, who can
  approve directly or delegate to a program admin
  (`profiles.can_approve_ecosystem_admins`); a delegated program admin then
  approves them.
- **Ecosystem admin** (approved) creates their ecosystem and space admins
  (auto-approved).
- **Space admin** creates spaces and invitation codes; signup with a code adds
  the subscriber as a member.

All migrations land in the sprint that needs them (see `SPRINT_PLAN.md`).
