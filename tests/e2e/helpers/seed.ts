/** Seeded identities from `supabase/seed.sql`. */
export const SEEDED_USERS = {
  superAdmin: { email: "superadmin@theguild.dev", password: "superadmin-password" },
  programAdmin: { email: "demo@theguild.dev", password: "demo-password" },
  ecosystemAdmin: { email: "ecoadmin@theguild.dev", password: "ecoadmin-password" },
  spaceAdmin: { email: "spaceadmin@theguild.dev", password: "spaceadmin-password" },
  learner: { email: "learner@theguild.dev", password: "learner-password" },
  teacher: { email: "testteacher@example.com", password: "testpass123" },
} as const;

/** The seeded space used by the regression specs. */
export const PRIMARY_MATHEMATICS = {
  name: "Primary Mathematics Space",
  slug: "primary-mathematics",
  invitationCode: "MATHLAB",
} as const;
