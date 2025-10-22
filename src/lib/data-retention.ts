/**
 * T069-T070: Data Retention & Cleanup Service
 * 
 * Implements automated data cleanup jobs with configurable retention policies.
 * Handles both hard deletion of old soft-deleted records and archival of aged data.
 */

import { prisma } from './db';
import SoftDeleteService from './soft-delete';

export interface RetentionPolicy {
  /**
   * How long to keep data before soft deletion (in days)
   */
  maxAge: number;
  
  /**
   * Grace period after soft deletion before hard deletion (in days)
   */
  gracePeriod: number;
  
  /**
   * Whether to archive data before deletion
   */
  enableArchiving: boolean;
  
  /**
   * Batch size for processing records
   */
  batchSize: number;
}

export interface CleanupResult {
  operation: string;
  recordsProcessed: number;
  recordsDeleted: number;
  recordsArchived: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

export interface RetentionStats {
  totalRecords: number;
  activeRecords: number;
  softDeletedRecords: number;
  recordsEligibleForCleanup: number;
  oldestRecord?: Date;
  newestRecord?: Date;
  storageEstimate?: {
    total: string;
    active: string;
    deleted: string;
  };
}

/**
 * Default retention policies for different data types
 */
export const DEFAULT_RETENTION_POLICIES: Record<string, RetentionPolicy> = {
  experiences: {
    maxAge: 730, // 2 years
    gracePeriod: 30, // 30 days grace period after soft delete
    enableArchiving: true,
    batchSize: 100,
  },
  users: {
    maxAge: 1095, // 3 years for user accounts
    gracePeriod: 90, // 90 days grace period for user accounts
    enableArchiving: true,
    batchSize: 50,
  },
  comments: {
    maxAge: 730, // 2 years
    gracePeriod: 30, // 30 days grace period
    enableArchiving: false, // Comments don't need archiving
    batchSize: 200,
  },
  prompts: {
    maxAge: 730, // 2 years
    gracePeriod: 30, // 30 days grace period
    enableArchiving: false,
    batchSize: 200,
  },
  requestLogs: {
    maxAge: 90, // 90 days for logs
    gracePeriod: 7, // 7 days grace period
    enableArchiving: false,
    batchSize: 500,
  },
};

export class DataRetentionService {
  /**
   * Archive data to external storage (placeholder - would integrate with AWS S3, etc.)
   */
  private static async archiveRecords(tableName: string, records: any[]): Promise<number> {
    // In a real implementation, this would:
    // 1. Format records for archival
    // 2. Upload to cloud storage (S3, GCS, etc.)
    // 3. Create archive index entries
    // 4. Verify archive integrity
    
    console.log(`[ARCHIVE] Would archive ${records.length} ${tableName} records`);
    
    // Simulate archiving process
    const archiveData = {
      timestamp: new Date().toISOString(),
      table: tableName,
      recordCount: records.length,
      records: records.map(record => ({
        id: record.id,
        createdAt: record.createdAt,
        deletedAt: record.deletedAt,
        // Include relevant fields based on table
        ...(tableName === 'experiences' && {
          title: record.title,
          userId: record.userId,
        }),
        ...(tableName === 'users' && {
          username: record.username,
          email: record.email,
        }),
      })),
    };
    
    // In production, save this to external storage
    console.log(`[ARCHIVE] Archive data prepared:`, {
      table: tableName,
      count: records.length,
      size: JSON.stringify(archiveData).length,
    });
    
    return records.length;
  }

  /**
   * Clean up soft-deleted experiences that exceed grace period
   */
  static async cleanupSoftDeletedExperiences(policy: RetentionPolicy): Promise<CleanupResult> {
    const startTime = Date.now();
    const cutoffDate = new Date(Date.now() - policy.gracePeriod * 24 * 60 * 60 * 1000);
    
    const result: CleanupResult = {
      operation: 'cleanup_soft_deleted_experiences',
      recordsProcessed: 0,
      recordsDeleted: 0,
      recordsArchived: 0,
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      // Find soft-deleted experiences older than grace period
      const expiredExperiences = await prisma.experience.findMany({
        where: {
          deletedAt: {
            not: null,
            lt: cutoffDate,
          },
        },
        include: {
          prompts: true,
          comments: true,
          reactions: true,
        },
        take: policy.batchSize,
      });

      result.recordsProcessed = expiredExperiences.length;

      if (expiredExperiences.length === 0) {
        console.log('[CLEANUP] No expired experiences found');
        result.duration = Date.now() - startTime;
        return result;
      }

      // Archive before deletion if enabled
      if (policy.enableArchiving) {
        try {
          result.recordsArchived = await this.archiveRecords('experiences', expiredExperiences);
        } catch (error) {
          result.errors.push(`Archiving failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Hard delete the experiences and related data
      for (const experience of expiredExperiences) {
        try {
          await prisma.$transaction(async (tx: any) => {
            // Delete reactions (they don't have soft delete)
            await tx.reaction.deleteMany({
              where: { experienceId: experience.id },
            });

            // Delete soft-deleted prompts
            await tx.prompt.deleteMany({
              where: { 
                experienceId: experience.id,
                deletedAt: { not: null },
              },
            });

            // Delete soft-deleted comments
            await tx.comment.deleteMany({
              where: { 
                experienceId: experience.id,
                deletedAt: { not: null },
              },
            });

            // Finally delete the experience
            await tx.experience.delete({
              where: { id: experience.id },
            });
          });

          result.recordsDeleted++;
          console.log(`[CLEANUP] Hard deleted experience ${experience.id} and related data`);
        } catch (error) {
          const errorMsg = `Failed to delete experience ${experience.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`[CLEANUP] ${errorMsg}`);
        }
      }

    } catch (error) {
      const errorMsg = `Cleanup query failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(`[CLEANUP] ${errorMsg}`);
    }

    result.duration = Date.now() - startTime;
    console.log(`[CLEANUP] Experiences cleanup completed in ${result.duration}ms`);
    return result;
  }

  /**
   * Clean up old experiences that exceed maximum age (soft delete them)
   */
  static async cleanupOldExperiences(policy: RetentionPolicy): Promise<CleanupResult> {
    const startTime = Date.now();
    const cutoffDate = new Date(Date.now() - policy.maxAge * 24 * 60 * 60 * 1000);
    
    const result: CleanupResult = {
      operation: 'cleanup_old_experiences',
      recordsProcessed: 0,
      recordsDeleted: 0,
      recordsArchived: 0,
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      // Find active experiences older than max age
      const oldExperiences = await prisma.experience.findMany({
        where: {
          createdAt: { lt: cutoffDate },
          deletedAt: null, // Only active experiences
        },
        take: policy.batchSize,
        select: { id: true, title: true, createdAt: true },
      });

      result.recordsProcessed = oldExperiences.length;

      if (oldExperiences.length === 0) {
        console.log('[CLEANUP] No old experiences found for soft deletion');
        result.duration = Date.now() - startTime;
        return result;
      }

      // Soft delete old experiences
      for (const experience of oldExperiences) {
        try {
          await SoftDeleteService.deleteExperience(experience.id, {
            deletionReason: 'Automatic cleanup - data retention policy',
          });
          
          result.recordsDeleted++;
          console.log(`[CLEANUP] Soft deleted old experience ${experience.id} (${experience.title})`);
        } catch (error) {
          const errorMsg = `Failed to soft delete experience ${experience.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`[CLEANUP] ${errorMsg}`);
        }
      }

    } catch (error) {
      const errorMsg = `Old experiences query failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(`[CLEANUP] ${errorMsg}`);
    }

    result.duration = Date.now() - startTime;
    console.log(`[CLEANUP] Old experiences cleanup completed in ${result.duration}ms`);
    return result;
  }

  /**
   * Clean up soft-deleted users that exceed grace period
   */
  static async cleanupSoftDeletedUsers(policy: RetentionPolicy): Promise<CleanupResult> {
    const startTime = Date.now();
    const cutoffDate = new Date(Date.now() - policy.gracePeriod * 24 * 60 * 60 * 1000);
    
    const result: CleanupResult = {
      operation: 'cleanup_soft_deleted_users',
      recordsProcessed: 0,
      recordsDeleted: 0,
      recordsArchived: 0,
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      // Find soft-deleted users older than grace period
      const expiredUsers = await prisma.user.findMany({
        where: {
          deletedAt: {
            not: null,
            lt: cutoffDate,
          },
        },
        take: policy.batchSize,
      });

      result.recordsProcessed = expiredUsers.length;

      if (expiredUsers.length === 0) {
        console.log('[CLEANUP] No expired users found');
        result.duration = Date.now() - startTime;
        return result;
      }

      // Archive before deletion if enabled
      if (policy.enableArchiving) {
        try {
          result.recordsArchived = await this.archiveRecords('users', expiredUsers);
        } catch (error) {
          result.errors.push(`User archiving failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Hard delete the users
      for (const user of expiredUsers) {
        try {
          await prisma.user.delete({
            where: { id: user.id },
          });

          result.recordsDeleted++;
          console.log(`[CLEANUP] Hard deleted user ${user.id} (${user.username})`);
        } catch (error) {
          const errorMsg = `Failed to delete user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`[CLEANUP] ${errorMsg}`);
        }
      }

    } catch (error) {
      const errorMsg = `User cleanup query failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(`[CLEANUP] ${errorMsg}`);
    }

    result.duration = Date.now() - startTime;
    console.log(`[CLEANUP] Users cleanup completed in ${result.duration}ms`);
    return result;
  }

  /**
   * Run full cleanup process for all data types
   */
  static async runFullCleanup(customPolicies?: Record<string, RetentionPolicy>): Promise<CleanupResult[]> {
    const policies = { ...DEFAULT_RETENTION_POLICIES, ...customPolicies };
    const results: CleanupResult[] = [];

    console.log('[CLEANUP] Starting full data retention cleanup...');

    try {
      // Clean up old experiences (soft delete)
      results.push(await this.cleanupOldExperiences(policies.experiences));
      
      // Clean up expired soft-deleted experiences (hard delete)
      results.push(await this.cleanupSoftDeletedExperiences(policies.experiences));
      
      // Clean up expired soft-deleted users (hard delete)
      results.push(await this.cleanupSoftDeletedUsers(policies.users));

      // Clean up orphaned comments and prompts
      results.push(await this.cleanupOrphanedRecords());

    } catch (error) {
      console.error('[CLEANUP] Full cleanup failed:', error);
    }

    const totalDeleted = results.reduce((sum, r) => sum + r.recordsDeleted, 0);
    const totalArchived = results.reduce((sum, r) => sum + r.recordsArchived, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`[CLEANUP] Full cleanup completed: ${totalDeleted} deleted, ${totalArchived} archived, ${totalErrors} errors`);
    
    return results;
  }

  /**
   * Clean up orphaned records (comments/prompts without parent experiences)
   */
  static async cleanupOrphanedRecords(): Promise<CleanupResult> {
    const startTime = Date.now();
    
    const result: CleanupResult = {
      operation: 'cleanup_orphaned_records',
      recordsProcessed: 0,
      recordsDeleted: 0,
      recordsArchived: 0,
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      // Clean up comments with deleted experiences
      const orphanedComments = await prisma.comment.deleteMany({
        where: {
          experience: {
            deletedAt: { not: null },
          },
        },
      });

      // Clean up prompts with deleted experiences
      const orphanedPrompts = await prisma.prompt.deleteMany({
        where: {
          experience: {
            deletedAt: { not: null },
          },
        },
      });

      result.recordsDeleted = orphanedComments.count + orphanedPrompts.count;
      console.log(`[CLEANUP] Cleaned up ${orphanedComments.count} orphaned comments and ${orphanedPrompts.count} orphaned prompts`);

    } catch (error) {
      const errorMsg = `Orphaned records cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(`[CLEANUP] ${errorMsg}`);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Get retention statistics for monitoring
   */
  static async getRetentionStats(): Promise<Record<string, RetentionStats>> {
    const stats: Record<string, RetentionStats> = {};

    try {
      // Experience stats
      const [totalExperiences, activeExperiences, deletedExperiences] = await Promise.all([
        prisma.experience.count(),
        prisma.experience.count({ where: { deletedAt: null } }),
        prisma.experience.count({ where: { deletedAt: { not: null } } }),
      ]);

      const gracePeriodCutoff = new Date(Date.now() - DEFAULT_RETENTION_POLICIES.experiences.gracePeriod * 24 * 60 * 60 * 1000);
      const experiencesEligibleForCleanup = await prisma.experience.count({
        where: {
          deletedAt: {
            not: null,
            lt: gracePeriodCutoff,
          },
        },
      });

      stats.experiences = {
        totalRecords: totalExperiences,
        activeRecords: activeExperiences,
        softDeletedRecords: deletedExperiences,
        recordsEligibleForCleanup: experiencesEligibleForCleanup,
      };

      // User stats
      const [totalUsers, activeUsers, deletedUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { deletedAt: { not: null } } }),
      ]);

      const userGracePeriodCutoff = new Date(Date.now() - DEFAULT_RETENTION_POLICIES.users.gracePeriod * 24 * 60 * 60 * 1000);
      const usersEligibleForCleanup = await prisma.user.count({
        where: {
          deletedAt: {
            not: null,
            lt: userGracePeriodCutoff,
          },
        },
      });

      stats.users = {
        totalRecords: totalUsers,
        activeRecords: activeUsers,
        softDeletedRecords: deletedUsers,
        recordsEligibleForCleanup: usersEligibleForCleanup,
      };

    } catch (error) {
      console.error('[RETENTION] Failed to get retention stats:', error);
    }

    return stats;
  }

  /**
   * Schedule cleanup to run periodically
   * In production, this would be called by a cron job or task scheduler
   */
  static scheduleCleanup(intervalHours: number = 24) {
    console.log(`[RETENTION] Scheduling cleanup to run every ${intervalHours} hours`);
    
    setInterval(async () => {
      console.log('[RETENTION] Running scheduled cleanup...');
      try {
        await this.runFullCleanup();
      } catch (error) {
        console.error('[RETENTION] Scheduled cleanup failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);

    // Run initial cleanup
    setTimeout(() => {
      this.runFullCleanup();
    }, 5000); // Run after 5 seconds of server start
  }
}

export default DataRetentionService;