import { expect, test } from "@playwright/test";

import { signUpWithInvitationCode } from "./helpers/auth";
import { PRIMARY_MATHEMATICS } from "./helpers/seed";

test.describe("S-3 — Join a space with an invitation code", () => {
  test("a visitor with a valid code becomes a member of the space", async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = `e2e-learner-${stamp}@theguild.test`;
    const fullName = `E2E Learner ${stamp}`;

    await signUpWithInvitationCode(page, {
      email,
      password: "e2e-password",
      fullName,
      invitationCode: PRIMARY_MATHEMATICS.invitationCode,
    });

    // New members land on their space, with themselves in the roster.
    await page.waitForURL(/\/spaces\/primary-mathematics$/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: PRIMARY_MATHEMATICS.name }),
    ).toBeVisible();

    const newMember = page.locator("li").filter({ hasText: fullName });
    await expect(newMember).toBeVisible();
    await expect(newMember.getByText("learner", { exact: true })).toBeVisible();
  });

  test("an invalid code is rejected and no account is created", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email").fill(`e2e-bad-${Date.now()}@theguild.test`);
    await page.getByLabel("Password").fill("e2e-password");
    await page.getByLabel("Full name").fill("E2E Invalid Code");
    await page.getByLabel("Invitation code").fill("NOTACODE");
    await page.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(
      page.getByText("That invitation code is invalid or has expired."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
