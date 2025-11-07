# E2E User Journey Tests

## Overview

Automated end-to-end tests based on the Constitution Principle II: Test-Driven Development (NON-NEGOTIABLE). These tests validate complete user workflows as specified in `specs/002-ai-coding-assistant/quickstart.md`.

## Constitution Compliance

✅ **Principle II - Test-Driven Development**: All user journeys from the quickstart guide are automated  
✅ **Principle IV - Traçabilité Complète**: Tests trace back to quickstart.md → spec.md → User Requirements  
✅ **Test Coverage**: Every user story has corresponding E2E test scenarios

## Test Scenarios

### 1. User Authentication Journey
- ✅ GitHub SSO authentication flow
- ✅ Protected routes require authentication
- ✅ Logout functionality

### 2. Create Experience Journey
- ✅ Complete experience creation with prompts
- ✅ Form validation (required fields, formats)
- ✅ GitHub URL validation (only GitHub URLs accepted)
- ✅ XSS prevention and input sanitization

### 3. Browse and Filter Feed Journey
- ✅ Feed display and pagination
- ✅ Filter by AI Assistant type
- ✅ Search functionality
- ✅ Navigation to experience detail
- ✅ Prompt copying to clipboard
- ✅ Prompt rating system

### 4. Community Interaction Journey
- ✅ Comment posting
- ✅ Reaction system (helpful, creative, etc.)
- ✅ GitHub URL links open correctly
- ✅ Prevent duplicate reactions

### 5. User Profile Journey
- ✅ Profile information display
- ✅ User experiences list
- ✅ Bio editing
- ✅ Contribution statistics

### 6. Performance Validation
- ✅ 15+ concurrent connections (from quickstart requirement)
- ✅ Page load performance budgets

### 7. Data Validation
- ✅ GitHub URL acceptance/rejection
- ✅ Input format validation

### 8. Security Validation
- ✅ Authentication requirements
- ✅ HTML sanitization
- ✅ Input length limits

## Running the Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers (if not already installed)
npx playwright install
```

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Tests with UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

### Run Tests in Debug Mode

```bash
npm run test:e2e:debug
```

### View Test Report

```bash
npm run test:e2e:report
```

### Run Specific Test Suite

```bash
# Run only authentication tests
npx playwright test --grep "User Authentication"

# Run only performance tests
npx playwright test --grep "Performance Validation"
```

### Run Tests on Specific Browser

```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Mobile Chrome
npx playwright test --project="Mobile Chrome"
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Parallelization**: Tests run in parallel by default
- **Retry**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure
- **Traces**: Captured on first retry

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### Visual Debugging

```bash
# Run with headed browser
npx playwright test --headed

# Run with slow motion
npx playwright test --headed --slow-mo=1000
```

### Playwright Inspector

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through tests
- Inspect DOM
- View network requests
- See console logs

### Trace Viewer

If a test fails, check the trace:

```bash
npx playwright show-trace trace.zip
```

## Test Data

Test data is defined in `tests/e2e/user-journeys.test.ts`:

```typescript
const TEST_USER = {
  githubUsername: 'testuser',
  githubId: '12345678',
  email: 'test@example.com',
  avatarUrl: 'https://avatars.githubusercontent.com/u/12345678'
};

const TEST_EXPERIENCE = {
  title: 'Using GitHub Copilot for React Components',
  description: 'Copilot helped me create reusable components faster',
  aiAssistant: 'github-copilot',
  tags: ['react', 'components', 'productivity'],
  githubUrl: 'https://github.com/testuser/testrepo/blob/main/Component.js',
  // ...
};
```

## Environment Variables

```bash
# Base URL for tests
BASE_URL=http://localhost:3000

# CI mode (affects retries and parallelization)
CI=true
```

## Test Maintenance

### Adding New Tests

1. Identify user story from `quickstart.md`
2. Create test in appropriate `test.describe()` block
3. Follow existing patterns for authentication, navigation, assertions
4. Update this README with new test scenario

### Updating Tests

When specifications change:

1. Update `specs/002-ai-coding-assistant/quickstart.md`
2. Update corresponding E2E tests
3. Maintain traceability (test → quickstart → spec → user requirement)
4. Document changes in test comments

## Performance Benchmarks

From `quickstart.md` requirements:

- ✅ **Concurrent Connections**: 15+ users simultaneously
- ✅ **Feed Load Time**: < 2 seconds
- ✅ **Overall Response Time**: < 5 seconds for all pages

## Success Criteria

All tests must pass for a release:

```bash
npm run test:e2e
```

Expected output:
```
✓ User Authentication Journey (3 passed)
✓ Create Experience Journey (4 passed)
✓ Browse and Filter Feed Journey (6 passed)
✓ Community Interaction Journey (4 passed)
✓ User Profile Journey (4 passed)
✓ Performance Validation (2 passed)
✓ Data Validation (2 passed)
✓ Security Validation (3 passed)

Total: 28 tests passed in 28 suites
```

## Troubleshooting

### Tests Failing on CI

1. Check that browsers are installed: `npx playwright install --with-deps`
2. Verify environment variables are set correctly
3. Check CI logs for specific error messages

### Timeout Errors

Increase timeout in `playwright.config.ts`:

```typescript
use: {
  actionTimeout: 10000, // 10 seconds
  navigationTimeout: 30000, // 30 seconds
}
```

### Authentication Issues

Tests use mock authentication. For real GitHub OAuth testing:

1. Create a test GitHub OAuth app
2. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
3. Update authentication test to use real OAuth flow

## Related Documentation

- [Quickstart Guide](../../specs/002-ai-coding-assistant/quickstart.md) - Source of test scenarios
- [Specification](../../specs/002-ai-coding-assistant/spec.md) - Feature requirements
- [Constitution](../../.specify/memory/constitution.md) - Testing principles
- [Playwright Documentation](https://playwright.dev) - Playwright API reference

## Contribution Guidelines

When contributing E2E tests:

1. ✅ Follow Constitution Principle II (TDD)
2. ✅ Maintain traceability to quickstart scenarios
3. ✅ Include descriptive test names and comments
4. ✅ Use appropriate test data
5. ✅ Add test IDs to UI components (`data-testid`)
6. ✅ Update this README when adding new scenarios
7. ✅ Ensure tests are deterministic (no flakiness)
8. ✅ Keep tests independent (no shared state)

---

*Generated from Constitution v1.0.0 - Principle II: Test-Driven Development (NON-NEGOTIABLE)*
