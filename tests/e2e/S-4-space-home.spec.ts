import { expect, test } from "@playwright/test";

import { expectOnLoginPage, signIn } from "./helpers/auth";
import { PRIMARY_MATHEMATICS, SEEDED_USERS } from "./helpers/seed";

test.describe("S-4 — Space home page", () => {
  test("a member lands on the space page and sees the roster", async ({
    page,
  }) => {
    await signIn(page, SEEDED_USERS.learner);

    // `/` redirects members to their space.
    await page.waitForURL(/\/spaces\/primary-mathematics$/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: PRIMARY_MATHEMATICS.name }),
    ).toBeVisible();

    const roster = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Members" }) });
    await expect(roster.getByText("Alex Learner")).toBeVisible();
    await expect(roster.getByText("Space Admin")).toBeVisible();

    const alex = roster.locator("li").filter({ hasText: "Alex Learner" });
    await expect(alex.getByText("learner", { exact: true })).toBeVisible();

    // Staff-only controls stay hidden from learners.
    await expect(
      page.getByRole("button", { name: "Request space edit" }),
    ).toHaveCount(0);
  });

  test("a signed-out visitor is sent to the login page", async ({ page }) => {
    await page.goto(`/spaces/${PRIMARY_MATHEMATICS.slug}`);
    await expectOnLoginPage(page);
  });
});
