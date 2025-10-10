# Tasks: AI Coding Assistant Experience Platform

**Input**: Design documents from `/specs/002-ai-coding-assistant/`
**Prerequisites**: plan.md, research.md, data-model.md, quickstart.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: Next.js 14, TypeScript, Prisma, PostgreSQL, NextAuth.js
2. Load optional design documents:
   → data-model.md: 6 entities (User, Experience, Prompt, Comment, Reaction, PromptRating)
   → contracts/api.yaml: 8 endpoint groups
   → research.md: Next.js full-stack decision
3. Generate tasks by category:
   → Setup: Next.js init, Prisma, NextAuth config
   → Tests: contract tests, integration tests
   → Core: Prisma models, API routes, UI components
   → Integration: GitHub OAuth, DB, middleware
   → Polish: unit tests, performance, quickstart validation
4. Apply task rules:
   → Different API routes = mark [P]
   → Different Prisma models = mark [P]
   → Same file = sequential
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js Full-Stack**: `src/` at repository root
- Single codebase with API routes and pages
- Prisma schema and migrations in root

## Phase 3.1: Setup
- [ ] T001 Initialize Next.js 14 project with TypeScript and configure package.json dependencies
- [ ] T002 Configure Prisma with PostgreSQL connection and initialize schema file at prisma/schema.prisma
- [ ] T003 [P] Configure ESLint, Prettier, and TypeScript strict mode in tsconfig.json
- [ ] T004 Configure NextAuth.js with GitHub provider in src/lib/auth.ts
- [ ] T005 Create environment variables template (.env.example) with DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T006 [P] Contract test GET /api/experiences in tests/contract/experiences-get.test.ts
- [ ] T007 [P] Contract test POST /api/experiences in tests/contract/experiences-post.test.ts
- [ ] T008 [P] Contract test GET /api/experiences/{id} in tests/contract/experiences-id-get.test.ts
- [ ] T009 [P] Contract test PUT /api/experiences/{id} in tests/contract/experiences-id-put.test.ts
- [ ] T010 [P] Contract test DELETE /api/experiences/{id} in tests/contract/experiences-id-delete.test.ts
- [ ] T011 [P] Contract test POST /api/experiences/{id}/comments in tests/contract/comments-post.test.ts
- [ ] T012 [P] Contract test POST /api/experiences/{id}/reactions in tests/contract/reactions-post.test.ts
- [ ] T013 [P] Contract test POST /api/prompts/{id}/ratings in tests/contract/ratings-post.test.ts
- [ ] T014 [P] Contract test GET /api/users/me in tests/contract/users-me.test.ts
- [ ] T015 [P] Contract test GET /api/users/{id} in tests/contract/users-id.test.ts
- [ ] T016 [P] Integration test: User authentication via GitHub SSO in tests/integration/auth.test.ts
- [ ] T017 [P] Integration test: Create experience with prompt and GitHub URL in tests/integration/create-experience.test.ts
- [ ] T018 [P] Integration test: Browse and filter feed by AI assistant type in tests/integration/feed-filter.test.ts
- [ ] T019 [P] Integration test: Community interaction (comments, reactions) in tests/integration/community.test.ts
- [ ] T020 [P] Integration test: User profile and statistics in tests/integration/user-profile.test.ts
- [ ] T021 [P] Integration test: GitHub URL validation (github.com only) in tests/integration/github-url-validation.test.ts
- [ ] T022 [P] Integration test: Prompt rating system (1-5 scale) in tests/integration/prompt-rating.test.ts
- [ ] T023 [P] Integration test: Data retention (2-year cleanup) in tests/integration/data-retention.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Models
- [ ] T024 [P] User model in prisma/schema.prisma with github_id, username, email, avatar_url, bio, timestamps
- [ ] T025 [P] Experience model in prisma/schema.prisma with user_id FK, title, description, ai_assistant_type, tags array, github_urls array, is_news, timestamps
- [ ] T026 [P] Prompt model in prisma/schema.prisma with experience_id FK, content, context, results_achieved, timestamp
- [ ] T027 [P] Comment model in prisma/schema.prisma with user_id FK, experience_id FK, content, timestamps
- [ ] T028 [P] Reaction model in prisma/schema.prisma with user_id FK, experience_id FK, reaction_type, unique constraint
- [ ] T029 [P] PromptRating model in prisma/schema.prisma with user_id FK, prompt_id FK, rating (1-5 check), unique constraint
- [ ] T030 Run Prisma migration to create database tables: npx prisma migrate dev --name init

### API Routes - Authentication
- [ ] T031 NextAuth API route in src/pages/api/auth/[...nextauth].ts with GitHub provider configuration

### API Routes - Experiences
- [ ] T032 GET /api/experiences route with filtering (ai_assistant, tags, search) and pagination in src/pages/api/experiences/index.ts
- [ ] T033 POST /api/experiences route with validation and prompt creation in src/pages/api/experiences/index.ts
- [ ] T034 GET /api/experiences/[id] route with prompts and reactions in src/pages/api/experiences/[id].ts
- [ ] T035 PUT /api/experiences/[id] route with owner validation in src/pages/api/experiences/[id].ts
- [ ] T036 DELETE /api/experiences/[id] route with owner validation and cascade delete in src/pages/api/experiences/[id].ts

### API Routes - Comments & Reactions
- [ ] T037 GET /api/experiences/[id]/comments route in src/pages/api/experiences/[id]/comments.ts
- [ ] T038 POST /api/experiences/[id]/comments route with validation in src/pages/api/experiences/[id]/comments.ts
- [ ] T039 POST /api/experiences/[id]/reactions route with unique constraint handling in src/pages/api/experiences/[id]/reactions.ts

### API Routes - Ratings & Users
- [ ] T040 POST /api/prompts/[id]/ratings route with 1-5 validation and average calculation in src/pages/api/prompts/[id]/ratings.ts
- [ ] T041 GET /api/users/me route returning current user profile in src/pages/api/users/me.ts
- [ ] T042 GET /api/users/[id] route with experience count and prompt count in src/pages/api/users/[id].ts

### Library & Utilities
- [ ] T043 [P] Prisma client singleton in src/lib/db.ts with connection pooling
- [ ] T044 [P] GitHub URL validation utility in src/lib/validations.ts with github.com regex pattern
- [ ] T045 [P] Input sanitization utility in src/lib/validations.ts for XSS prevention
- [ ] T046 [P] Authentication middleware in src/lib/auth.ts for protected routes

### UI Components
- [ ] T047 [P] ExperienceCard component in src/components/ExperienceCard.tsx displaying title, description, AI assistant type, tags, GitHub URLs
- [ ] T048 [P] PromptDisplay component in src/components/PromptDisplay.tsx with copy-to-clipboard functionality
- [ ] T049 [P] UserProfile component in src/components/UserProfile.tsx showing GitHub avatar, username, bio, contributions
- [ ] T050 [P] CommentList component in src/components/CommentList.tsx with add comment form
- [ ] T051 [P] ReactionButtons component in src/components/ReactionButtons.tsx (like, helpful, bookmark)
- [ ] T052 [P] PromptRating component in src/components/PromptRating.tsx with 1-5 star rating UI

### Pages
- [ ] T053 Feed page in src/pages/feed.tsx with filtering sidebar (AI assistant type, tags, search) and experience list
- [ ] T054 Create experience page in src/pages/create.tsx with form validation and prompt addition
- [ ] T055 Experience detail page in src/pages/experiences/[id].tsx with prompts, comments, reactions
- [ ] T056 User profile page in src/pages/profile/[id].tsx with experience list and statistics
- [ ] T057 Login page in src/pages/login.tsx with GitHub OAuth button

## Phase 3.4: Integration

### Database Integration
- [ ] T058 Configure Prisma connection pooling for 15+ concurrent connections in src/lib/db.ts
- [ ] T059 Create database indexes for experiences (ai_assistant_type, created_at, tags GIN, full-text search) via Prisma migration
- [ ] T060 Implement soft delete for User and Experience models with deleted_at timestamp

### GitHub Integration
- [ ] T061 GitHub OAuth integration testing with NextAuth.js callback handling in src/lib/auth.ts
- [ ] T062 GitHub URL preview service in src/lib/github.ts fetching repository metadata via GitHub API

### Middleware & Logging
- [ ] T063 Request logging middleware in src/middleware.ts logging all API requests with timestamps
- [ ] T064 Error handling middleware in src/lib/error-handler.ts with consistent error response format
- [ ] T065 CORS configuration in next.config.js for API routes

### Data Retention
- [ ] T066 Data cleanup scheduled job in src/lib/cleanup.ts marking users older than 2 years for deletion
- [ ] T067 Hard delete job in src/lib/cleanup.ts removing soft-deleted users after 30-day grace period

## Phase 3.5: Polish

### Unit Tests
- [ ] T068 [P] Unit tests for GitHub URL validation in tests/unit/validations.test.ts
- [ ] T069 [P] Unit tests for input sanitization in tests/unit/sanitization.test.ts
- [ ] T070 [P] Unit tests for Prisma query helpers in tests/unit/db-queries.test.ts

### Performance Tests
- [ ] T071 Load test for 15+ concurrent connections using Jest and supertest in tests/performance/load.test.ts
- [ ] T072 Database query performance test ensuring <200ms response times in tests/performance/db-performance.test.ts

### Documentation
- [ ] T073 [P] Update README.md with setup instructions, environment variables, and running instructions
- [ ] T074 [P] API documentation generation from OpenAPI spec using Swagger UI
- [ ] T075 [P] Create developer quickstart guide in docs/quickstart.md

### Validation & Cleanup
- [ ] T076 Run all contract tests and verify they pass
- [ ] T077 Run all integration tests and verify they pass
- [ ] T078 Execute quickstart.md manual test scenarios and verify all success criteria met
- [ ] T079 Run ESLint and Prettier across codebase and fix any issues
- [ ] T080 Final build test: `npm run build` succeeds without errors

## Dependencies

### Critical Paths
- T001-T005 (Setup) → Everything else
- T024-T030 (Models) → T032-T042 (API Routes)
- T006-T023 (Tests) → T024-T080 (All Implementation)
- T043-T046 (Libraries) → T032-T042 (API Routes)
- T047-T052 (Components) → T053-T057 (Pages)
- T031 (Auth) → All protected routes
- T058-T060 (DB Integration) → Performance tests

### Blocking Dependencies
- T030 blocks T032-T042 (need DB tables before API routes)
- T043 blocks T032-T042 (need Prisma client before queries)
- T044-T046 blocks T032-T042 (need validations and auth middleware)
- T047-T052 blocks T053-T057 (need components before pages)

## Parallel Execution Examples

### Round 1: Contract Tests (T006-T015)
```bash
# All contract tests can run in parallel - different test files
npm test tests/contract/experiences-get.test.ts &
npm test tests/contract/experiences-post.test.ts &
npm test tests/contract/experiences-id-get.test.ts &
npm test tests/contract/experiences-id-put.test.ts &
npm test tests/contract/experiences-id-delete.test.ts &
npm test tests/contract/comments-post.test.ts &
npm test tests/contract/reactions-post.test.ts &
npm test tests/contract/ratings-post.test.ts &
npm test tests/contract/users-me.test.ts &
npm test tests/contract/users-id.test.ts &
wait
```

### Round 2: Integration Tests (T016-T023)
```bash
# All integration tests can run in parallel - different test files
npm test tests/integration/auth.test.ts &
npm test tests/integration/create-experience.test.ts &
npm test tests/integration/feed-filter.test.ts &
npm test tests/integration/community.test.ts &
npm test tests/integration/user-profile.test.ts &
npm test tests/integration/github-url-validation.test.ts &
npm test tests/integration/prompt-rating.test.ts &
npm test tests/integration/data-retention.test.ts &
wait
```

### Round 3: Prisma Models (T024-T029)
```bash
# All models defined in same schema.prisma - CANNOT parallelize
# Must be done sequentially or all at once in single edit
```

### Round 4: Library Utilities (T043-T046)
```bash
# Different files - can parallelize
# Create src/lib/db.ts (T043)
# Create src/lib/validations.ts (T044, T045)
# Update src/lib/auth.ts (T046)
```

### Round 5: UI Components (T047-T052)
```bash
# All components in different files - can parallelize
# Create all 6 component files simultaneously
```

## Notes
- [P] tasks = different files, no dependencies - safe to parallelize
- Verify all tests fail (Red) before implementing (Green)
- NextAuth.js handles GitHub OAuth flow automatically
- Prisma generates TypeScript types from schema
- Use `npx prisma studio` to inspect database during development
- Run `npx prisma format` to format schema.prisma
- Connection pooling configured for 15+ concurrent connections minimum

## Task Generation Rules Applied

1. **From Contracts** (api.yaml):
   - 10 contract test tasks (T006-T015) - one per endpoint group [P]
   - 11 API route implementation tasks (T031-T042) - grouped by file

2. **From Data Model** (data-model.md):
   - 6 model creation tasks (T024-T029) [P]
   - 1 migration task (T030)
   - Index creation (T059)
   - Soft delete (T060)

3. **From User Stories** (quickstart.md):
   - 8 integration tests (T016-T023) [P]
   - 5 page implementation tasks (T053-T057)

4. **Ordering**:
   - Setup (T001-T005) → Tests (T006-T023) → Models (T024-T030) → Libraries (T043-T046) → API Routes (T031-T042) → Components (T047-T052) → Pages (T053-T057) → Integration (T058-T067) → Polish (T068-T080)

## Validation Checklist

- [x] All 10 API endpoint groups have contract tests
- [x] All 6 entities have Prisma model tasks
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task (except schema.prisma which is sequential)
- [x] All 8 user journey scenarios from quickstart.md have integration tests
