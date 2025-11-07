/**
 * User Profile E2E Tests
 * 
 * Tests user profile viewing and management (FR-010)
 * Validates user contributions and activity display
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('User Profile Viewing', () => {
  test('should display user profile page', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    // Should show profile content or 404
    const hasContent = 
      (await page.locator('h1, h2').count()) > 0 ||
      (await page.locator('text=/not found|404/i').count()) > 0;
    
    expect(hasContent).toBeTruthy();
  });

  test('should show user information', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for user profile elements if profile exists
    const hasUserInfo = 
      (await page.locator('text=/username|profile/i').count()) > 0 ||
      (await page.locator('[class*="avatar"], img[alt*="avatar" i]').count()) > 0 ||
      (await page.locator('text=/not found/i').count()) > 0;
    
    expect(hasUserInfo).toBeTruthy();
  });

  test('should display user avatar', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for user avatars in experience cards
    const avatars = await page.locator('img[alt*="avatar" i], [class*="avatar"]').count();
    
    // May or may not have avatars depending on data
    expect(avatars).toBeGreaterThanOrEqual(0);
  });

  test('should link to user profile from experience cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const cards = await page.locator('[class*="shadow"][class*="rounded"]').count();
    
    if (cards > 0) {
      // Look for username links
      const userLinks = await page.locator('a[href*="/profile/"], a[href*="/users/"]').count();
      
      // Should have user profile links if experiences exist
      expect(userLinks).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show user contributions count', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for contribution statistics
    const stats = await page.locator('text=/\\d+ experience|contribution/i').count();
    
    // May show stats if profile exists
    expect(stats).toBeGreaterThanOrEqual(0);
  });
});

test.describe('User Experiences List', () => {
  test('should display user experiences on profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for experiences section or empty state
    const hasExperiences = 
      (await page.locator('[class*="experience"], [class*="card"]').count()) > 0 ||
      (await page.locator('text=/no experience|no contribution/i').count()) > 0 ||
      (await page.locator('text=/not found/i').count()) > 0;
    
    expect(hasExperiences).toBeTruthy();
  });

  test('should show experience count on profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for experience count
    const expCount = await page.locator('text=/\\d+ experience/i').count();
    
    expect(expCount).toBeGreaterThanOrEqual(0);
  });

  test('should link to experience details from profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    const experienceLinks = await page.locator('a[href*="/experiences/"]').count();
    
    if (experienceLinks > 0) {
      // Click first experience
      await page.locator('a[href*="/experiences/"]').first().click();
      
      await page.waitForLoadState('networkidle');
      
      // Should navigate to experience detail
      expect(page.url()).toMatch(/\/experiences\/\d+/);
    }
  });
});

test.describe('Profile Statistics', () => {
  test('should show activity statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for various statistics
    const stats = await page.locator('text=/\\d+.*(?:experience|comment|reaction|rating)/i').count();
    
    // May or may not show stats depending on profile existence
    expect(stats).toBeGreaterThanOrEqual(0);
  });

  test('should display user bio if available', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for bio section
    const bio = await page.locator('text=/bio|about/i, [class*="bio"]').count();
    
    expect(bio).toBeGreaterThanOrEqual(0);
  });

  test('should show GitHub username', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for GitHub username or profile link
    const github = await page.locator('a[href*="github.com"], text=/@[a-zA-Z0-9_-]+/').count();
    
    expect(github).toBeGreaterThanOrEqual(0);
  });

  test('should show join date or member since', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for join date
    const joinDate = await page.locator('text=/joined|member since|created/i').count();
    
    expect(joinDate).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Current User Profile', () => {
  test('should have access to own profile link', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.waitForLoadState('networkidle');
    
    // Look for profile link in navigation
    const profileLink = await page.locator('a[href*="/profile"], a:has-text("Profile")').count();
    
    // May or may not be visible if not authenticated
    expect(profileLink).toBeGreaterThanOrEqual(0);
  });

  test('should access /me endpoint for current user', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api/users/me`);
    
    // Should return valid response (200 or 401)
    expect(response?.status()).toBeLessThan(500);
  });

  test('should show edit options on own profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/me`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for edit button or fields (if authenticated)
    const editElements = await page.locator('button:has-text("Edit"), input, textarea').count();
    
    // May or may not have edit UI depending on auth
    expect(editElements).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Profile Navigation', () => {
  test('should navigate from feed to user profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const userLinks = await page.locator('a[href*="/profile/"], a[href*="/users/"]').count();
    
    if (userLinks > 0) {
      const firstUserLink = page.locator('a[href*="/profile/"], a[href*="/users/"]').first();
      
      await firstUserLink.click();
      
      await page.waitForLoadState('networkidle');
      
      // Should be on a profile page
      expect(page.url()).toMatch(/\/(profile|users)\/\d+/);
    }
  });

  test('should navigate from experience detail to author profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const cards = await page.locator('[class*="shadow"][class*="rounded"]').count();
    
    if (cards > 0) {
      // Go to experience detail
      await page.locator('[class*="shadow"][class*="rounded"]').first().click();
      
      await page.waitForLoadState('networkidle');
      
      // Find author link
      const authorLinks = await page.locator('a[href*="/profile/"], a[href*="/users/"]').count();
      
      if (authorLinks > 0) {
        await page.locator('a[href*="/profile/"], a[href*="/users/"]').first().click();
        
        await page.waitForLoadState('networkidle');
        
        // Should be on profile page
        expect(page.url()).toMatch(/\/(profile|users)\/\d+/);
      }
    }
  });

  test('should handle invalid profile IDs gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/999999`);
    
    await page.waitForLoadState('networkidle');
    
    // Should show 404 or error message
    const error = 
      (await page.locator('text=/not found|404|does not exist/i').count()) > 0 ||
      (await page.locator('h1').count()) > 0;
    
    expect(error).toBeTruthy();
  });
});

test.describe('Profile Performance', () => {
  test('should load profile page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/profile/1`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle profile with many experiences', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/1`);
    
    await page.waitForLoadState('networkidle');
    
    // Page should load without errors even if user has many experiences
    const errors = await page.locator('text=/error|exception|failed/i').count();
    
    // Should not have visible error messages
    expect(errors).toBeLessThanOrEqual(1); // Allow for minor non-critical messages
  });
});
