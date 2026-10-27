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
| Standard node type | `node_types` | Schema-as-data registry: `payload_schema`, `allowed_children`, `is_root` (+ `component_manifest` implied) |
| Standard document | `curriculum_nodes` (root rows) | Any external curriculum definition as data; seeded demo roots `KFZ-MECH-2020`, `KNEC-KISW-CBC`, `NCAD-TRANS-01` |
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

### Standard registry (schema-as-data)

Any national standard or external curriculum definition (Germany's KFZ training
regulation, Kenya's Kenya National Curriculum Framework, an Irish book
translation programme) is registered as **data** on the universal
`curriculum_nodes` tree; `node_types` is the type registry:

- A **type** (`node_types`) carries a `category`, `is_root`, an optional
  draft-7 `payload_schema` formalizing its document shape, and for root-capable
  types a `component_manifest` of exactly four components:
  `intent | content | learning_teaching | assessment`. Custom schema keywords
  (`x-order`, `x-help`) are presentation hints only — pg_jsonschema ignores
  them. Registration happens in the Standard Registry panel on
  `/admin/curriculum` or via migration (`on conflict (type_name) do nothing`).
- A **document** is a root `curriculum_nodes` row whose type is root-capable;
  its `payload` (validated against the type's schema) forms a tree via
  `allowed_children` (e.g. `occupation_framework → [learning_field] →
  [training_year] → [competence_area]`). Each component in the manifest maps to
  a populated payload anchor (`{ kind: "payload", path }`) so the registry can
  compute per-component coverage (`computeComponentCoverage` in
  `src/lib/curriculum-spine/registry.ts`).
- **Enforcement invariants** (all live in `node_payload_valid`, exposed to
  `curriculum_nodes` via the `curriculum_nodes_payload_check` CHECK): root
  manifests must be exactly-intent/content/learning_teaching/assessment; a
  non-root type may never be a top-level document; payloads must satisfy the
  registered JSON Schema; writes to `curriculum_nodes`/`node_types` are
  super-admin-only (RLS).
- **Demo standards** are seeded idempotently by root `code`
  (`npm run db:seed:standards`): `KFZ-MECH-2020` (Germany,
  `occupation_framework`), `KNEC-KISW-CBC` (Kenya Kiswahili,
  `language_syllabus`), `NCAD-TRANS-01` (Ireland, `translation_programme`) —
  each resolving 4/4 component coverage.

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
