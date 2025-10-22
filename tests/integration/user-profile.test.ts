/**
 * Integration Test: User Profile and Statistics
 * 
 * This test validates user profile display with experience statistics.
 * Based on User Journey Validation from quickstart.md
 * 
 * Test Status: RED (Must fail before implementation)
 * Related Task: T020
 * Implementation Tasks: T042 (GET /api/users/{id}), T056 (profile page)
 */

import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth/next';
import handler from '@/pages/api/users/[id]';
import { prisma } from '@/lib/db';

jest.mock('next-auth/next');
jest.mock('@/lib/db');

describe('User Profile Integration', () => {
  const mockUser = {
    id: '1',
    githubId: 12345,
    username: 'testuser',
    email: 'test@example.com',
    avatarUrl: 'https://github.com/testuser.png',
    bio: 'Full-stack developer passionate about AI tools'
  };

  const mockUserProfile = {
    ...mockUser,
    experienceCount: 5,
    promptCount: 12,
    createdAt: new Date('2023-01-15')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });
  });

  describe('Profile Display', () => {
    it('should display user profile with GitHub information', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserProfile);
      (prisma.experience.count as jest.Mock).mockResolvedValue(5);
      (prisma.prompt.count as jest.Mock).mockResolvedValue(12);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.username).toBe(mockUser.username);
      expect(data.avatar_url).toBe(mockUser.avatarUrl);
      expect(data.bio).toBe(mockUser.bio);
      expect(data.github_id).toBe(mockUser.githubId);
    });

    it('should include experience and prompt statistics', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserProfile);
      (prisma.experience.count as jest.Mock).mockResolvedValue(5);
      (prisma.prompt.count as jest.Mock).mockResolvedValue(12);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.experience_count).toBe(5);
      expect(data.prompt_count).toBe(12);
      expect(typeof data.experience_count).toBe('number');
      expect(typeof data.prompt_count).toBe('number');
    });

    it('should calculate statistics correctly', async () => {
      // Mock user with different stats
      const userWithStats = {
        ...mockUserProfile,
        experienceCount: 3,
        promptCount: 8
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithStats);
      (prisma.experience.count as jest.Mock).mockResolvedValue(3);
      (prisma.prompt.count as jest.Mock).mockResolvedValue(8);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.experience_count).toBe(3);
      expect(data.prompt_count).toBe(8);
      
      // Verify database queries were called correctly
      expect(prisma.experience.count).toHaveBeenCalledWith({
        where: { userId: parseInt(mockUser.id) }
      });
      expect(prisma.prompt.count).toHaveBeenCalledWith({
        where: { experience: { userId: parseInt(mockUser.id) } }
      });
    });
  });

  describe('Profile Access Control', () => {
    it('should allow viewing any user profile when authenticated', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserProfile);
      (prisma.experience.count as jest.Mock).mockResolvedValue(5);
      (prisma.prompt.count as jest.Mock).mockResolvedValue(12);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '2' } // Different user ID
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('username');
      expect(data).toHaveProperty('experience_count');
      expect(data).toHaveProperty('prompt_count');
    });

    it('should require authentication for profile access', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' }
      });

      await handler(req, res);

      expect([401, 302]).toContain(res._getStatusCode());
    });

    it('should return 404 for non-existent users', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '99999' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      
      const data = JSON.parse(res._getData());
      expect(data.error).toMatch(/user.*not found/i);
    });
  });

  describe('Profile Statistics Edge Cases', () => {
    it('should handle users with zero contributions', async () => {
      const newUser = {
        ...mockUserProfile,
        experienceCount: 0,
        promptCount: 0
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(newUser);
      (prisma.experience.count as jest.Mock).mockResolvedValue(0);
      (prisma.prompt.count as jest.Mock).mockResolvedValue(0);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.experience_count).toBe(0);
      expect(data.prompt_count).toBe(0);
    });

    it('should handle users with high contribution counts', async () => {
      const activeUser = {
        ...mockUserProfile,
        experienceCount: 150,
        promptCount: 500
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);
      (prisma.experience.count as jest.Mock).mockResolvedValue(150);
      (prisma.prompt.count as jest.Mock).mockResolvedValue(500);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.experience_count).toBe(150);
      expect(data.prompt_count).toBe(500);
    });
  });

  describe('Bio and Profile Information', () => {
    it('should handle users with null bio', async () => {
      const userWithoutBio = {
        ...mockUserProfile,
        bio: null
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithoutBio);
      (prisma.experience.count as jest.Mock).mockResolvedValue(5);
      (prisma.prompt.count as jest.Mock).mockResolvedValue(12);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.bio).toBeNull();
      expect(data.username).toBe(mockUser.username);
    });

    it('should handle users with optional email', async () => {
      const userWithoutEmail = {
        ...mockUserProfile,
        email: null
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithoutEmail);
      (prisma.experience.count as jest.Mock).mockResolvedValue(5);
      (prisma.prompt.count as jest.Mock).mockResolvedValue(12);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.email).toBeNull();
      expect(data.username).toBe(mockUser.username);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });

    it('should validate user ID parameter', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'invalid' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const data = JSON.parse(res._getData());
      expect(data.error).toMatch(/invalid.*id/i);
    });
  });
});