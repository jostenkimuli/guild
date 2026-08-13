# Product Backlog

## Vision

TheGuild is a macro-level educational ecosystem where large-scale virtual
communities organize around real-world problems, form project guilds, and ship
solutions together. Each community is a learning organization: members grow
skills by working on things that matter outside the classroom.

### North-star outcome

> A community can discover a real problem, spin up a project, organize
> contributors, and track progress — without leaving TheGuild.

### MVP loop (the thing we optimize for)

`join community → read problems → form/join a project → do the work → see
progress` — every feature must feed this loop or wait.

## Backlog format

Each item: `ID — title — user story (As a…, I want…, so that…) — size (S/M/L) —
priority (P0/P1/P2)`.

- **P0**: blocks the MVP loop.
- **P1**: strengthens the MVP loop.
- **P2**: nice to have; keep out of sprint unless sprint goal is met.

---

## Epic 1 — Communities (P0)

- **C-1** — Create a community — As a learner, I want to create a community
  with a name, slug, and mission, so that I can gather people around a problem
  space. (S, P0)
- **C-2** — Browse communities — As a visitor, I want to see a directory of
  public communities, so that I can find one worth joining. (S, P0)
- **C-3** — Join a community — As a signed-in user, I want to join a community
  with one click, so that I become a member and see its problems. (S, P0)
- **C-4** — Member roles — As an owner, I want to promote members to admin and
  remove members, so that the community stays healthy and safe. (M, P1)
- **C-5** — Community page — As a member, I want a community home page with its
  mission, member count, and recent problems, so that I can orient quickly.
  (M, P0)
- **C-6** — Community settings — As an owner, I want to edit name/mission and
  manage slugs, so that the community stays current. (S, P2)

## Epic 2 — Problems (P0)

- **P-1** — Report a problem — As a member, I want to submit a real-world
  problem with a title and description, so that the community can tackle it.
  (S, P0)
- **P-2** — Problem board — As a member, I want to see the community's problem
  board with status, so that I can pick something to work on. (M, P0)
- **P-3** — Problem detail — As a member, I want to open a problem and see its
  projects, so that I can decide where to contribute. (M, P1)
- **P-4** — Problem lifecycle — As a member, I want to move a problem through
  open → in_progress → solved → archived, so that everyone knows where it
  stands. (M, P1)

## Epic 3 — Projects (P0)

- **PR-1** — Start a project — As a member, I want to create a project tied to
  a problem, so that work has a home. (S, P0)
- **PR-2** — Project detail — As a member, I want to see a project's summary,
  status, and contributors, so that I can understand and join the work. (M, P0)
- **PR-3** — Project status — As a member, I want to update a project status
  (active/paused/completed/archived), so that progress is visible. (S, P1)
- **PR-4** — Contributor list — As a member, I want projects to list their
  contributors, so that credit and learning are visible. (M, P1)

## Epic 4 — Membership & profiles (P1)

- **M-1** — Profile page — As a user, I want a profile with my display name,
  bio, and communities, so that people know who I am. (M, P1)
- **M-2** — Edit profile — As a user, I want to edit my profile, so that it
  stays accurate. (S, P1)
- **M-3** — My communities — As a user, I want a dashboard listing the
  communities I belong to, so that I can return to my work. (M, P0 — dashboard
  exists in scaffold, needs real data wiring)

## Epic 5 — Scale mechanics (P2, the "macro" part)

- **S-1** — Skills & badges — As a member, I want contributions to earn skill
  marks, so that learning is visible. (L, P2)
- **S-2** — Community analytics — As an owner, I want member/activity counts,
  so that I can grow the community. (L, P2)
- **S-3** — Cross-community federation — As a member, I want communities to
  share solved problems and playbooks, so that solutions scale beyond one
  community. (L, P2)
- **S-4** — Impact reporting — As a member, I want to see the real-world
  outcomes of problems we solved, so that the mission stays concrete. (M, P2)

---

## Notes for sprint planning

- Sprint 0 (this one) = scaffold: stack, auth, schema, CI-able build, agile
  docs. Nothing in the backlog is committed until Sprint 1.
- Sprint 1 target: complete the MVP loop with C-1, C-2, C-3, P-1, P-2, PR-1,
  PR-2, M-3 (roughly 2–3 pair-weeks of work; trim with the owner before
  committing).
