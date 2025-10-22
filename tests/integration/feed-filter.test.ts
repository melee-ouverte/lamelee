/**
 * Integration Test: Browse and Filter Feed by AI Assistant Type
 *
 * This test validates the complete feed browsing and filtering functionality.
 * Based on User Journey Validation from quickstart.md
 *
 * Test Status: RED (Must fail before implementation)
 * Related Task: T018
 * Implementation Tasks: T032 (GET /api/experiences), T053 (Feed page)
 */

import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth/next';
import handler from '@/pages/api/experiences/index';
import { prisma } from '@/lib/db';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/lib/db');

describe('Feed Filtering Integration', () => {
  const mockUser = {
    id: '1',
    githubId: 12345,
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockExperiences = [
    {
      id: 1,
      userId: 1,
      title: 'Using GitHub Copilot for React',
      description: 'Copilot helped with React components',
      aiAssistantType: 'GitHub Copilot',
      tags: ['react', 'components'],
      githubUrls: ['https://github.com/user/repo1'],
      isNews: false,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      user: { id: 1, username: 'user1', avatarUrl: 'avatar1.png' },
    },
    {
      id: 2,
      userId: 2,
      title: 'ChatGPT for API Design',
      description: 'Used ChatGPT to design REST APIs',
      aiAssistantType: 'ChatGPT',
      tags: ['api', 'design'],
      githubUrls: ['https://github.com/user/repo2'],
      isNews: false,
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-14'),
      user: { id: 2, username: 'user2', avatarUrl: 'avatar2.png' },
    },
    {
      id: 3,
      userId: 3,
      title: 'Claude for Documentation',
      description: 'Claude helped write technical documentation',
      aiAssistantType: 'Claude',
      tags: ['documentation', 'technical-writing'],
      githubUrls: ['https://github.com/user/repo3'],
      isNews: false,
      createdAt: new Date('2024-01-13'),
      updatedAt: new Date('2024-01-13'),
      user: { id: 3, username: 'user3', avatarUrl: 'avatar3.png' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticated user
    (getServerSession as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
  });

  describe('Feed Browsing', () => {
    it('should fetch all experiences in chronological order', async () => {
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(
        mockExperiences
      );
      (prisma.experience.count as jest.Mock).mockResolvedValue(3);

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.experiences).toHaveLength(3);
      expect(data.total).toBe(3);
      expect(data.page).toBe(1);

      // Verify chronological order (newest first)
      expect(
        new Date(data.experiences[0].created_at).getTime()
      ).toBeGreaterThan(new Date(data.experiences[1].created_at).getTime());
    });

    it('should implement pagination correctly', async () => {
      const paginatedResults = mockExperiences.slice(0, 2);
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(
        paginatedResults
      );
      (prisma.experience.count as jest.Mock).mockResolvedValue(3);

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '2' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.experiences).toHaveLength(2);
      expect(data.total).toBe(3);
      expect(data.page).toBe(1);
      expect(data.pages).toBe(2); // Math.ceil(3/2)
    });
  });

  describe('AI Assistant Type Filtering', () => {
    it('should filter by GitHub Copilot', async () => {
      const copilotExperiences = mockExperiences.filter(
        (exp) => exp.aiAssistantType === 'GitHub Copilot'
      );
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(
        copilotExperiences
      );
      (prisma.experience.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: { ai_assistant: 'GitHub Copilot' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.experiences).toHaveLength(1);
      expect(data.experiences[0].ai_assistant_type).toBe('GitHub Copilot');
      expect(data.experiences[0].title).toBe('Using GitHub Copilot for React');
    });

    it('should filter by ChatGPT', async () => {
      const chatgptExperiences = mockExperiences.filter(
        (exp) => exp.aiAssistantType === 'ChatGPT'
      );
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(
        chatgptExperiences
      );
      (prisma.experience.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: { ai_assistant: 'ChatGPT' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.experiences).toHaveLength(1);
      expect(data.experiences[0].ai_assistant_type).toBe('ChatGPT');
      expect(data.experiences[0].title).toBe('ChatGPT for API Design');
    });

    it('should filter by Claude', async () => {
      const claudeExperiences = mockExperiences.filter(
        (exp) => exp.aiAssistantType === 'Claude'
      );
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(
        claudeExperiences
      );
      (prisma.experience.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: { ai_assistant: 'Claude' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.experiences).toHaveLength(1);
      expect(data.experiences[0].ai_assistant_type).toBe('Claude');
      expect(data.experiences[0].title).toBe('Claude for Documentation');
    });
  });

  describe('Tag Filtering', () => {
    it('should filter by single tag', async () => {
      const reactExperiences = mockExperiences.filter((exp) =>
        exp.tags.includes('react')
      );
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(
        reactExperiences
      );
      (prisma.experience.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: { tags: ['react'] },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.experiences).toHaveLength(1);
      expect(data.experiences[0].tags).toContain('react');
    });

    it('should filter by multiple tags', async () => {
      const multiTagExperiences = mockExperiences.filter(
        (exp) => exp.tags.includes('api') || exp.tags.includes('documentation')
      );
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(
        multiTagExperiences
      );
      (prisma.experience.count as jest.Mock).mockResolvedValue(2);

      const { req, res } = createMocks({
        method: 'GET',
        query: { tags: ['api', 'documentation'] },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.experiences).toHaveLength(2);
    });
  });

  describe('Search Functionality', () => {
    it('should search by title and description content', async () => {
      const searchResults = mockExperiences.filter(
        (exp) =>
          exp.title.toLowerCase().includes('react') ||
          exp.description.toLowerCase().includes('react')
      );
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(
        searchResults
      );
      (prisma.experience.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'react' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.experiences).toHaveLength(1);
      expect(data.experiences[0].title).toMatch(/react/i);
    });

    it('should search across multiple fields', async () => {
      const searchResults = mockExperiences.filter(
        (exp) =>
          exp.title.toLowerCase().includes('api') ||
          exp.description.toLowerCase().includes('api') ||
          exp.tags.some((tag) => tag.toLowerCase().includes('api'))
      );
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(
        searchResults
      );
      (prisma.experience.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'api' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.experiences).toHaveLength(1);
    });
  });

  describe('Combined Filtering', () => {
    it('should combine AI assistant type and tag filters', async () => {
      const combinedResults = mockExperiences.filter(
        (exp) =>
          exp.aiAssistantType === 'GitHub Copilot' && exp.tags.includes('react')
      );
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(
        combinedResults
      );
      (prisma.experience.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          ai_assistant: 'GitHub Copilot',
          tags: ['react'],
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.experiences).toHaveLength(1);
      expect(data.experiences[0].ai_assistant_type).toBe('GitHub Copilot');
      expect(data.experiences[0].tags).toContain('react');
    });

    it('should combine search with filters', async () => {
      const combinedResults = mockExperiences.filter(
        (exp) =>
          exp.aiAssistantType === 'ChatGPT' &&
          exp.description.toLowerCase().includes('api')
      );
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(
        combinedResults
      );
      (prisma.experience.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          ai_assistant: 'ChatGPT',
          search: 'API',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.experiences).toHaveLength(1);
      expect(data.experiences[0].ai_assistant_type).toBe('ChatGPT');
    });
  });

  describe('Authentication Integration', () => {
    it('should require authentication for feed access', async () => {
      // Mock unauthenticated state
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      });

      await handler(req, res);

      expect([401, 302]).toContain(res._getStatusCode());
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.experience.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });

    it('should validate pagination parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { page: 'invalid', limit: 'invalid' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });
  });
});
