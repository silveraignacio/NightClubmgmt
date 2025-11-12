import { test, expect } from '@playwright/test';

test.describe('Homepage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Club Nightlife/);
  });

  test('should display main hero section', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Transform Your Nightclub');
    await expect(page.locator('text=Operations Overnight')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await expect(page.locator('text=Club Nightlife')).toBeVisible();
    await expect(page.locator('a[href="#features"]')).toBeVisible();
    await expect(page.locator('a[href="#pricing"]')).toBeVisible();
    await expect(page.locator('a[href="#faq"]')).toBeVisible();
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('should display key statistics', async ({ page }) => {
    await expect(page.locator('text=500+')).toBeVisible(); // Clubs
    await expect(page.locator('text=100K+')).toBeVisible(); // Members
    await expect(page.locator('text=1M+')).toBeVisible(); // Check-ins
  });

  test('should display features section', async ({ page }) => {
    await expect(page.locator('text=QR Code Check-ins')).toBeVisible();
    await expect(page.locator('text=Loyalty Rewards')).toBeVisible();
    await expect(page.locator('text=Real-time Analytics')).toBeVisible();
  });

  test('should display pricing section', async ({ page }) => {
    await expect(page.locator('text=Simple, Transparent')).toBeVisible();
    await expect(page.locator('text=$49')).toBeVisible(); // Basic plan
    await expect(page.locator('text=$149')).toBeVisible(); // Pro plan
    await expect(page.locator('text=$349')).toBeVisible(); // Premium plan
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('a[href="/login"]');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('a[href="/register-club"]');
    await page.waitForURL('**/register-club');
    await expect(page).toHaveURL(/.*register-club/);
  });

  test('should have working CTA buttons', async ({ page }) => {
    const ctaButton = page.locator('a[href="/register-club"]').first();
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toContainText('Start Free Trial');
  });

  test('should scroll to features section', async ({ page }) => {
    await page.click('a[href="#features"]');
    await page.waitForTimeout(500);
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();
  });

  test('should scroll to pricing section', async ({ page }) => {
    await page.click('a[href="#pricing"]');
    await page.waitForTimeout(500);
    const pricingSection = page.locator('#pricing');
    await expect(pricingSection).toBeVisible();
  });
});
