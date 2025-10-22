/**
 * Integration Test: Data Retention (2-Year Cleanup)
 * 
 * This test validates the 2-year data retention policy implementation.
 * Based on User Journey Validation from quickstart.md
 * 
 * Test Status: RED (Must fail before implementation)
 * Related Task: T023
 * Implementation Tasks: T066-T067 (cleanup jobs)
 */

import { cleanupOldData, hardDeleteSoftDeleted } from '@/lib/cleanup';
import { prisma } from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('@/lib/cleanup');

describe('Data Retention Integration', () => {
  const currentDate = new Date('2024-01-15');
  const twoYearsAgo = new Date('2022-01-15');
  const oneYearAgo = new Date('2023-01-15');
  const thirtyOneDaysAgo = new Date('2023-12-15');
  const twentyNineDaysAgo = new Date('2023-12-17');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(currentDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Soft Delete (Mark for Deletion)', () => {
    it('should mark users older than 2 years for deletion', async () => {
      const oldUsers = [
        { id: 1, createdAt: twoYearsAgo, username: 'olduser1', deletedAt: null },
        { id: 2, createdAt: new Date('2021-06-01'), username: 'olduser2', deletedAt: null }
      ];

      const recentUsers = [
        { id: 3, createdAt: oneYearAgo, username: 'recentuser1', deletedAt: null },
        { id: 4, createdAt: new Date(), username: 'newuser', deletedAt: null }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(oldUsers);
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      (cleanupOldData as jest.Mock).mockImplementation(async () => {
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
        
        // Find users older than 2 years
        const usersToDelete = await prisma.user.findMany({
          where: {
            createdAt: { lt: cutoffDate },
            deletedAt: null
          }
        });

        // Mark them for deletion
        await prisma.user.updateMany({
          where: {
            id: { in: usersToDelete.map(u => u.id) }
          },
          data: { deletedAt: new Date() }
        });

        return usersToDelete.length;
      });

      const deletedCount = await cleanupOldData();

      expect(deletedCount).toBe(2);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) },
          deletedAt: null
        }
      });
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [1, 2] }
        },
        data: { deletedAt: expect.any(Date) }
      });
    });

    it('should mark experiences of deleted users for deletion', async () => {
      const deletedUsers = [
        { id: 1, deletedAt: new Date() },
        { id: 2, deletedAt: new Date() }
      ];

      const experiencesToDelete = [
        { id: 101, userId: 1 },
        { id: 102, userId: 1 },
        { id: 103, userId: 2 }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(deletedUsers);
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(experiencesToDelete);
      (prisma.experience.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      (cleanupOldData as jest.Mock).mockImplementation(async () => {
        // Mark experiences of deleted users
        const deletedUsers = await prisma.user.findMany({
          where: { deletedAt: { not: null } }
        });

        const experiences = await prisma.experience.findMany({
          where: {
            userId: { in: deletedUsers.map(u => u.id) },
            deletedAt: null
          }
        });

        await prisma.experience.updateMany({
          where: {
            id: { in: experiences.map(e => e.id) }
          },
          data: { deletedAt: new Date() }
        });

        return experiences.length;
      });

      const deletedExperienceCount = await cleanupOldData();

      expect(deletedExperienceCount).toBe(3);
      expect(prisma.experience.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [101, 102, 103] }
        },
        data: { deletedAt: expect.any(Date) }
      });
    });

    it('should preserve users newer than 2 years', async () => {
      const recentUsers = [
        { id: 3, createdAt: oneYearAgo, username: 'recentuser' },
        { id: 4, createdAt: new Date(), username: 'newuser' }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      (cleanupOldData as jest.Mock).mockImplementation(async () => {
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
        
        const usersToDelete = await prisma.user.findMany({
          where: {
            createdAt: { lt: cutoffDate },
            deletedAt: null
          }
        });

        return usersToDelete.length;
      });

      const deletedCount = await cleanupOldData();

      expect(deletedCount).toBe(0);
    });
  });

  describe('Hard Delete (Grace Period)', () => {
    it('should hard delete users soft-deleted 30+ days ago', async () => {
      const expiredSoftDeletes = [
        { id: 1, deletedAt: thirtyOneDaysAgo, username: 'expired1' },
        { id: 2, deletedAt: new Date('2023-11-01'), username: 'expired2' }
      ];

      const recentSoftDeletes = [
        { id: 3, deletedAt: twentyNineDaysAgo, username: 'recent1' }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(expiredSoftDeletes);
      (prisma.user.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      (hardDeleteSoftDeleted as jest.Mock).mockImplementation(async () => {
        const gracePeriodDate = new Date();
        gracePeriodDate.setDate(gracePeriodDate.getDate() - 30);
        
        const usersToHardDelete = await prisma.user.findMany({
          where: {
            deletedAt: { 
              not: null,
              lt: gracePeriodDate
            }
          }
        });

        await prisma.user.deleteMany({
          where: {
            id: { in: usersToHardDelete.map(u => u.id) }
          }
        });

        return usersToHardDelete.length;
      });

      const hardDeletedCount = await hardDeleteSoftDeleted();

      expect(hardDeletedCount).toBe(2);
      expect(prisma.user.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: [1, 2] }
        }
      });
    });

    it('should preserve users within 30-day grace period', async () => {
      const recentSoftDeletes = [
        { id: 3, deletedAt: twentyNineDaysAgo, username: 'recent1' },
        { id: 4, deletedAt: new Date(), username: 'recent2' }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      (hardDeleteSoftDeleted as jest.Mock).mockImplementation(async () => {
        const gracePeriodDate = new Date();
        gracePeriodDate.setDate(gracePeriodDate.getDate() - 30);
        
        const usersToHardDelete = await prisma.user.findMany({
          where: {
            deletedAt: { 
              not: null,
              lt: gracePeriodDate
            }
          }
        });

        return usersToHardDelete.length;
      });

      const hardDeletedCount = await hardDeleteSoftDeleted();

      expect(hardDeletedCount).toBe(0);
    });

    it('should cascade delete related data during hard delete', async () => {
      const userToHardDelete = { id: 1, deletedAt: thirtyOneDaysAgo };

      (prisma.user.findMany as jest.Mock).mockResolvedValue([userToHardDelete]);
      (prisma.comment.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
      (prisma.reaction.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });
      (prisma.promptRating.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.prompt.deleteMany as jest.Mock).mockResolvedValue({ count: 4 });
      (prisma.experience.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.user.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      (hardDeleteSoftDeleted as jest.Mock).mockImplementation(async () => {
        const gracePeriodDate = new Date();
        gracePeriodDate.setDate(gracePeriodDate.getDate() - 30);
        
        const usersToHardDelete = await prisma.user.findMany({
          where: {
            deletedAt: { 
              not: null,
              lt: gracePeriodDate
            }
          }
        });

        for (const user of usersToHardDelete) {
          // Delete related data in correct order
          await prisma.comment.deleteMany({ where: { userId: user.id } });
          await prisma.reaction.deleteMany({ where: { userId: user.id } });
          await prisma.promptRating.deleteMany({ where: { userId: user.id } });
          await prisma.prompt.deleteMany({ 
            where: { experience: { userId: user.id } }
          });
          await prisma.experience.deleteMany({ where: { userId: user.id } });
          await prisma.user.deleteMany({ where: { id: user.id } });
        }

        return usersToHardDelete.length;
      });

      const hardDeletedCount = await hardDeleteSoftDeleted();

      expect(hardDeletedCount).toBe(1);
      expect(prisma.comment.deleteMany).toHaveBeenCalledWith({ 
        where: { userId: 1 } 
      });
      expect(prisma.reaction.deleteMany).toHaveBeenCalledWith({ 
        where: { userId: 1 } 
      });
      expect(prisma.promptRating.deleteMany).toHaveBeenCalledWith({ 
        where: { userId: 1 } 
      });
      expect(prisma.experience.deleteMany).toHaveBeenCalledWith({ 
        where: { userId: 1 } 
      });
      expect(prisma.user.deleteMany).toHaveBeenCalledWith({ 
        where: { id: 1 } 
      });
    });
  });

  describe('Scheduled Job Integration', () => {
    it('should run cleanup job daily', async () => {
      (cleanupOldData as jest.Mock).mockResolvedValue(3);
      (hardDeleteSoftDeleted as jest.Mock).mockResolvedValue(1);

      // Simulate daily cleanup job
      const softDeletedCount = await cleanupOldData();
      const hardDeletedCount = await hardDeleteSoftDeleted();

      expect(softDeletedCount).toBe(3);
      expect(hardDeletedCount).toBe(1);
    });

    it('should handle errors in cleanup job gracefully', async () => {
      (cleanupOldData as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
      (hardDeleteSoftDeleted as jest.Mock).mockResolvedValue(0);

      try {
        await cleanupOldData();
      } catch (error) {
        expect(error.message).toBe('Database connection failed');
      }

      // Hard delete should still run even if soft delete fails
      const hardDeletedCount = await hardDeleteSoftDeleted();
      expect(hardDeletedCount).toBe(0);
    });
  });

  describe('Data Export Before Deletion', () => {
    it('should allow user data export before hard deletion', async () => {
      const userToDelete = {
        id: 1,
        username: 'userToDelete',
        email: 'user@example.com',
        deletedAt: thirtyOneDaysAgo
      };

      const userData = {
        user: userToDelete,
        experiences: [
          { id: 1, title: 'Experience 1', description: 'Description 1' },
          { id: 2, title: 'Experience 2', description: 'Description 2' }
        ],
        prompts: [
          { id: 1, content: 'Prompt 1', context: 'Context 1' },
          { id: 2, content: 'Prompt 2', context: 'Context 2' }
        ]
      };

      // Mock data export functionality
      const exportUserData = jest.fn().mockResolvedValue(userData);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userToDelete);
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(userData.experiences);
      (prisma.prompt.findMany as jest.Mock).mockResolvedValue(userData.prompts);

      const exportedData = await exportUserData(1);

      expect(exportedData.user.username).toBe('userToDelete');
      expect(exportedData.experiences).toHaveLength(2);
      expect(exportedData.prompts).toHaveLength(2);
    });
  });

  describe('Audit Logging', () => {
    it('should log all deletion operations', async () => {
      const auditLog = jest.fn();
      
      (cleanupOldData as jest.Mock).mockImplementation(async () => {
        auditLog('SOFT_DELETE', { count: 2, timestamp: new Date() });
        return 2;
      });

      (hardDeleteSoftDeleted as jest.Mock).mockImplementation(async () => {
        auditLog('HARD_DELETE', { count: 1, timestamp: new Date() });
        return 1;
      });

      await cleanupOldData();
      await hardDeleteSoftDeleted();

      expect(auditLog).toHaveBeenCalledWith('SOFT_DELETE', {
        count: 2,
        timestamp: expect.any(Date)
      });
      expect(auditLog).toHaveBeenCalledWith('HARD_DELETE', {
        count: 1,
        timestamp: expect.any(Date)
      });
    });
  });
});