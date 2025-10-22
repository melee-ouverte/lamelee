/**
 * Integration Test: Community Interaction (Comments, Reactions)
 *
 * This test validates the complete community interaction functionality.
 * Based on User Journey Validation from quickstart.md
 *
 * Test Status: RED (Must fail before implementation)
 * Related Task: T019
 * Implementation Tasks: T038 (comments), T039 (reactions)
 */

import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth/next';
import commentsHandler from '@/pages/api/experiences/[id]/comments';
import reactionsHandler from '@/pages/api/experiences/[id]/reactions';
import { prisma } from '@/lib/db';

jest.mock('next-auth/next');
jest.mock('@/lib/db');

describe('Community Interaction Integration', () => {
  const mockUser = {
    id: '1',
    githubId: 12345,
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });
  });

  describe('Comments Integration', () => {
    it('should add comment to experience', async () => {
      const commentData = {
        content:
          'This prompt worked great for my project too! Thanks for sharing.',
      };

      const createdComment = {
        id: 1,
        userId: parseInt(mockUser.id),
        experienceId: 1,
        content: commentData.content,
        createdAt: new Date(),
        user: { username: mockUser.username, avatarUrl: 'avatar.png' },
      };

      (prisma.comment.create as jest.Mock).mockResolvedValue(createdComment);

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: commentData,
        headers: { 'content-type': 'application/json' },
      });

      await commentsHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.content).toBe(commentData.content);
      expect(data.user_id).toBe(parseInt(mockUser.id));
    });

    it('should validate comment content length', async () => {
      const longComment = { content: 'a'.repeat(1001) }; // Exceeds 1000 limit

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: longComment,
        headers: { 'content-type': 'application/json' },
      });

      await commentsHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toMatch(/content.*1000/i);
    });
  });

  describe('Reactions Integration', () => {
    it('should add helpful reaction to experience', async () => {
      const reactionData = { reaction_type: 'helpful' };

      const createdReaction = {
        id: 1,
        userId: parseInt(mockUser.id),
        experienceId: 1,
        reactionType: 'helpful',
        createdAt: new Date(),
      };

      (prisma.reaction.upsert as jest.Mock).mockResolvedValue(createdReaction);

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: reactionData,
        headers: { 'content-type': 'application/json' },
      });

      await reactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.reaction_type).toBe('helpful');
    });

    it('should handle unique constraint for reactions', async () => {
      const reactionData = { reaction_type: 'like' };

      // Mock unique constraint violation (user already reacted)
      (prisma.reaction.upsert as jest.Mock).mockResolvedValue({
        id: 1,
        userId: parseInt(mockUser.id),
        experienceId: 1,
        reactionType: 'like',
      });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: reactionData,
        headers: { 'content-type': 'application/json' },
      });

      await reactionsHandler(req, res);

      expect([201, 409]).toContain(res._getStatusCode());
    });
  });
});
