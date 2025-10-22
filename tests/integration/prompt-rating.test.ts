/**
 * Integration Test: Prompt Rating System (1-5 Scale)
 * 
 * This test validates the complete prompt rating functionality.
 * Based on User Journey Validation from quickstart.md
 * 
 * Test Status: RED (Must fail before implementation)
 * Related Task: T022
 * Implementation Tasks: T040 (POST /api/prompts/{id}/ratings)
 */

import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth/next';
import handler from '@/pages/api/prompts/[id]/ratings';
import { prisma } from '@/lib/db';

jest.mock('next-auth/next');
jest.mock('@/lib/db');

describe('Prompt Rating Integration', () => {
  const mockUser = {
    id: '1',
    githubId: 12345,
    username: 'testuser',
    email: 'test@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });
  });

  describe('Rating Creation', () => {
    it('should create rating with valid 1-5 scale', async () => {
      const ratingData = { rating: 5 };

      const createdRating = {
        id: 1,
        userId: parseInt(mockUser.id),
        promptId: 1,
        rating: 5,
        createdAt: new Date()
      };

      const updatedPrompt = {
        id: 1,
        averageRating: 4.5,
        ratingCount: 3
      };

      (prisma.promptRating.create as jest.Mock).mockResolvedValue(createdRating);
      (prisma.prompt.update as jest.Mock).mockResolvedValue(updatedPrompt);

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: ratingData,
        headers: { 'content-type': 'application/json' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      
      const data = JSON.parse(res._getData());
      expect(data.rating).toBe(5);
      expect(data.user_id).toBe(parseInt(mockUser.id));
      expect(data.prompt_id).toBe(1);
    });

    it('should validate rating range (1-5)', async () => {
      const invalidRatings = [0, 6, -1, 10];

      for (const rating of invalidRatings) {
        const { req, res } = createMocks({
          method: 'POST',
          query: { id: '1' },
          body: { rating },
          headers: { 'content-type': 'application/json' }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        
        const data = JSON.parse(res._getData());
        expect(data.error).toMatch(/rating.*1.*5/i);
      }
    });

    it('should validate rating is integer', async () => {
      const floatRating = { rating: 3.5 };

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: floatRating,
        headers: { 'content-type': 'application/json' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const data = JSON.parse(res._getData());
      expect(data.error).toMatch(/rating.*integer/i);
    });
  });

  describe('Average Rating Calculation', () => {
    it('should calculate average rating after new rating', async () => {
      const ratingData = { rating: 4 };

      // Mock existing ratings for average calculation
      (prisma.promptRating.findMany as jest.Mock).mockResolvedValue([
        { rating: 5 },
        { rating: 3 },
        { rating: 4 } // New rating
      ]);

      const createdRating = {
        id: 1,
        userId: parseInt(mockUser.id),
        promptId: 1,
        rating: 4,
        createdAt: new Date()
      };

      const updatedPrompt = {
        id: 1,
        averageRating: 4.0, // (5 + 3 + 4) / 3 = 4.0
        ratingCount: 3
      };

      (prisma.promptRating.create as jest.Mock).mockResolvedValue(createdRating);
      (prisma.prompt.update as jest.Mock).mockResolvedValue(updatedPrompt);

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: ratingData,
        headers: { 'content-type': 'application/json' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      
      const data = JSON.parse(res._getData());
      expect(data.average_rating).toBe(4.0);
      expect(data.rating_count).toBe(3);
    });

    it('should handle first rating (average equals rating)', async () => {
      const ratingData = { rating: 5 };

      (prisma.promptRating.findMany as jest.Mock).mockResolvedValue([
        { rating: 5 } // First rating
      ]);

      const createdRating = {
        id: 1,
        userId: parseInt(mockUser.id),
        promptId: 1,
        rating: 5,
        createdAt: new Date()
      };

      const updatedPrompt = {
        id: 1,
        averageRating: 5.0,
        ratingCount: 1
      };

      (prisma.promptRating.create as jest.Mock).mockResolvedValue(createdRating);
      (prisma.prompt.update as jest.Mock).mockResolvedValue(updatedPrompt);

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: ratingData,
        headers: { 'content-type': 'application/json' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      
      const data = JSON.parse(res._getData());
      expect(data.average_rating).toBe(5.0);
      expect(data.rating_count).toBe(1);
    });

    it('should calculate correct average with multiple ratings', async () => {
      const ratingData = { rating: 2 };

      // Mock existing ratings
      (prisma.promptRating.findMany as jest.Mock).mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 5 },
        { rating: 2 } // New rating
      ]);

      const updatedPrompt = {
        id: 1,
        averageRating: 3.8, // (5 + 4 + 3 + 5 + 2) / 5 = 3.8
        ratingCount: 5
      };

      (prisma.promptRating.create as jest.Mock).mockResolvedValue({
        id: 1,
        userId: parseInt(mockUser.id),
        promptId: 1,
        rating: 2
      });

      (prisma.prompt.update as jest.Mock).mockResolvedValue(updatedPrompt);

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: ratingData,
        headers: { 'content-type': 'application/json' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      
      const data = JSON.parse(res._getData());
      expect(data.average_rating).toBe(3.8);
      expect(data.rating_count).toBe(5);
    });
  });

  describe('Unique Constraint Handling', () => {
    it('should handle unique constraint (one rating per user per prompt)', async () => {
      const ratingData = { rating: 4 };

      // Mock unique constraint violation
      (prisma.promptRating.create as jest.Mock).mockRejectedValue({
        code: 'P2002', // Prisma unique constraint error
        meta: { target: ['userId', 'promptId'] }
      });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: ratingData,
        headers: { 'content-type': 'application/json' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(409);
      
      const data = JSON.parse(res._getData());
      expect(data.error).toMatch(/already rated/i);
    });

    it('should update existing rating instead of creating duplicate', async () => {
      const ratingData = { rating: 3 };

      // Mock upsert behavior
      const updatedRating = {
        id: 1,
        userId: parseInt(mockUser.id),
        promptId: 1,
        rating: 3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      };

      (prisma.promptRating.upsert as jest.Mock).mockResolvedValue(updatedRating);
      (prisma.prompt.update as jest.Mock).mockResolvedValue({
        id: 1,
        averageRating: 3.5,
        ratingCount: 2
      });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: ratingData,
        headers: { 'content-type': 'application/json' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      
      const data = JSON.parse(res._getData());
      expect(data.rating).toBe(3);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for rating', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: { rating: 5 },
        headers: { 'content-type': 'application/json' }
      });

      await handler(req, res);

      expect([401, 302]).toContain(res._getStatusCode());
    });

    it('should verify prompt exists before rating', async () => {
      (prisma.prompt.findUnique as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '99999' },
        body: { rating: 5 },
        headers: { 'content-type': 'application/json' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      
      const data = JSON.parse(res._getData());
      expect(data.error).toMatch(/prompt.*not found/i);
    });
  });

  describe('Rating Distribution', () => {
    it('should handle all valid rating values', async () => {
      const validRatings = [1, 2, 3, 4, 5];

      for (const rating of validRatings) {
        (prisma.promptRating.create as jest.Mock).mockResolvedValue({
          id: 1,
          userId: parseInt(mockUser.id),
          promptId: 1,
          rating
        });

        (prisma.prompt.update as jest.Mock).mockResolvedValue({
          id: 1,
          averageRating: rating,
          ratingCount: 1
        });

        const { req, res } = createMocks({
          method: 'POST',
          query: { id: '1' },
          body: { rating },
          headers: { 'content-type': 'application/json' }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(201);
        
        const data = JSON.parse(res._getData());
        expect(data.rating).toBe(rating);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.promptRating.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
        body: { rating: 5 },
        headers: { 'content-type': 'application/json' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });

    it('should validate prompt ID parameter', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'invalid' },
        body: { rating: 5 },
        headers: { 'content-type': 'application/json' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const data = JSON.parse(res._getData());
      expect(data.error).toMatch(/invalid.*id/i);
    });
  });
});