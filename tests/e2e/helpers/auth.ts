import { expect, type Page } from "@playwright/test";

/** Signs in through the real login form and waits until the app leaves it. */
export async function signIn(
  page: Page,
  user: { email: string; password: string },
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30_000,
  });
}

/** Consumes the seeded invitation code by creating a brand-new account. */
export async function signUpWithInvitationCode(
  page: Page,
  input: {
    email: string;
    password: string;
    fullName: string;
    invitationCode: string;
  },
): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Email").fill(input.email);
  await page.getByLabel("Password").fill(input.password);
  await page.getByLabel("Full name").fill(input.fullName);
  await page.getByLabel("Invitation code").fill(input.invitationCode);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
}

export async function expectOnLoginPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Email")).toBeVisible();
}
