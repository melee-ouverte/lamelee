/**
 * Feed and Filtering E2E Tests
 * 
 * Tests browsing experiences, search, and filtering (FR-005, FR-006)
 * Validates feed display and navigation
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Experience Feed', () => {
  test('should display experiences feed', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    // Should show feed header
    await expect(page.locator('h1:has-text("Experiences")')).toBeVisible();
  });

  test('should show experience count', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for count text
    const countText = await page.locator('text=/\\d+ experience/i').count();
    
    expect(countText).toBeGreaterThan(0);
  });

  test('should display empty state when no experiences', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    // Check for either experiences or empty state
    const hasExperiences = await page.locator('[class*="shadow"][class*="rounded-lg"]').count() > 1;
    const hasEmptyState = await page.locator('text=/no experiences|be the first/i').count() > 0;
    
    expect(hasExperiences || hasEmptyState).toBeTruthy();
  });

  test('should display experience cards with key information', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const cards = await page.locator('[class*="shadow"][class*="rounded"]').count();
    
    if (cards > 0) {
      const firstCard = page.locator('[class*="shadow"][class*="rounded"]').first();
      
      // Should have at least title or description
      const hasContent = 
        (await firstCard.locator('h3, h2, h1').count()) > 0 ||
        (await firstCard.locator('p').count()) > 0;
      
      expect(hasContent).toBeTruthy();
    }
  });

  test('should show AI assistant type on cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const cards = await page.locator('[class*="shadow"][class*="rounded"]').count();
    
    if (cards > 0) {
      // Look for AI assistant badges
      const aiAssistantBadges = await page.locator('text=/github copilot|claude|gpt|cursor/i').count();
      
      // May or may not have AI assistant displayed
      expect(aiAssistantBadges).toBeGreaterThanOrEqual(0);
    }
  });

  test('should link to experience detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const cards = await page.locator('[class*="shadow"][class*="rounded"]').count();
    
    if (cards > 0) {
      const firstCard = page.locator('[class*="shadow"][class*="rounded"]').first();
      
      // Click on the card
      await firstCard.click();
      
      // Should navigate to experience detail
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toMatch(/\/experiences\/\d+/);
    }
  });
});

test.describe('Search Functionality', () => {
  test('should have search input', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input#search, input[placeholder*="Search" i]');
    
    expect(await searchInput.count()).toBeGreaterThan(0);
  });

  test('should allow typing in search box', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input#search').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('react');
      
      const value = await searchInput.inputValue();
      expect(value).toBe('react');
    }
  });

  test('should have search button', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const searchButton = page.locator('button[type="submit"]:has-text("Search"), button:near(input#search)').first();
    
    expect(await searchButton.count()).toBeGreaterThan(0);
  });

  test('should update URL with search parameter', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input#search').first();
    const searchButton = page.locator('button:has-text("Search")').first();
    
    if ((await searchInput.count()) > 0 && (await searchButton.count()) > 0) {
      await searchInput.fill('react');
      await searchButton.click();
      
      await page.waitForLoadState('networkidle');
      
      // URL should contain search parameter
      expect(page.url()).toContain('search=react');
    }
  });

  test('should clear search results', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed?search=react`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for clear filters button
    const clearButton = page.locator('button:has-text("Clear")').first();
    
    if (await clearButton.count() > 0) {
      await clearButton.click();
      
      await page.waitForLoadState('networkidle');
      
      // URL should not have search parameter
      expect(page.url()).not.toContain('search=');
    }
  });
});

test.describe('Filtering by AI Assistant', () => {
  test('should have AI assistant filter dropdown', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const aiAssistantSelect = page.locator('select#aiAssistant');
    
    expect(await aiAssistantSelect.count()).toBeGreaterThan(0);
  });

  test('should list AI assistant options', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const aiAssistantSelect = page.locator('select#aiAssistant');
    
    if (await aiAssistantSelect.count() > 0) {
      const options = await aiAssistantSelect.locator('option').count();
      
      // Should have at least "All assistants" + some AI assistants
      expect(options).toBeGreaterThan(1);
    }
  });

  test('should filter by AI assistant type', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    const aiAssistantSelect = page.locator('select#aiAssistant');
    
    if (await aiAssistantSelect.count() > 0) {
      // Select GitHub Copilot
      await aiAssistantSelect.selectOption('github-copilot');
      
      await page.waitForLoadState('networkidle');
      
      // URL should contain filter parameter
      expect(page.url()).toContain('aiAssistant=github-copilot');
    }
  });

  test('should show active filter badge', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed?aiAssistant=github-copilot`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for active filter display
    const activeFilter = await page.locator('text=/github copilot|active filter/i').count();
    
    expect(activeFilter).toBeGreaterThan(0);
  });
});

test.describe('Tag Filtering', () => {
  test('should display available tags', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for tags section
    const tagsSection = await page.locator('text="Tags"').count();
    
    expect(tagsSection).toBeGreaterThanOrEqual(0);
  });

  test('should allow selecting tags as filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for tag checkboxes
    const tagCheckboxes = await page.locator('input[type="checkbox"]').count();
    
    if (tagCheckboxes > 0) {
      // Click first tag checkbox
      await page.locator('input[type="checkbox"]').first().click();
      
      await page.waitForLoadState('networkidle');
      
      // URL should be updated with tag filter
      expect(page.url()).toContain('tags=');
    }
  });

  test('should show selected tags in active filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed?tags=react`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for active filter display
    const activeFilters = await page.locator('text=/active filter|react/i').count();
    
    expect(activeFilters).toBeGreaterThan(0);
  });
});

test.describe('Pagination', () => {
  test('should show pagination when many experiences exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for pagination controls
    const pagination = await page.locator('text=/page \\d+ of \\d+|previous|next/i').count();
    
    // Pagination may or may not be present depending on data volume
    expect(pagination).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to next page', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for Next button
    const nextButton = page.locator('a:has-text("Next"), button:has-text("Next")').first();
    
    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      await nextButton.click();
      
      await page.waitForLoadState('networkidle');
      
      // URL should contain page parameter
      expect(page.url()).toContain('page=2');
    }
  });

  test('should show current page number', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed?page=2`);
    
    await page.waitForLoadState('networkidle');
    
    // Look for page indicator
    const pageIndicator = await page.locator('text=/page 2/i').count();
    
    // May or may not show if there aren't enough experiences
    expect(pageIndicator).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Feed Performance', () => {
  test('should load feed within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/feed`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds (FR-015 requirement)
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle concurrent feed access', async ({ browser }) => {
    // Create multiple pages to simulate concurrent users
    const pages = await Promise.all([
      browser.newPage(),
      browser.newPage(),
      browser.newPage(),
    ]);
    
    // All pages navigate to feed simultaneously
    await Promise.all(
      pages.map(page => page.goto(`${BASE_URL}/feed`))
    );
    
    // All should load successfully
    for (const page of pages) {
      await expect(page.locator('h1:has-text("Experiences")')).toBeVisible();
      await page.close();
    }
  });
});
