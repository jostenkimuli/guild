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
| Content | — | new `content` table (Sprint 2) |
| Challenge | — | returns as redesigned table (Sprint 5) |
| Project | — | returns as redesigned table (Sprint 6) |

### Approval chain (Sprint 2)

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
