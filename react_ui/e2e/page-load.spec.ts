import { test, expect } from "@playwright/test";

test.describe("Page Load", () => {
  test("should load the home page successfully", async ({ page }) => {
    // Navigate to the home page (will redirect to login for unauthenticated users)
    await page.goto("/");

    // Wait for redirect to login page
    await page.waitForURL(/.*#\/login\//);

    // Verify page title contains expected text
    await expect(page).toHaveTitle(/Open Logistics Map/);

    // Verify the logo is visible
    const logo = page.locator('img[alt="logo"]');
    await expect(logo).toBeVisible();

    // Verify the heading is present
    const heading = page.locator('h3:has-text("Open Logistics Map")');
    await expect(heading).toBeVisible();

    // Verify the login form is present
    const signInText = page.locator("text=Sign in");
    await expect(signInText).toBeVisible();
  });

  test("should show login and register options", async ({ page }) => {
    // Navigate and wait for redirect to login page
    await page.goto("/");
    await page.waitForURL(/.*#\/login\//);

    // Verify Sign in text is visible
    await expect(page.locator("text=Sign in")).toBeVisible();

    // Verify Register button is visible
    const registerButton = page.locator('button:has-text("Register")');
    await expect(registerButton).toBeVisible();
  });
});
