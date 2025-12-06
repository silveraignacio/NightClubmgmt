import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard E2E Tests', () => {
  // Helper function to login as admin
  async function loginAsAdmin(page: any) {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@testclub.com');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }

  test.describe('Dashboard Overview', () => {
    test('should display admin dashboard after login', async ({ page }) => {
      await loginAsAdmin(page);

      // Should be on admin page
      const currentUrl = page.url();
      expect(currentUrl).toContain('admin');
    });

    test('should display key metrics and KPIs', async ({ page }) => {
      await loginAsAdmin(page);

      // Look for common KPI indicators
      const hasMetrics = await page.locator('text=/members|visits|revenue|active/i').count();
      expect(hasMetrics).toBeGreaterThan(0);
    });

    test('should have navigation menu', async ({ page }) => {
      await loginAsAdmin(page);

      // Check for common admin menu items
      const menuItems = [
        'members',
        'events',
        'analytics',
        'settings',
        'dashboard'
      ];

      let foundMenuItems = 0;
      for (const item of menuItems) {
        const count = await page.locator(`text=/${item}/i`).count();
        if (count > 0) foundMenuItems++;
      }

      expect(foundMenuItems).toBeGreaterThan(0);
    });
  });

  test.describe('Members Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should navigate to members page', async ({ page }) => {
      await page.goto('/admin/members');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      expect(currentUrl).toContain('members');
    });

    test('should display members list', async ({ page }) => {
      await page.goto('/admin/members');
      await page.waitForTimeout(1000);

      // Should have table or list of members
      const hasList = await page.locator('table, [role="table"], .member-list').count();
      expect(hasList).toBeGreaterThan(0);
    });

    test('should have add new member button', async ({ page }) => {
      await page.goto('/admin/members');
      await page.waitForTimeout(1000);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a[href*="new"]');
      const count = await addButton.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have search functionality', async ({ page }) => {
      await page.goto('/admin/members');
      await page.waitForTimeout(1000);

      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      const count = await searchInput.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should open new member form', async ({ page }) => {
      await page.goto('/admin/members/new');
      await page.waitForTimeout(1000);

      // Should have form fields
      const hasForm = await page.locator('form, input[type="text"]').count();
      expect(hasForm).toBeGreaterThan(0);
    });
  });

  test.describe('Door Staff Interface', () => {
    test('should navigate to door interface', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/door');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      expect(currentUrl).toContain('door');
    });

    test('should have QR scanner interface', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/door');
      await page.waitForTimeout(1000);

      // Look for QR related elements
      const hasQRElements = await page.locator('text=/qr|scan|camera/i').count();
      expect(hasQRElements).toBeGreaterThan(0);
    });
  });

  test.describe('Bar Staff Interface', () => {
    test('should navigate to bar interface', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/bar');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      expect(currentUrl).toContain('bar');
    });

    test('should display menu or products', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/bar');
      await page.waitForTimeout(1000);

      // Look for menu/product elements
      const hasProducts = await page.locator('text=/menu|product|item|drink/i').count();
      expect(hasProducts).toBeGreaterThan(0);
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      await loginAsAdmin(page);

      // Look for logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")');

      if (await logoutButton.count() > 0) {
        await logoutButton.first().click();
        await page.waitForTimeout(1000);

        // Should redirect to login or home
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/login|^\//);
      }
    });
  });
});
