import { expect, test } from "@playwright/test";

import { signIn } from "./helpers/auth";
import { PRIMARY_MATHEMATICS, SEEDED_USERS } from "./helpers/seed";

test.describe("S-5 — Space membership management", () => {
  test("the space admin sees every member with their in-space role", async ({
    page,
  }) => {
    await signIn(page, SEEDED_USERS.spaceAdmin);
    await page.goto(`/spaces/${PRIMARY_MATHEMATICS.slug}/members`);

    await expect(
      page.getByRole("heading", {
        name: `${PRIMARY_MATHEMATICS.name} Members`,
      }),
    ).toBeVisible();

    const alex = page.locator("li").filter({ hasText: "Alex Learner" });
    await expect(alex).toBeVisible();
    await expect(alex.getByText("learner", { exact: true })).toBeVisible();

    const admin = page.locator("li").filter({ hasText: "Space Admin" });
    await expect(admin).toBeVisible();
    await expect(admin.getByText("admin", { exact: true })).toBeVisible();
  });

  test("a learner cannot open the membership management page", async ({
    page,
  }) => {
    await signIn(page, SEEDED_USERS.learner);
    await page.goto(`/spaces/${PRIMARY_MATHEMATICS.slug}/members`);

    // The page redirects to `/`, which resolves to the learner's own space.
    await page.waitForURL(/\/spaces\/primary-mathematics$/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", {
        name: `${PRIMARY_MATHEMATICS.name} Members`,
      }),
    ).toHaveCount(0);
  });
});
