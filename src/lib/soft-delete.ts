/**
 * T063: Soft Delete Service
 *
 * Implements comprehensive soft delete functionality for User and Experience models
 * with proper cascade handling and data retention policy support.
 */

import { prisma } from './db';
import type { Prisma } from '@prisma/client';

export interface SoftDeleteOptions {
  /**
   * Whether to cascade soft delete to related records
   */
  cascade?: boolean;

  /**
   * Custom deleted timestamp (useful for scheduled deletions)
   */
  deletedAt?: Date;

  /**
   * Additional metadata to store with the deletion
   */
  deletionReason?: string;
}

export class SoftDeleteService {
  /**
   * Soft delete a user and optionally cascade to their experiences
   */
  static async deleteUser(userId: number, options: SoftDeleteOptions = {}) {
    const { cascade = true, deletedAt = new Date(), deletionReason } = options;

    try {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Mark user as deleted
        const deletedUser = await tx.user.update({
          where: { id: userId },
          data: {
            deletedAt,
            // Store deletion reason in bio field as metadata
            ...(deletionReason && {
              bio: `[DELETED: ${deletionReason}] ${new Date().toISOString()}`,
            }),
          },
        });

        let deletedExperiences: any[] = [];

        if (cascade) {
          // Get user's active experiences
          const userExperiences = await tx.experience.findMany({
            where: {
              userId,
              deletedAt: null,
            },
            select: { id: true },
          });

          // Soft delete all user experiences
          if (userExperiences.length > 0) {
            await tx.experience.updateMany({
              where: {
                userId,
                deletedAt: null,
              },
              data: { deletedAt },
            });

            // Soft delete all prompts from user experiences
            await tx.prompt.updateMany({
              where: {
                experienceId: {
                  in: userExperiences.map((e: { id: number }) => e.id),
                },
                deletedAt: null,
              },
              data: { deletedAt },
            });

            // Soft delete all comments from user experiences
            await tx.comment.updateMany({
              where: {
                experienceId: {
                  in: userExperiences.map((e: { id: number }) => e.id),
                },
                deletedAt: null,
              },
              data: { deletedAt },
            });

            deletedExperiences = userExperiences;
          }

          // Also soft delete user's comments on other experiences
          await tx.comment.updateMany({
            where: {
              userId,
              deletedAt: null,
            },
            data: { deletedAt },
          });
        }

        return {
          user: deletedUser,
          cascadedExperiences: deletedExperiences.length,
          deletedAt,
        };
      });
    } catch (error) {
      console.error(`Failed to soft delete user ${userId}:`, error);
      throw new Error(
        `Soft delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Soft delete an experience and cascade to related records
   */
  static async deleteExperience(
    experienceId: number,
    options: SoftDeleteOptions = {}
  ) {
    const { deletedAt = new Date(), deletionReason } = options;

    try {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Mark experience as deleted
        const deletedExperience = await tx.experience.update({
          where: { id: experienceId },
          data: {
            deletedAt,
            // Store deletion reason in description
            ...(deletionReason && {
              description: `[DELETED: ${deletionReason}] ${new Date().toISOString()}\n\n${await tx.experience.findUnique({ where: { id: experienceId }, select: { description: true } }).then((e: { description: string | null } | null) => e?.description || '')}`,
            }),
          },
        });

        // Soft delete all prompts
        await tx.prompt.updateMany({
          where: {
            experienceId,
            deletedAt: null,
          },
          data: { deletedAt },
        });

        // Soft delete all comments
        const deletedComments = await tx.comment.updateMany({
          where: {
            experienceId,
            deletedAt: null,
          },
          data: { deletedAt },
        });

        // Hard delete reactions (no need to keep them)
        const deletedReactions = await tx.reaction.deleteMany({
          where: { experienceId },
        });

        return {
          experience: deletedExperience,
          deletedComments: deletedComments.count,
          deletedReactions: deletedReactions.count,
          deletedAt,
        };
      });
    } catch (error) {
      console.error(`Failed to soft delete experience ${experienceId}:`, error);
      throw new Error(
        `Soft delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Restore a soft deleted user
   */
  static async restoreUser(userId: number) {
    try {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Check if user is actually soft deleted
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { deletedAt: true },
        });

        if (!user || !user.deletedAt) {
          throw new Error('User is not soft deleted');
        }

        // Restore user
        const restoredUser = await tx.user.update({
          where: { id: userId },
          data: {
            deletedAt: null,
            // Clear deletion metadata from bio if it exists
            bio: await tx.user
              .findUnique({ where: { id: userId }, select: { bio: true } })
              .then((u: { bio: string | null } | null) =>
                u?.bio?.startsWith('[DELETED:') ? null : u?.bio
              ),
          },
        });

        return {
          user: restoredUser,
          restoredAt: new Date(),
        };
      });
    } catch (error) {
      console.error(`Failed to restore user ${userId}:`, error);
      throw new Error(
        `User restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Restore a soft deleted experience
   */
  static async restoreExperience(experienceId: number) {
    try {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Check if experience is actually soft deleted
        const experience = await tx.experience.findUnique({
          where: { id: experienceId },
          select: { deletedAt: true, userId: true },
        });

        if (!experience || !experience.deletedAt) {
          throw new Error('Experience is not soft deleted');
        }

        // Check if the user is still active
        const user = await tx.user.findUnique({
          where: { id: experience.userId },
          select: { deletedAt: true },
        });

        if (user?.deletedAt) {
          throw new Error('Cannot restore experience: user is deleted');
        }

        // Restore experience
        const restoredExperience = await tx.experience.update({
          where: { id: experienceId },
          data: {
            deletedAt: null,
            // Clear deletion metadata from description if it exists
            description: await tx.experience
              .findUnique({
                where: { id: experienceId },
                select: { description: true },
              })
              .then((e: { description: string | null } | null) => {
                const desc = e?.description || '';
                const deletedPrefix = desc.match(
                  /^\[DELETED:.*?\]\s*\d{4}-\d{2}-\d{2}T.*?\n\n/
                );
                return deletedPrefix
                  ? desc.replace(deletedPrefix[0], '')
                  : desc;
              }),
          },
        });

        // Restore related prompts
        await tx.prompt.updateMany({
          where: { experienceId },
          data: { deletedAt: null },
        });

        // Restore related comments
        await tx.comment.updateMany({
          where: { experienceId },
          data: { deletedAt: null },
        });

        return {
          experience: restoredExperience,
          restoredAt: new Date(),
        };
      });
    } catch (error) {
      console.error(`Failed to restore experience ${experienceId}:`, error);
      throw new Error(
        `Experience restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all soft deleted records for cleanup purposes
   */
  static async getSoftDeletedRecords(olderThan: Date) {
    try {
      const [users, experiences, prompts, comments] = await Promise.all([
        prisma.user.findMany({
          where: {
            deletedAt: {
              not: null,
              lt: olderThan,
            },
          },
          select: { id: true, username: true, deletedAt: true },
        }),
        prisma.experience.findMany({
          where: {
            deletedAt: {
              not: null,
              lt: olderThan,
            },
          },
          select: { id: true, title: true, deletedAt: true, userId: true },
        }),
        prisma.prompt.findMany({
          where: {
            deletedAt: {
              not: null,
              lt: olderThan,
            },
          },
          select: { id: true, experienceId: true, deletedAt: true },
        }),
        prisma.comment.findMany({
          where: {
            deletedAt: {
              not: null,
              lt: olderThan,
            },
          },
          select: {
            id: true,
            experienceId: true,
            userId: true,
            deletedAt: true,
          },
        }),
      ]);

      return {
        users,
        experiences,
        prompts,
        comments,
        total:
          users.length + experiences.length + prompts.length + comments.length,
      };
    } catch (error) {
      console.error('Failed to get soft deleted records:', error);
      throw error;
    }
  }

  /**
   * Get statistics about soft deleted records
   */
  static async getSoftDeleteStats() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [
        totalUsers,
        deletedUsers,
        recentlyDeletedUsers,
        totalExperiences,
        deletedExperiences,
        recentlyDeletedExperiences,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { deletedAt: { not: null } } }),
        prisma.user.count({ where: { deletedAt: { gte: thirtyDaysAgo } } }),
        prisma.experience.count(),
        prisma.experience.count({ where: { deletedAt: { not: null } } }),
        prisma.experience.count({
          where: { deletedAt: { gte: thirtyDaysAgo } },
        }),
      ]);

      return {
        users: {
          total: totalUsers,
          active: totalUsers - deletedUsers,
          deleted: deletedUsers,
          recentlyDeleted: recentlyDeletedUsers,
        },
        experiences: {
          total: totalExperiences,
          active: totalExperiences - deletedExperiences,
          deleted: deletedExperiences,
          recentlyDeleted: recentlyDeletedExperiences,
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get soft delete stats:', error);
      throw error;
    }
  }
}

export default SoftDeleteService;
