# Definition of Done (DoD)

Every backlog item, story, or task must satisfy all of the following before it
can be called done and merged.

The tiers are ordered. **If a Tier 1 item fails, the work is not done** — no
amount of green tooling compensates for a user outcome that does not exist.

## Tier 1 — User outcome (blocking, cannot be waived)

- [ ] The story has acceptance criteria written as observable user capabilities:
      who acts, what they do, and what they can see afterwards. Example: "A
      learner redeems `MATHLAB` and lands on the space page with themselves in
      the roster."
- [ ] The outcome is demonstrated through the real UI, from the same entry point
      a user uses, with seeded accounts and default text size. API, `curl`, or
      SQL checks do not count as the demonstration.
- [ ] The happy path works and at least one meaningful non-happy path (permission
      denied, invalid input, or empty state) behaves as specified.
- [ ] At least one automated regression test encodes the outcome (see Tier 2).

## Tier 2 — Regression protection (blocking)

- [ ] The regression test lives in `tests/e2e/` and runs with
      `npm run test:e2e`.
- [ ] Bug fixes: the test fails on the pre-fix behaviour. New behaviour: the
      test covers the new path and would fail if that path were removed.
- [ ] The test title or `describe` block names the backlog ID (e.g. `S-3 …`) so
      the capability is traceable back to the story.
- [ ] The suite is green against a fresh `db:reset` + `db:seed:standards`
      database.

## Tier 3 — Engineering gates (blocking)

### Code

- [ ] Feature works locally end-to-end (not just "compiles").
- [ ] `npm run lint` passes with no errors.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` produces a clean production build.

### Data & security

- [ ] Any schema change has a migration in `supabase/migrations/`.
- [ ] `npm run db:reset` applies cleanly from scratch (fresh clone works).
- [ ] New tables have RLS enabled, explicit `GRANT`s, and row-level policies.
- [ ] RLS is verified with both a positive and a negative access test.
- [ ] `npm run db:types` run and the generated types are committed.
- [ ] No secrets, keys, or personal data leaked into the repo or logs.

### UI/UX

- [ ] Keyboard navigable and readable at default text size; no axe-visible
      contrast failures.
- [ ] Sensible empty, loading, and error states (no dead screens).
- [ ] Uses shadcn/ui components rather than custom duplicates.

### Docs & hygiene

- [ ] Backlog item marked done in `SPRINT_PLAN.md` (or the sprint's board).
- [ ] Acceptance criteria recorded on the backlog item.
- [ ] README / docs updated if setup, commands, or conventions changed.
- [ ] No commented-out code or leftover debug logging.

## Exceptions

- Engineering exceptions (Tier 3) may be agreed by the author and reviewer in
  the PR description.
- **Tier 1 and Tier 2 cannot be waived.** If the acceptance criteria cannot be
  met, the story is renegotiated at sprint planning — not at review.
