# Developer Quickstart Guide

🚀 **Get up and running with the AI Coding Assistant Experience Platform in under 10 minutes**

This guide will walk you through setting up your development environment, running the application, and exploring key features through hands-on exercises.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 18.0+** installed ([Download](https://nodejs.org/))
- [ ] **npm 9.0+** or **yarn 1.22+** package manager
- [ ] **Git** for version control
- [ ] **GitHub account** for OAuth authentication
- [ ] **Code editor** (VS Code recommended)
- [ ] **Terminal/Command line** access

### Verify Prerequisites

```bash
# Check Node.js version (should be 18.0 or higher)
node --version

# Check npm version (should be 9.0 or higher)
npm --version

# Check Git installation
git --version
```

## 🎯 Quick Setup (5 minutes)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd claude-implem

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 2: Environment Configuration

Create your environment file:

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit the environment file
nano .env.local  # or use your preferred editor
```

**Minimal `.env.local` configuration:**

```bash
# Database (SQLite for development)
DATABASE_URL="file:./dev.db"
DATABASE_CONNECTION_LIMIT="20"

# NextAuth.js (generate a random secret)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"

# GitHub OAuth (we'll set this up next)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Optional: GitHub API token for enhanced features
GITHUB_TOKEN="your-github-personal-access-token"
```

### Step 3: GitHub OAuth Setup

1. **Go to GitHub Settings**
   - Navigate to https://github.com/settings/developers
   - Click "New OAuth App"

2. **Configure OAuth App**
   ```
   Application name: AI Assistant Platform (Dev)
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:3000/api/auth/callback/github
   ```

3. **Copy Credentials**
   - Copy the `Client ID` to `GITHUB_CLIENT_ID`
   - Generate and copy `Client Secret` to `GITHUB_CLIENT_SECRET`

4. **Optional: Personal Access Token**
   - Go to https://github.com/settings/tokens
   - Generate token with `public_repo` scope
   - Copy to `GITHUB_TOKEN` for URL preview features

### Step 4: Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Optional: View database schema
npx prisma studio  # Opens web interface at http://localhost:5555
```

### Step 5: Start Development Server

```bash
# Start the development server
npm run dev

# Server should start at http://localhost:3000
```

## 🎉 First Launch Verification

### ✅ Health Check

1. **Open your browser** to http://localhost:3000
2. **Sign in with GitHub** using the "Sign In" button
3. **Verify your profile** appears in the top-right corner
4. **Check the console** for any errors (should see "Authentication successful")

### ✅ Basic Functionality Test

1. **Browse Experiences** - You should see an empty state initially
2. **Create Your First Experience**:
   - Click "Share Experience"
   - Fill out the form with test data
   - Add at least one prompt
   - Submit and verify it appears in the feed

## 🧪 Hands-On Tutorial

### Tutorial 1: Create Your First Experience

**Objective**: Share an experience using GitHub Copilot to build a React component

**Steps**:

1. **Navigate to Create Experience**
   ```
   URL: http://localhost:3000/create
   ```

2. **Fill out the form**:
   ```
   Title: Building a User Profile Card with GitHub Copilot
   Description: Used GitHub Copilot to generate a responsive React component for displaying user profiles with avatar, name, bio, and social links. The AI assistant helped with TypeScript types, responsive design, and accessibility features.
   GitHub URL: https://github.com/yourusername/react-components
   AI Assistant: GitHub Copilot
   Tags: react, typescript, components, ui
   ```

3. **Add prompts**:
   
   **Prompt 1**:
   ```
   Content: Create a TypeScript React component called UserProfileCard that displays a user's avatar, name, title, and bio
   Context: Building a user management system, need a reusable profile component
   Results: Generated a complete component with proper TypeScript interfaces and responsive design
   ```

   **Prompt 2**:
   ```
   Content: Add social media links and a follow button to the UserProfileCard component
   Context: Need to extend the component with social features
   Results: Added LinkedIn, Twitter, GitHub links with icons and a styled follow button
   ```

4. **Submit and verify**:
   - Click "Create Experience"
   - Verify redirect to experience detail page
   - Check that all data is displayed correctly
   - Test the "Copy Prompt" functionality

### Tutorial 2: Community Interaction

**Objective**: Test commenting, reactions, and rating system

**Steps**:

1. **Navigate to your experience** from the previous tutorial

2. **Add a comment**:
   ```
   Comment: This approach worked great for my project too! The TypeScript types generated by Copilot were especially helpful.
   ```

3. **Add reactions**:
   - Click the "Helpful" reaction
   - Try clicking different reaction types
   - Verify only one reaction per user is allowed

4. **Rate the prompts**:
   - Give the first prompt 5 stars
   - Give the second prompt 4 stars
   - Verify the average rating calculation

### Tutorial 3: Search and Filtering

**Objective**: Test the discovery features

**Steps**:

1. **Navigate to the Feed** (http://localhost:3000/feed)

2. **Test filtering**:
   - Filter by AI Assistant type: "GitHub Copilot"
   - Filter by tags: "react"
   - Combine multiple filters

3. **Test search**:
   - Search for "TypeScript"
   - Search for "component"
   - Try partial matches

4. **Test sorting**:
   - Sort by "Recent"
   - Sort by "Popular" (based on reactions)
   - Sort by "Rating" (based on prompt ratings)

### Tutorial 4: Admin Features

**Objective**: Explore admin monitoring capabilities

**Steps**:

1. **System Health Dashboard**:
   ```
   URL: http://localhost:3000/admin-monitoring
   ```
   - View database statistics
   - Check performance metrics
   - Monitor request logs

2. **GitHub Integration Testing**:
   ```
   URL: http://localhost:3000/github-test
   ```
   - Test GitHub OAuth
   - Test repository URL validation
   - Generate URL previews

3. **Data Retention Management**:
   ```
   URL: http://localhost:3000/admin/data-retention
   ```
   - View retention statistics
   - Run test cleanup (dry run)
   - Check retention policies

## 🔧 Development Workflow

### Code Structure Overview

```
src/
├── components/          # React components
│   ├── ExperienceCard.tsx
│   ├── PromptDisplay.tsx
│   ├── UserProfile.tsx
│   └── ...
├── lib/                # Utility libraries
│   ├── auth.ts         # Authentication
│   ├── db.ts           # Database client
│   ├── validations.ts  # Input validation
│   └── ...
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   ├── experiences/    # Experience pages
│   └── ...
```

### Making Your First Code Change

**Exercise**: Add a new reaction type

1. **Update the database schema**:
   ```typescript
   // In prisma/schema.prisma
   enum ReactionType {
     HELPFUL
     CREATIVE
     EDUCATIONAL
     INNOVATIVE
     PROBLEMATIC
     AMAZING  // Add this new type
   }
   ```

2. **Run migration**:
   ```bash
   npx prisma migrate dev --name add-amazing-reaction
   ```

3. **Update validation**:
   ```typescript
   // In src/lib/validations.ts
   export const reactionSchema = z.object({
     reactionType: z
       .enum(['HELPFUL', 'CREATIVE', 'EDUCATIONAL', 'INNOVATIVE', 'PROBLEMATIC', 'AMAZING'])
   });
   ```

4. **Update the UI component**:
   ```typescript
   // In src/components/ReactionButtons.tsx
   const reactionTypes = [
     { type: 'HELPFUL', icon: '👍', label: 'Helpful' },
     { type: 'CREATIVE', icon: '🎨', label: 'Creative' },
     { type: 'EDUCATIONAL', icon: '📚', label: 'Educational' },
     { type: 'INNOVATIVE', icon: '💡', label: 'Innovative' },
     { type: 'PROBLEMATIC', icon: '⚠️', label: 'Problematic' },
     { type: 'AMAZING', icon: '🤩', label: 'Amazing' }, // Add this
   ];
   ```

5. **Test your changes**:
   - Restart the dev server
   - Create a new experience
   - Verify the new reaction appears
   - Test clicking the new reaction

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Code Quality Checks

```bash
# Check TypeScript compilation
npm run type-check

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Run all quality checks
npm run quality-check
```

## 🚀 Advanced Features

### Custom API Integration

**Example**: Add a new API endpoint

1. **Create the API route**:
   ```typescript
   // src/pages/api/experiences/[id]/summary.ts
   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     if (req.method !== 'GET') {
       return res.status(405).json({ error: 'Method not allowed' });
     }

     const { id } = req.query;
     // Implementation here...
   }
   ```

2. **Add TypeScript types**:
   ```typescript
   // src/types/api.ts
   export interface ExperienceSummary {
     totalPrompts: number;
     averageRating: number;
     reactionCounts: Record<string, number>;
   }
   ```

3. **Create a custom hook**:
   ```typescript
   // src/hooks/useExperienceSummary.ts
   export function useExperienceSummary(experienceId: number) {
     // Implementation here...
   }
   ```

### Database Customization

**Example**: Add a new field to experiences

1. **Update Prisma schema**:
   ```prisma
   model Experience {
     // ... existing fields
     difficulty    Difficulty  @default(BEGINNER)
   }

   enum Difficulty {
     BEGINNER
     INTERMEDIATE
     ADVANCED
     EXPERT
   }
   ```

2. **Run migration**:
   ```bash
   npx prisma migrate dev --name add-difficulty-field
   ```

3. **Update validation schema**:
   ```typescript
   export const experienceSchema = z.object({
     // ... existing fields
     difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('BEGINNER'),
   });
   ```

## 🐛 Troubleshooting

### Common Issues and Solutions

**Issue**: Database connection error
```
Error: P1001: Can't reach database server
```
**Solution**:
```bash
# Check DATABASE_URL in .env.local
# Ensure database file exists
npx prisma migrate dev --name init
```

**Issue**: GitHub OAuth not working
```
Error: Configuration issue with GitHub provider
```
**Solution**:
1. Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env.local`
2. Check callback URL in GitHub OAuth app settings
3. Ensure NEXTAUTH_URL matches your development URL

**Issue**: OAuth callback handler error
```
Error in the OAuth callback handler route.
Cannot read properties of undefined (reading 'findUnique')
```
**Solution**:
This indicates a Prisma adapter configuration issue. The fix has been applied - restart your development server:
```bash
npm run dev
```
If the error persists, check that your database is properly migrated:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Issue**: Build fails with TypeScript errors
```
Error: Type 'string | undefined' is not assignable to type 'string'
```
**Solution**:
```bash
# Run type checking to see all errors
npm run type-check

# Common fix: add proper type guards
if (!variable) {
  throw new Error('Variable is required');
}
```

**Issue**: Tests failing
```
Error: Cannot find module '@testing-library/react'
```
**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or install missing test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

**Issue**: Next.js Image component error with GitHub avatars
```
Error: Invalid src prop on `next/image`, hostname "avatars.githubusercontent.com" is not configured
```
**Solution**:
This indicates that GitHub avatar images need to be configured in Next.js. The fix has been applied - restart your development server:
```bash
npm run dev
```
The `next.config.mjs` file now includes the necessary image domain configurations for GitHub avatars.

### Debug Mode

Enable debug logging:

```bash
# Add to .env.local
DEBUG=true
NODE_ENV=development

# Start with verbose logging
npm run dev -- --verbose
```

### Performance Monitoring

Monitor development performance:

```typescript
// Add to any component for performance monitoring
useEffect(() => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    console.log(`Component rendered in ${endTime - startTime}ms`);
  };
}, []);
```

## 📚 Next Steps

### Explore Advanced Topics

1. **API Integration**
   - Study the OpenAPI specification at `/api-docs`
   - Build custom integrations with the REST API
   - Implement webhooks for real-time updates

2. **Database Deep Dive**
   - Learn Prisma query optimization
   - Implement custom database migrations
   - Explore soft delete and data retention features

3. **UI/UX Customization**
   - Customize Tailwind CSS themes
   - Create new React components
   - Implement responsive design patterns

4. **Testing Strategy**
   - Write comprehensive unit tests
   - Add integration test scenarios
   - Implement E2E testing with Playwright

### Contribute to the Project

1. **Fork the repository** on GitHub
2. **Create feature branches** for your changes
3. **Follow the coding standards** (ESLint + Prettier)
4. **Add tests** for new functionality
5. **Submit pull requests** with detailed descriptions

### Join the Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Share experiences and ask questions
- **Discord/Slack**: Join real-time community chat
- **Blog**: Write about your experiences with the platform

## 🎯 Success Criteria

By the end of this quickstart, you should be able to:

- [ ] **Set up** the development environment
- [ ] **Create and manage** AI assistant experiences
- [ ] **Interact** with the community features
- [ ] **Navigate** the admin interfaces
- [ ] **Make code changes** and see them reflected
- [ ] **Run tests** and ensure code quality
- [ ] **Debug common issues** independently
- [ ] **Understand** the project architecture

## 📖 Additional Resources

### Documentation
- [README.md](../README.md) - Project overview and setup
- [API Documentation](/api-docs) - Interactive API reference
- [Architecture Guide](architecture.md) - Technical deep dive
- [Deployment Guide](deployment.md) - Production deployment

### Code Examples
- [GitHub Repository](https://github.com/your-org/ai-assistant-platform)
- [Example Integrations](examples/)
- [Code Snippets](snippets/)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**🚀 Ready to start building? Follow this guide step by step and you'll be up and running in no time!**

**Questions?** Open an issue on GitHub or reach out to the community for help.