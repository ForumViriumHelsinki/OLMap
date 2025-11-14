import { test, expect } from "@playwright/test";

/**
 * Login test for OLMap
 *
 * To run these tests, set the following environment variables:
 * - ADMIN_USERNAME: The admin username (default: 'admin')
 * - ADMIN_PASSWORD: The admin password (default: 'admin')
 *
 * Example:
 * ADMIN_USERNAME=admin ADMIN_PASSWORD=password npx playwright test e2e/login.spec.ts
 */

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

test.describe("Login", () => {
  test("should display login form elements", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/.*#\/login\//);

    // Verify username field is present
    const usernameField = page.locator('input[name="username"]');
    await expect(usernameField).toBeVisible();

    // Verify password field is present
    const passwordField = page.locator('input[name="password"]');
    await expect(passwordField).toBeVisible();

    // Verify submit button is present
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText("Submit");

    // Verify forgot password link is present
    const forgotPasswordLink = page.locator("text=Forgot password?");
    await expect(forgotPasswordLink).toBeVisible();
  });

  test("should login with admin credentials", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/.*#\/login\//);

    // Fill in the username
    const usernameField = page.locator('input[name="username"]');
    await usernameField.fill(ADMIN_USERNAME);

    // Fill in the password
    const passwordField = page.locator('input[name="password"]');
    await passwordField.fill(ADMIN_PASSWORD);

    // Click the submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for navigation or success indicator
    // This will need to be adjusted based on actual post-login behavior
    // For now, we'll check that we're no longer on the login page
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10000,
    });

    // Verify we're logged in by checking for elements that only appear when authenticated
    // This assertion will need to be customized based on your app's post-login UI
    await expect(page).not.toHaveURL(/.*login.*/);
  });

  test("should show error message on invalid credentials", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/.*#\/login\//);

    // Fill in invalid credentials
    await page.locator('input[name="username"]').fill("invalid_user");
    await page.locator('input[name="password"]').fill("invalid_password");

    // Click submit
    await page.locator('button[type="submit"]').click();

    // Wait a moment for the error to appear
    await page.waitForTimeout(1000);

    // Verify error message is displayed
    const errorAlert = page.locator("text=Login failed. Please try again.");
    await expect(errorAlert).toBeVisible();
  });

  test("should toggle between login and register modes", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/.*#\/login\//);

    // Initially should be in login mode
    await expect(page.locator("text=Sign in").first()).toBeVisible();

    // Click Register button to switch modes
    const registerButton = page.locator('button:has-text("Register")');
    await registerButton.click();

    // Verify we're now in register mode
    await expect(page.locator("text=Register").first()).toBeVisible();

    // Click Sign in button to switch back
    const signInButton = page.locator('button:has-text("Sign in")');
    await signInButton.click();

    // Verify we're back in login mode
    await expect(page.locator("text=Sign in").first()).toBeVisible();
  });
});
