import { test, expect } from '@playwright/test';

/**
 * E2E tests for user authentication flows
 */
test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full signup flow', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup');

    // Fill in signup form
    const timestamp = Date.now();
    await page.fill('input[id="username"]', `testuser${timestamp}`);
    await page.fill('input[id="email"]', `test${timestamp}@example.com`);
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.fill('input[id="confirmPassword"]', 'TestPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=Welcome Back')).toBeVisible();
  });

  test('should show error for weak password during signup', async ({ page }) => {
    await page.goto('/signup');

    const timestamp = Date.now();
    await page.fill('input[id="username"]', `testuser${timestamp}`);
    await page.fill('input[id="email"]', `test${timestamp}@example.com`);
    await page.fill('input[id="password"]', 'weak');
    await page.fill('input[id="confirmPassword"]', 'weak');

    await page.click('button[type="submit"]');

    // Should show password complexity error
    await expect(page.locator('text=/Password must/i')).toBeVisible();
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/signup');

    const timestamp = Date.now();
    await page.fill('input[id="username"]', `testuser${timestamp}`);
    await page.fill('input[id="email"]', `test${timestamp}@example.com`);
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.fill('input[id="confirmPassword"]', 'DifferentPassword123!');

    await page.click('button[type="submit"]');

    // Should show password mismatch error
    await expect(page.locator('text=/Passwords don\'t match/i')).toBeVisible();
  });

  test('should complete full login flow', async ({ page }) => {
    // First create a user
    await page.goto('/signup');
    const timestamp = Date.now();
    const username = `testuser${timestamp}`;
    const email = `test${timestamp}@example.com`;
    const password = 'TestPassword123!';

    await page.fill('input[id="username"]', username);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.fill('input[id="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect to login
    await page.waitForURL(/.*login/);

    // Now login
    await page.fill('input[id="usernameOrEmail"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to tasks page
    await expect(page).toHaveURL(/.*tasks/, { timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[id="usernameOrEmail"]', 'nonexistent@example.com');
    await page.fill('input[id="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/Incorrect username or password/i')).toBeVisible();
  });

  test('should lock account after multiple failed login attempts', async ({ page }) => {
    // First create a user
    await page.goto('/signup');
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const password = 'TestPassword123!';

    await page.fill('input[id="username"]', `testuser${timestamp}`);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.fill('input[id="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*login/);

    // Attempt 5 failed logins
    for (let i = 0; i < 5; i++) {
      await page.fill('input[id="usernameOrEmail"]', email);
      await page.fill('input[id="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }

    // Should show account locked message
    await expect(page.locator('text=/locked/i')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input[id="password"]');

    // Initially should be password type
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    await page.click('button[type="button"]');

    // Should change to text type
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await page.click('button[type="button"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate between login and signup pages', async ({ page }) => {
    await page.goto('/login');

    // Click signup link
    await page.click('a[href="/signup"]');
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.locator('text=Create Your Account')).toBeVisible();

    // Click login link
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=Welcome Back')).toBeVisible();
  });
});
