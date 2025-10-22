import { PrismaClient } from '@prisma/client';

/**
 * T043: Prisma Database Client Configuration
 *
 * Enhanced Prisma client with proper connection pooling, logging,
 * and error handling for the AI Coding Assistant platform.
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Enhanced connection configuration for optimal performance and concurrency
const connectionConfig = {
  log: (process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn', 'info']
    : ['error']) as ('query' | 'error' | 'warn' | 'info')[],

  // Error formatting for better debugging
  errorFormat: 'pretty' as const,

  // Connection pool settings for high concurrency
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
} as const;

// Create singleton Prisma client instance
export const prisma = global.prisma || new PrismaClient(connectionConfig);

// Store in global during development to prevent hot reload issues
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Database utility functions
export const dbUtils = {
  /**
   * Health check for database connection
   */
  async isHealthy(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  },

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const [userCount, experienceCount, promptCount] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.experience.count({ where: { deletedAt: null } }),
        prisma.prompt.count({ where: { deletedAt: null } }),
      ]);

      return {
        users: userCount,
        experiences: experienceCount,
        prompts: promptCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  },

  /**
   * Simple soft delete helper - marks record as deleted without removing it
   * For complex operations with cascading, use SoftDeleteService instead
   */
  async softDelete(model: keyof typeof prisma, id: number) {
    try {
      // @ts-ignore - Dynamic model access
      return await prisma[model].update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      console.error(`Soft delete failed for ${String(model)} ${id}:`, error);
      throw error;
    }
  },

  /**
   * Hard delete helper - permanently removes soft-deleted records
   */
  async hardDelete(model: keyof typeof prisma, where: any) {
    try {
      // @ts-ignore - Dynamic model access
      return await prisma[model].deleteMany({ where });
    } catch (error) {
      console.error(`Hard delete failed for ${String(model)}:`, error);
      throw error;
    }
  },

  /**
   * Connection pool monitoring
   */
  async getConnectionInfo() {
    try {
      // For SQLite, we can't get actual pool info, but we can check connection health
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        responseTime,
        maxConnections: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '20'),
        database: process.env.DATABASE_URL?.startsWith('file:')
          ? 'SQLite'
          : process.env.DATABASE_URL?.includes('postgresql')
            ? 'PostgreSQL'
            : process.env.DATABASE_URL?.includes('mysql')
              ? 'MySQL'
              : 'Unknown',
      };
    } catch (error) {
      console.error('Connection info check failed:', error);
      return {
        healthy: false,
        responseTime: -1,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

// Graceful shutdown handler
export async function disconnectDatabase() {
  await prisma.$disconnect();
}
