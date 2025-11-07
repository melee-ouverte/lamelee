# E2E Tests - Quick Reference

## Current Status
✅ **16/16 tests passing** on Chromium (11 seconds execution time)

## Run Tests

```bash
# Normal run (headless)
npm run test:e2e

# With browser visible
npm run test:e2e:headed

# Interactive UI mode (best for development)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View last report
npm run test:e2e:report
```

## Test Coverage

### Basic Navigation (4 tests)
- Homepage loading
- Navigate to feed
- Navigate to create page
- Platform statistics

### Feed Page (2 tests)
- Filters display
- Experience cards or empty state

### Create Page (1 test)
- Form or sign-in prompt

### Responsive Design (3 tests)
- Mobile (375x667)
- Tablet (768x1024)
- Desktop (1920x1080)

### Performance (2 tests)
- Homepage < 5s load
- Feed page < 5s load

### SEO & Accessibility (4 tests)
- Page titles
- Heading hierarchy
- Image alt text
- Keyboard navigation

## Add New Tests

1. Create test in `tests/e2e/basic-navigation.test.ts`
2. Use semantic selectors:
```typescript
page.getByRole('button', { name: 'Submit' })
page.getByText('Welcome')
page.getByLabel('Email')
```

3. Handle both states:
```typescript
// Good - handles empty and populated states
const hasContent = 
  (await page.locator('.card').count()) > 0 ||
  (await page.locator('text=/no data/i').count()) > 0;
expect(hasContent).toBeTruthy();
```

4. Wait for stable state:
```typescript
await page.waitForLoadState('networkidle');
```

## Enable Cross-Browser Testing

Uncomment browsers in `playwright.config.ts`:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } }, // Uncomment
  { name: 'webkit', use: { ...devices['Desktop Safari'] } }, // Uncomment
]
```

Then install:
```bash
npx playwright install firefox webkit
sudo npx playwright install-deps  # For webkit system dependencies
```

## Files

```
tests/e2e/
├── basic-navigation.test.ts  # Current working tests (16 tests)
├── user-journeys.test.ts.backup  # Original comprehensive tests (needs refactoring)
├── README.md  # Full documentation
├── FIX_SUMMARY.md  # What was fixed and how
└── QUICK_REFERENCE.md  # This file
```

## Common Issues

### Port 3000 in use
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in playwright.config.ts
```

### Tests failing after UI changes
- Update selectors in tests
- Add data-testid attributes to components
- Use semantic selectors when possible

### Flaky tests
- Add explicit waits: `waitForLoadState()`, `waitForSelector()`
- Avoid arbitrary timeouts
- Ensure test independence

## Next Steps

1. Add data-testid to UI components
2. Create auth fixtures
3. Restore comprehensive journey tests
4. Add API mocking
5. Enable CI/CD integration
