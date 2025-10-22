/**
 * T066-T067: Data Cleanup and Retention Utilities
 *
 * Implements 2-year data retention policy with 30-day grace period
 * for the AI Coding Assistant platform.
 */

import { prisma } from './db';

/**
 * Cleanup configuration
 */
const CLEANUP_CONFIG = {
  RETENTION_YEARS: 2,
  GRACE_PERIOD_DAYS: 30,
  BATCH_SIZE: 100, // Process records in batches to avoid timeouts
};

/**
 * T066: Soft Delete (Mark for Deletion)
 * Marks users older than 2 years for deletion (soft delete)
 */
export async function cleanupOldData(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(
      cutoffDate.getFullYear() - CLEANUP_CONFIG.RETENTION_YEARS
    );

    // Find users older than 2 years that haven't been soft-deleted
    const usersToDelete = await prisma.user.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        deletedAt: null,
      },
      select: { id: true },
      take: CLEANUP_CONFIG.BATCH_SIZE,
    });

    if (usersToDelete.length === 0) {
      return 0;
    }

    const userIds = usersToDelete.map((u) => u.id);

    // Start transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Mark users for deletion
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { deletedAt: new Date() },
      });

      // Mark their experiences for deletion
      await tx.experience.updateMany({
        where: {
          userId: { in: userIds },
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      // Mark prompts of their experiences for deletion
      const experiences = await tx.experience.findMany({
        where: { userId: { in: userIds } },
        select: { id: true },
      });

      if (experiences.length > 0) {
        const experienceIds = experiences.map((e) => e.id);

        await tx.prompt.updateMany({
          where: {
            experienceId: { in: experienceIds },
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });
      }

      // Mark comments for deletion
      await tx.comment.updateMany({
        where: {
          userId: { in: userIds },
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      return userIds.length;
    });

    // Log the operation
    console.log(`Soft deleted ${result} users and their associated data`, {
      cutoffDate: cutoffDate.toISOString(),
      userIds,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Failed to cleanup old data:', error);
    throw error;
  }
}

/**
 * T067: Hard Delete (Grace Period Cleanup)
 * Permanently deletes users that have been soft-deleted for 30+ days
 */
export async function hardDeleteSoftDeleted(): Promise<number> {
  try {
    const gracePeriodDate = new Date();
    gracePeriodDate.setDate(
      gracePeriodDate.getDate() - CLEANUP_CONFIG.GRACE_PERIOD_DAYS
    );

    // Find users soft-deleted more than 30 days ago
    const usersToHardDelete = await prisma.user.findMany({
      where: {
        deletedAt: {
          not: null,
          lt: gracePeriodDate,
        },
      },
      select: { id: true, username: true },
      take: CLEANUP_CONFIG.BATCH_SIZE,
    });

    if (usersToHardDelete.length === 0) {
      return 0;
    }

    const userIds = usersToHardDelete.map((u) => u.id);

    // Hard delete in correct order due to foreign key constraints
    const result = await prisma.$transaction(async (tx) => {
      // Delete comments first
      await tx.comment.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Delete reactions
      await tx.reaction.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Delete prompt ratings
      await tx.promptRating.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Delete prompts (via experiences)
      const experiences = await tx.experience.findMany({
        where: { userId: { in: userIds } },
        select: { id: true },
      });

      if (experiences.length > 0) {
        const experienceIds = experiences.map((e) => e.id);

        // Delete prompt ratings for these experiences
        await tx.promptRating.deleteMany({
          where: {
            prompt: {
              experienceId: { in: experienceIds },
            },
          },
        });

        // Delete prompts
        await tx.prompt.deleteMany({
          where: { experienceId: { in: experienceIds } },
        });

        // Delete comments on these experiences
        await tx.comment.deleteMany({
          where: { experienceId: { in: experienceIds } },
        });

        // Delete reactions on these experiences
        await tx.reaction.deleteMany({
          where: { experienceId: { in: experienceIds } },
        });
      }

      // Delete experiences
      await tx.experience.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Finally, delete users
      await tx.user.deleteMany({
        where: { id: { in: userIds } },
      });

      return userIds.length;
    });

    // Log the operation
    console.log(`Hard deleted ${result} users and all associated data`, {
      gracePeriodDate: gracePeriodDate.toISOString(),
      userIds,
      usernames: usersToHardDelete.map((u) => u.username),
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Failed to hard delete soft-deleted data:', error);
    throw error;
  }
}

/**
 * Export user data before hard deletion (for compliance)
 */
export async function exportUserData(userId: number): Promise<any> {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        experiences: {
          include: {
            prompts: true,
            comments: true,
            reactions: true,
          },
        },
        comments: true,
        reactions: true,
        promptRatings: {
          include: {
            prompt: true,
          },
        },
      },
    });

    if (!userData) {
      throw new Error(`User ${userId} not found`);
    }

    // Structure export data
    return {
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        bio: userData.bio,
        createdAt: userData.createdAt,
        githubUsername: userData.githubUsername,
      },
      experiences: userData.experiences.map((exp) => ({
        id: exp.id,
        title: exp.title,
        description: exp.description,
        githubUrl: exp.githubUrl,
        aiAssistant: exp.aiAssistant,
        tags: exp.tags,
        createdAt: exp.createdAt,
        prompts: exp.prompts.map((prompt) => ({
          id: prompt.id,
          content: prompt.content,
          context: prompt.context,
          orderIndex: prompt.orderIndex,
          createdAt: prompt.createdAt,
        })),
        comments: exp.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
        })),
        reactions: exp.reactions.map((reaction) => ({
          id: reaction.id,
          reactionType: reaction.reactionType,
          createdAt: reaction.createdAt,
        })),
      })),
      comments: userData.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        experienceId: comment.experienceId,
        createdAt: comment.createdAt,
      })),
      reactions: userData.reactions.map((reaction) => ({
        id: reaction.id,
        reactionType: reaction.reactionType,
        experienceId: reaction.experienceId,
        createdAt: reaction.createdAt,
      })),
      promptRatings: userData.promptRatings.map((rating) => ({
        id: rating.id,
        rating: rating.rating,
        promptId: rating.promptId,
        createdAt: rating.createdAt,
      })),
      exportedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to export user data for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Scheduled cleanup job that can be run daily
 */
export async function runScheduledCleanup(): Promise<{
  softDeleted: number;
  hardDeleted: number;
}> {
  try {
    console.log('Starting scheduled cleanup job...', {
      timestamp: new Date().toISOString(),
      config: CLEANUP_CONFIG,
    });

    const softDeleted = await cleanupOldData();
    const hardDeleted = await hardDeleteSoftDeleted();

    console.log('Scheduled cleanup job completed', {
      softDeleted,
      hardDeleted,
      timestamp: new Date().toISOString(),
    });

    return { softDeleted, hardDeleted };
  } catch (error) {
    console.error('Scheduled cleanup job failed:', error);
    throw error;
  }
}

/**
 * Get cleanup statistics
 */
export async function getCleanupStats() {
  try {
    const [
      totalUsers,
      activeUsers,
      softDeletedUsers,
      totalExperiences,
      activeExperiences,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: { not: null } } }),
      prisma.experience.count(),
      prisma.experience.count({ where: { deletedAt: null } }),
    ]);

    const cutoffDate = new Date();
    cutoffDate.setFullYear(
      cutoffDate.getFullYear() - CLEANUP_CONFIG.RETENTION_YEARS
    );

    const gracePeriodDate = new Date();
    gracePeriodDate.setDate(
      gracePeriodDate.getDate() - CLEANUP_CONFIG.GRACE_PERIOD_DAYS
    );

    const [eligibleForSoftDelete, eligibleForHardDelete] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { lt: cutoffDate },
          deletedAt: null,
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: {
            not: null,
            lt: gracePeriodDate,
          },
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        softDeleted: softDeletedUsers,
        eligibleForSoftDelete,
        eligibleForHardDelete,
      },
      experiences: {
        total: totalExperiences,
        active: activeExperiences,
      },
      config: CLEANUP_CONFIG,
      dates: {
        softDeleteCutoff: cutoffDate.toISOString(),
        hardDeleteCutoff: gracePeriodDate.toISOString(),
        now: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Failed to get cleanup stats:', error);
    throw error;
  }
}
