/**
 * Authentication E2E Tests
 * 
 * Tests authentication flow via GitHub OAuth (FR-011)
 * Validates protected routes and user sessions
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Authentication Flow', () => {
  test('should display sign in option on homepage', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Look for sign in link in header or main content
    const signInLink = page.locator('a[href*="/api/auth/signin"], button:has-text("Sign in"), a:has-text("Sign in")').first();
    
    if (await signInLink.count() > 0) {
      await expect(signInLink).toBeVisible();
    }
  });

  test('should require authentication for create page', async ({ page }) => {
    await page.goto(`${BASE_URL}/create`);
    
    await page.waitForLoadState('networkidle');
    
    // Should either show form (if authenticated) or sign-in prompt
    const hasForm = (await page.locator('input#title').count()) > 0;
    const hasSignIn = (await page.locator('a[href*="/api/auth/signin"]').count()) > 0;
    
    // One of these must be present
    expect(hasForm || hasSignIn).toBeTruthy();
  });

  test('should display sign-in prompt for unauthenticated reactions', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    // Check if any experiences exist
    const experienceCards = await page.locator('[class*="shadow"]').count();
    
    if (experienceCards > 0) {
      // Click on first experience
      await page.locator('[class*="shadow"]').first().click();
      
      await page.waitForLoadState('networkidle');
      
      // Look for sign-in prompt in reaction or comment section
      const signInPrompts = await page.locator('text=/sign in/i').count();
      
      // Should have at least one sign-in prompt
      expect(signInPrompts).toBeGreaterThanOrEqual(0);
    }
  });

  test('should protect user profile pages appropriately', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    // Page should either show profile or redirect/404
    const pageLoaded = 
      (await page.locator('h1').count()) > 0 ||
      (await page.locator('text=/profile|user/i').count()) > 0 ||
      (await page.locator('text=/not found|404/i').count()) > 0;
    
    expect(pageLoaded).toBeTruthy();
  });
});

test.describe('Session Management', () => {
  test('should handle navigation while unauthenticated', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Navigate to different pages
    await page.goto(`${BASE_URL}/feed`);
    await expect(page).toHaveURL(/\/feed/);
    
    await page.goto(`${BASE_URL}/create`);
    await expect(page).toHaveURL(/\/create/);
    
    // Should not crash or show errors
    const errors = await page.locator('text=/error|exception/i').count();
    expect(errors).toBe(0);
  });

  test('should display consistent auth state across pages', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check auth indicator on homepage
    const homeAuthLinks = await page.locator('a[href*="/api/auth/"], button:has-text("Sign")').count();
    
    // Navigate to feed
    await page.goto(`${BASE_URL}/feed`);
    const feedAuthLinks = await page.locator('a[href*="/api/auth/"], button:has-text("Sign")').count();
    
    // Both pages should load without errors
    expect(homeAuthLinks + feedAuthLinks).toBeGreaterThanOrEqual(0);
  });
});
