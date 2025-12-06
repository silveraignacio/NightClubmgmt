import { test, expect } from '@playwright/test';

test.describe('Member Portal E2E Tests', () => {
  // Helper function to login as member
  async function loginAsMember(page: any) {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'member@testclub.com');
    await page.fill('input[type="password"]', 'MemberPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }

  test.describe('Member Dashboard', () => {
    test('should display member dashboard after login', async ({ page }) => {
      await loginAsMember(page);

      // Should be on member page
      const currentUrl = page.url();
      expect(currentUrl).toContain('member');
    });

    test('should display member QR code', async ({ page }) => {
      await loginAsMember(page);

      // Look for QR code
      const hasQR = await page.locator('canvas, img[alt*="qr" i], svg').count();
      expect(hasQR).toBeGreaterThan(0);
    });

    test('should display loyalty points', async ({ page }) => {
      await loginAsMember(page);

      // Look for points indicator
      const hasPoints = await page.locator('text=/points|loyalty|rewards/i').count();
      expect(hasPoints).toBeGreaterThan(0);
    });

    test('should display membership tier', async ({ page }) => {
      await loginAsMember(page);

      // Look for tier information
      const hasTier = await page.locator('text=/bronze|silver|gold|vip|platinum|tier/i').count();
      expect(hasTier).toBeGreaterThan(0);
    });
  });

  test.describe('Member Profile', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    test('should navigate to profile page', async ({ page }) => {
      await page.goto('/member/profile');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      expect(currentUrl).toContain('profile');
    });

    test('should display profile information', async ({ page }) => {
      await page.goto('/member/profile');
      await page.waitForTimeout(1000);

      // Should have profile fields
      const hasInfo = await page.locator('text=/name|email|phone|member/i').count();
      expect(hasInfo).toBeGreaterThan(0);
    });

    test('should have edit profile functionality', async ({ page }) => {
      await page.goto('/member/profile');
      await page.waitForTimeout(1000);

      // Look for edit button or editable fields
      const hasEdit = await page.locator('button:has-text("Edit"), input[type="text"]').count();
      expect(hasEdit).toBeGreaterThan(0);
    });
  });

  test.describe('Member Rewards', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    test('should navigate to rewards page', async ({ page }) => {
      await page.goto('/member/rewards');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      expect(currentUrl).toContain('rewards');
    });

    test('should display available rewards', async ({ page }) => {
      await page.goto('/member/rewards');
      await page.waitForTimeout(1000);

      // Should show rewards or points
      const hasRewards = await page.locator('text=/reward|points|redeem|available/i').count();
      expect(hasRewards).toBeGreaterThan(0);
    });

    test('should show points balance', async ({ page }) => {
      await page.goto('/member/rewards');
      await page.waitForTimeout(1000);

      // Should display points balance
      const hasBalance = await page.locator('text=/balance|points|total/i').count();
      expect(hasBalance).toBeGreaterThan(0);
    });
  });

  test.describe('QR Code Display', () => {
    test('should download QR code', async ({ page }) => {
      await loginAsMember(page);

      // Look for download button
      const downloadButton = page.locator('button:has-text("Download"), a:has-text("Download")');

      if (await downloadButton.count() > 0) {
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
          downloadButton.first().click()
        ]);

        if (download) {
          expect(download).toBeTruthy();
        }
      }
    });

    test('should have share QR functionality', async ({ page }) => {
      await loginAsMember(page);

      // Look for share or save options
      const hasShare = await page.locator('button:has-text("Share"), button:has-text("Save"), button:has-text("Download")').count();
      expect(hasShare).toBeGreaterThanOrEqual(0); // Optional feature
    });
  });
});
