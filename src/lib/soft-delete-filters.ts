/**
 * T063: Soft Delete Query Filters
 * 
 * Utility functions to automatically exclude soft-deleted records from queries
 * and provide consistent filtering across all API endpoints.
 */

/**
 * Default filter to exclude soft-deleted records
 */
export const excludeDeleted = {
  deletedAt: null,
};

/**
 * Include soft-deleted records (for admin operations)
 */
export const includeDeleted = {};

/**
 * Only soft-deleted records (for cleanup operations)
 */
export const onlyDeleted = {
  deletedAt: { not: null },
};

/**
 * Soft-deleted records older than specified date
 */
export const deletedBefore = (date: Date) => ({
  deletedAt: {
    not: null,
    lt: date,
  },
});

/**
 * Query builder helpers that automatically apply soft delete filtering
 */
export const withSoftDeleteFilter = {
  /**
   * User queries with soft delete filtering
   */
  user: {
    findMany: (args: any = {}) => ({
      ...args,
      where: {
        ...args.where,
        ...excludeDeleted,
      },
    }),
    
    findUnique: (args: any) => ({
      ...args,
      where: {
        ...args.where,
        ...excludeDeleted,
      },
    }),
    
    findFirst: (args: any = {}) => ({
      ...args,
      where: {
        ...args.where,
        ...excludeDeleted,
      },
    }),
  },

  /**
   * Experience queries with soft delete filtering
   */
  experience: {
    findMany: (args: any = {}) => ({
      ...args,
      where: {
        ...args.where,
        ...excludeDeleted,
        // Also exclude experiences from soft-deleted users
        user: excludeDeleted,
      },
    }),
    
    findUnique: (args: any) => ({
      ...args,
      where: {
        ...args.where,
        ...excludeDeleted,
        // Also exclude experiences from soft-deleted users
        user: excludeDeleted,
      },
    }),
    
    findFirst: (args: any = {}) => ({
      ...args,
      where: {
        ...args.where,
        ...excludeDeleted,
        // Also exclude experiences from soft-deleted users
        user: excludeDeleted,
      },
    }),
  },

  /**
   * Comment queries with soft delete filtering
   */
  comment: {
    findMany: (args: any = {}) => ({
      ...args,
      where: {
        ...args.where,
        ...excludeDeleted,
        // Also exclude comments from soft-deleted users and experiences
        user: excludeDeleted,
        experience: {
          ...excludeDeleted,
          user: excludeDeleted,
        },
      },
    }),
  },

  /**
   * Prompt queries with soft delete filtering
   */
  prompt: {
    findMany: (args: any = {}) => ({
      ...args,
      where: {
        ...args.where,
        ...excludeDeleted,
        // Also exclude prompts from soft-deleted experiences
        experience: {
          ...excludeDeleted,
          user: excludeDeleted,
        },
      },
    }),
  },
};

/**
 * Helper to check if a record is soft deleted
 */
export const isSoftDeleted = (record: { deletedAt?: Date | null }) => {
  return record.deletedAt !== null && record.deletedAt !== undefined;
};

/**
 * Helper to get soft delete status information
 */
export const getSoftDeleteInfo = (record: { deletedAt?: Date | null }) => {
  if (!isSoftDeleted(record)) {
    return { isDeleted: false };
  }
  
  return {
    isDeleted: true,
    deletedAt: record.deletedAt,
    daysDeleted: record.deletedAt ? 
      Math.floor((Date.now() - record.deletedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0,
  };
};

/**
 * Validate that a record is not soft deleted, throwing an error if it is
 */
export const validateNotDeleted = (record: { deletedAt?: Date | null }, resourceType: string = 'Resource') => {
  if (isSoftDeleted(record)) {
    throw new Error(`${resourceType} has been deleted and is no longer available`);
  }
};

export default withSoftDeleteFilter;