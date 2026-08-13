# Definition of Done (DoD)

Every backlog item, story, or task must satisfy all of the following before it
can be called done and merged. If the checklist does not fit the item, the
reviewer and author agree on the exceptions in the PR description.

## Code

- [ ] Feature works locally end-to-end (not just "compiles").
- [ ] `npm run lint` passes with no errors.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` produces a clean production build.

## Data & security

- [ ] Any schema change has a migration in `supabase/migrations/`.
- [ ] `npm run db:reset` applies cleanly from scratch (fresh clone works).
- [ ] New tables have RLS enabled, explicit `GRANT`s, and row-level policies.
- [ ] RLS is verified with both a positive and a negative access test.
- [ ] `npm run db:types` run and the generated types are committed.
- [ ] No secrets, keys, or personal data leaked into the repo or logs.

## UI/UX

- [ ] Meets the acceptance criteria of the user story.
- [ ] Keyboard navigable and readable at default text size; no axe-visible
      contrast failures.
- [ ] Sensible empty, loading, and error states (no dead screens).
- [ ] Uses shadcn/ui components rather than custom duplicates.

## Docs & hygiene

- [ ] Backlog item marked done in `SPRINT_PLAN.md` (or the sprint's board).
- [ ] README / docs updated if setup, commands, or conventions changed.
- [ ] No commented-out code or leftover debug logging.
