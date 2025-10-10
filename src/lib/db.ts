import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 *
 * This file provides a singleton instance of the Prisma Client to prevent
 * multiple instances from being created during development (hot reloading).
 *
 * TODO: This is a placeholder. Full implementation will be completed in Task T043.
 *
 * Features to be implemented:
 * - Connection pooling configuration
 * - Query logging in development
 * - Error handling and retry logic
 * - Connection limits (15+ concurrent connections minimum)
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
