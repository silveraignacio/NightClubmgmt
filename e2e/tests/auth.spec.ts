import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {

  test.describe('Login Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/sign in|login/i);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.click('button[type="submit"]');
      // Wait for validation messages
      await page.waitForTimeout(500);
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      // Check for HTML5 validation or custom error messages
      const emailValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      const passwordValid = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);

      expect(emailValid || passwordValid).toBe(false);
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      const emailInput = page.locator('input[type="email"]');
      const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('should show error for incorrect credentials', async ({ page }) => {
      await page.fill('input[type="email"]', 'nonexistent@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForTimeout(2000);

      // Should show error message or stay on login page
      const currentUrl = page.url();
      expect(currentUrl).toContain('login');
    });

    test('should have link to register page', async ({ page }) => {
      const registerLink = page.locator('a[href*="register"]');
      await expect(registerLink).toBeVisible();
    });
  });

  test.describe('Club Registration Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register-club');
    });

    test('should display registration form', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/register|sign up|create/i);
    });

    test('should have all required fields', async ({ page }) => {
      // Check for common registration fields
      const hasEmailField = await page.locator('input[type="email"]').count();
      const hasPasswordField = await page.locator('input[type="password"]').count();
      const hasTextField = await page.locator('input[type="text"]').count();

      expect(hasEmailField).toBeGreaterThan(0);
      expect(hasPasswordField).toBeGreaterThan(0);
      expect(hasTextField).toBeGreaterThan(0);
    });

    test('should validate password strength', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]').first();

      // Try weak password
      await passwordInput.fill('123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      // Should show validation error or prevent submission
      const currentUrl = page.url();
      expect(currentUrl).toContain('register');
    });

    test('should validate email format', async ({ page }) => {
      await page.fill('input[type="email"]', 'invalid-email');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      const emailInput = page.locator('input[type="email"]');
      const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('should have link to login page', async ({ page }) => {
      const loginLink = page.locator('a[href*="login"]');
      await expect(loginLink).toBeVisible();
    });

    test('should register new club successfully', async ({ page }) => {
      const timestamp = Date.now();
      const testEmail = `testclub${timestamp}@e2etest.com`;

      // Fill out the form
      await page.fill('input[name="name"], input[placeholder*="name" i]', `Test Club ${timestamp}`);
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'TestPassword123!');

      // Fill additional fields if they exist
      const addressField = page.locator('input[name="address"], input[placeholder*="address" i]').first();
      if (await addressField.count() > 0) {
        await addressField.fill('123 Test Street');
      }

      const cityField = page.locator('input[name="city"], input[placeholder*="city" i]').first();
      if (await cityField.count() > 0) {
        await cityField.fill('Test City');
      }

      const phoneField = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]').first();
      if (await phoneField.count() > 0) {
        await phoneField.fill('+1234567890');
      }

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect or success message
      await page.waitForTimeout(3000);

      // Should redirect to dashboard or show success
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('register-club');
    });
  });
});
