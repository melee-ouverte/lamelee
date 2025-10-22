/**
 * Integration Test: Create Experience with Prompt and GitHub URL
 *
 * This test validates the complete experience creation flow.
 * Based on User Journey Validation from quickstart.md
 *
 * Test Status: RED (Must fail before implementation)
 * Related Task: T017
 * Implementation Tasks: T033 (POST /api/experiences), T025-T026 (Experience/Prompt models)
 */

import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth/next';
import handler from '@/pages/api/experiences/index';
import { prisma } from '@/lib/db';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/lib/db');

describe('Create Experience Integration', () => {
  const mockUser = {
    id: '1',
    githubId: 12345,
    username: 'testuser',
    email: 'test@example.com',
    avatarUrl: 'https://github.com/testuser.png',
  };

  const validExperienceData = {
    title: 'Using GitHub Copilot for React Components',
    description:
      'Copilot helped me create reusable components faster with better TypeScript support. The AI understood the context of my design system and generated consistent, well-typed components.',
    ai_assistant_type: 'GitHub Copilot',
    tags: ['react', 'typescript', 'components', 'design-system'],
    github_urls: [
      'https://github.com/user/repo/blob/main/src/components/Button.tsx',
    ],
    is_news: false,
    prompts: [
      {
        content:
          'Create a reusable Button component with TypeScript that accepts variant, size, and disabled props',
        context:
          'Building a design system for our React application with consistent styling',
        results_achieved:
          'Generated clean, typed component with proper props interface and styled-components integration',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticated user
    (getServerSession as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
  });

  describe('Complete Experience Creation Flow', () => {
    it('should create experience with prompts through API', async () => {
      const createdExperience = {
        id: 1,
        userId: parseInt(mockUser.id),
        title: validExperienceData.title,
        description: validExperienceData.description,
        aiAssistantType: validExperienceData.ai_assistant_type,
        tags: validExperienceData.tags,
        githubUrls: validExperienceData.github_urls,
        isNews: validExperienceData.is_news,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdPrompt = {
        id: 1,
        experienceId: 1,
        content: validExperienceData.prompts[0].content,
        context: validExperienceData.prompts[0].context,
        resultsAchieved: validExperienceData.prompts[0].results_achieved,
        createdAt: new Date(),
      };

      // Mock database operations
      (prisma.experience.create as jest.Mock).mockResolvedValue(
        createdExperience
      );
      (prisma.prompt.create as jest.Mock).mockResolvedValue(createdPrompt);

      const { req, res } = createMocks({
        method: 'POST',
        body: validExperienceData,
        headers: { 'content-type': 'application/json' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);

      const responseData = JSON.parse(res._getData());
      expect(responseData.title).toBe(validExperienceData.title);
      expect(responseData.description).toBe(validExperienceData.description);
      expect(responseData.ai_assistant_type).toBe(
        validExperienceData.ai_assistant_type
      );
      expect(responseData.tags).toEqual(validExperienceData.tags);
      expect(responseData.github_urls).toEqual(validExperienceData.github_urls);
    });

    it('should validate required fields during creation', async () => {
      const invalidData = { ...validExperienceData } as any;
      delete invalidData.title;

      const { req, res } = createMocks({
        method: 'POST',
        body: invalidData,
        headers: { 'content-type': 'application/json' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);

      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toMatch(/title.*required/i);
    });

    it('should validate GitHub URLs during creation', async () => {
      const invalidData = {
        ...validExperienceData,
        github_urls: ['https://gitlab.com/user/repo'], // Not github.com
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: invalidData,
        headers: { 'content-type': 'application/json' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);

      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toMatch(/github.*url/i);
    });

    it('should create multiple prompts for single experience', async () => {
      const multiPromptData = {
        ...validExperienceData,
        prompts: [
          {
            content: 'Create a Button component',
            context: 'Design system work',
            results_achieved: 'Clean button component',
          },
          {
            content: 'Add loading state to Button',
            context: 'UX enhancement',
            results_achieved: 'Button with spinner animation',
          },
        ],
      };

      const createdExperience = {
        id: 1,
        userId: parseInt(mockUser.id),
        title: multiPromptData.title,
        description: multiPromptData.description,
        aiAssistantType: multiPromptData.ai_assistant_type,
        tags: multiPromptData.tags,
        githubUrls: multiPromptData.github_urls,
        isNews: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database operations
      (prisma.experience.create as jest.Mock).mockResolvedValue(
        createdExperience
      );
      (prisma.prompt.create as jest.Mock)
        .mockResolvedValueOnce({
          id: 1,
          experienceId: 1,
          ...multiPromptData.prompts[0],
        })
        .mockResolvedValueOnce({
          id: 2,
          experienceId: 1,
          ...multiPromptData.prompts[1],
        });

      const { req, res } = createMocks({
        method: 'POST',
        body: multiPromptData,
        headers: { 'content-type': 'application/json' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);

      const responseData = JSON.parse(res._getData());
      expect(responseData.title).toBe(multiPromptData.title);
    });
  });

  describe('Authentication Integration', () => {
    it('should require authentication for experience creation', async () => {
      // Mock unauthenticated state
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: validExperienceData,
        headers: { 'content-type': 'application/json' },
      });

      await handler(req, res);

      expect([401, 302]).toContain(res._getStatusCode());
    });

    it('should associate experience with authenticated user', async () => {
      const createdExperience = {
        id: 1,
        userId: parseInt(mockUser.id),
        title: validExperienceData.title,
        description: validExperienceData.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.experience.create as jest.Mock).mockResolvedValue(
        createdExperience
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: validExperienceData,
        headers: { 'content-type': 'application/json' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);

      const responseData = JSON.parse(res._getData());
      expect(responseData.user_id).toBe(parseInt(mockUser.id));
    });
  });

  describe('Data Persistence Integration', () => {
    it('should persist experience and prompts to database', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: validExperienceData,
        headers: { 'content-type': 'application/json' },
      });

      await handler(req, res);

      // Verify database calls were made
      expect(prisma.experience.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: parseInt(mockUser.id),
          title: validExperienceData.title,
          description: validExperienceData.description,
          aiAssistantType: validExperienceData.ai_assistant_type,
          tags: validExperienceData.tags,
          githubUrls: validExperienceData.github_urls,
          isNews: validExperienceData.is_news,
        }),
      });

      expect(prisma.prompt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          experienceId: expect.any(Number),
          content: validExperienceData.prompts[0].content,
          context: validExperienceData.prompts[0].context,
          resultsAchieved: validExperienceData.prompts[0].results_achieved,
        }),
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      (prisma.experience.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: validExperienceData,
        headers: { 'content-type': 'application/json' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);

      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toMatch(/internal.*error/i);
    });
  });

  describe('Tag and URL Processing', () => {
    it('should process and validate tags array', async () => {
      const taggedData = {
        ...validExperienceData,
        tags: [
          'react',
          'typescript',
          'components',
          'ai-assisted',
          'productivity',
        ],
      };

      const createdExperience = {
        id: 1,
        userId: parseInt(mockUser.id),
        title: taggedData.title,
        tags: taggedData.tags,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.experience.create as jest.Mock).mockResolvedValue(
        createdExperience
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: taggedData,
        headers: { 'content-type': 'application/json' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);

      const responseData = JSON.parse(res._getData());
      expect(responseData.tags).toEqual(taggedData.tags);
    });

    it('should validate and process GitHub URLs', async () => {
      const urlData = {
        ...validExperienceData,
        github_urls: [
          'https://github.com/user/repo/blob/main/Component.tsx',
          'https://github.com/user/repo/pull/123',
          'https://github.com/user/repo/issues/456',
        ],
      };

      const createdExperience = {
        id: 1,
        userId: parseInt(mockUser.id),
        githubUrls: urlData.github_urls,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.experience.create as jest.Mock).mockResolvedValue(
        createdExperience
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: urlData,
        headers: { 'content-type': 'application/json' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);

      const responseData = JSON.parse(res._getData());
      expect(responseData.github_urls).toEqual(urlData.github_urls);
    });
  });
});
