# Quickstart: AI Coding Assistant Experience Platform

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- GitHub OAuth App configured

## Setup Instructions

### 1. Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd ai-coding-assistant-platform

# Install dependencies
npm install
# or
yarn install
```

### 2. Database Setup
```bash
# Create database
createdb ai_coding_assistant

# Run migrations
cd backend
alembic upgrade head
```

### 3. Configuration
```bash
# Environment variables (.env.local)
DATABASE_URL=postgresql://user:password@localhost/ai_coding_assistant
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 4. Start Application
```bash
# Start Next.js development server
npm run dev
# or
yarn dev

# Application runs on http://localhost:3000
```

## User Journey Validation

### Test Scenario 1: User Authentication
1. **Navigate** to http://localhost:3000
2. **Click** "Login with GitHub"
3. **Authorize** the application on GitHub
4. **Verify** user is redirected back and logged in
5. **Check** user profile displays GitHub information

**Expected Result**: User successfully authenticated via GitHub SSO

### Test Scenario 2: Create Experience with Prompt
1. **Login** as authenticated user
2. **Click** "Create Experience"
3. **Fill** form:
   - Title: "Using GitHub Copilot for React Components"
   - Description: "Copilot helped me create reusable components faster"
   - AI Assistant: "GitHub Copilot"
   - Tags: ["react", "components", "productivity"]
   - GitHub URL: "https://github.com/user/repo/blob/main/Component.js"
4. **Add** prompt:
   - Content: "Create a reusable Button component with TypeScript"
   - Context: "Building a design system"
   - Results: "Generated clean, typed component with props interface"
5. **Submit** experience
6. **Verify** experience appears in feed

**Expected Result**: Experience created with prompt and visible to community

### Test Scenario 3: Browse and Filter Feed
1. **Navigate** to main feed
2. **Filter** by AI Assistant type: "GitHub Copilot"
3. **Search** for keyword: "react"
4. **Verify** only relevant experiences shown
5. **Click** on experience to view details
6. **Copy** prompt from experience
7. **Rate** prompt effectiveness (1-5 scale)

**Expected Result**: Feed filtering works, prompts are copyable and ratable

### Test Scenario 4: Community Interaction
1. **View** someone else's experience
2. **Add** comment: "This prompt worked great for my project too!"
3. **React** with "helpful" reaction
4. **Click** GitHub URL to view code
5. **Verify** URL opens GitHub repository

**Expected Result**: Comments, reactions, and GitHub links work correctly

### Test Scenario 5: User Profile
1. **Navigate** to user profile
2. **Verify** shows:
   - GitHub avatar and username
   - List of user's experiences
   - Contribution statistics
3. **Edit** profile bio
4. **Save** changes

**Expected Result**: Profile displays user activity and allows updates

## Performance Validation

### Concurrent Connection Test
```bash
# Install testing tool
pip install locust

# Run load test
locust -f tests/load_test.py --host=http://localhost:8000
```

**Test Parameters**:
- 15 concurrent users minimum
- Test duration: 5 minutes
- Endpoints: /experiences, /auth/me, /users/profile

**Expected Result**: System handles 15+ concurrent connections without errors

## Data Validation

### GitHub URL Validation Test
1. **Create** experience with valid GitHub URL: "https://github.com/user/repo"
2. **Verify** URL is accepted and displayed as clickable link
3. **Try** invalid URL: "https://gitlab.com/user/repo"
4. **Verify** URL is rejected with error message

**Expected Result**: Only GitHub URLs accepted, others rejected

### Data Retention Test
1. **Create** test user and experience
2. **Simulate** 2-year passage (modify created_at timestamp)
3. **Run** cleanup job
4. **Verify** old data marked for deletion
5. **Verify** data actually removed after grace period

**Expected Result**: Data older than 2 years is automatically cleaned up

## Security Validation

### Authentication Test
1. **Try** accessing /experiences without authentication
2. **Verify** redirected to login
3. **Login** with GitHub
4. **Verify** can access protected endpoints
5. **Logout** and verify access revoked

**Expected Result**: All content requires authentication

### Input Validation Test
1. **Try** creating experience with:
   - Empty title (should fail)
   - Title > 500 characters (should fail)
   - Invalid AI assistant type (should fail)
   - Malicious script in description (should be sanitized)
2. **Verify** appropriate error messages

**Expected Result**: Input validation prevents invalid/malicious data

## Troubleshooting

### Common Issues
- **Database connection failed**: Check PostgreSQL is running and credentials
- **GitHub OAuth error**: Verify client ID/secret and callback URL
- **Frontend can't reach API**: Check CORS settings and API URL
- **Slow performance**: Check database indexes and connection pooling

### Debug Commands
```bash
# Check database connections
psql -d ai_coding_assistant -c "SELECT count(*) FROM users;"

# View API logs
tail -f backend/logs/app.log

# Test GitHub OAuth
curl -X GET "http://localhost:8000/api/v1/auth/github"
```

## Success Criteria
- ✅ GitHub SSO authentication working
- ✅ Users can create experiences with prompts
- ✅ Community feed displays and filters content
- ✅ GitHub URLs validated and clickable
- ✅ Prompt rating system functional
- ✅ Comments and reactions working
- ✅ 15+ concurrent connections supported
- ✅ Data retention policy enforced
- ✅ All content requires authentication