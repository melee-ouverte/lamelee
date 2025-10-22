/**
 * T069-T070: Data Retention Management API
 *
 * API endpoint for managing data retention policies and running cleanup jobs.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { withApiMiddleware } from '../../../lib/cors-middleware';
import {
  withErrorHandling,
  ValidationError,
  AuthorizationError,
  validate,
} from '../../../lib/error-handling';
import { withRequestLogging } from '../../../lib/request-logging';
import DataRetentionService, {
  DEFAULT_RETENTION_POLICIES,
} from '../../../lib/data-retention';

interface RetentionRequest {
  action:
    | 'run_cleanup'
    | 'get_stats'
    | 'get_policies'
    | 'test_cleanup'
    | 'schedule_cleanup';
  cleanupType?: 'full' | 'experiences' | 'users' | 'orphaned';
  dryRun?: boolean;
  customPolicies?: Record<string, any>;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: any;
  message?: string;
  meta?: {
    requestId?: string;
    timestamp: string;
    responseTime?: number;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const startTime = Date.now();

  // Only allow POST method for cleanup operations, GET for stats
  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    throw new ValidationError('Authentication required');
  }

  // Admin check
  const isAdmin =
    session.user.email?.endsWith('@admin.com') ||
    session.user.username?.toLowerCase().includes('admin');

  if (!isAdmin) {
    throw new AuthorizationError(
      'Admin privileges required for data retention management'
    );
  }

  const data: RetentionRequest = req.method === 'GET' ? req.query : req.body;
  const { action, cleanupType, dryRun, customPolicies } = data;

  validate.required(action, 'action');
  validate.enum(
    action,
    [
      'run_cleanup',
      'get_stats',
      'get_policies',
      'test_cleanup',
      'schedule_cleanup',
    ],
    'action'
  );

  let result;
  let message;

  switch (action) {
    case 'get_policies':
      result = {
        defaultPolicies: DEFAULT_RETENTION_POLICIES,
        description: 'Current data retention policies',
        notes: {
          maxAge: 'Maximum age before soft deletion (days)',
          gracePeriod:
            'Grace period after soft deletion before hard deletion (days)',
          enableArchiving: 'Whether records are archived before deletion',
          batchSize: 'Number of records processed in each batch',
        },
      };
      message = 'Retrieved retention policies';
      break;

    case 'get_stats':
      result = await DataRetentionService.getRetentionStats();
      message = 'Retrieved retention statistics';
      break;

    case 'run_cleanup':
      if (cleanupType) {
        validate.enum(
          cleanupType,
          ['full', 'experiences', 'users', 'orphaned'],
          'cleanupType'
        );
      }

      if (dryRun) {
        // For dry run, just return what would be processed without actually deleting
        result = {
          dryRun: true,
          message: 'Dry run mode - no actual deletions performed',
          estimatedActions: await DataRetentionService.getRetentionStats(),
          note: 'This shows what records would be eligible for cleanup',
        };
        message = `Dry run completed for ${cleanupType || 'full'} cleanup`;
      } else {
        // Run actual cleanup
        switch (cleanupType) {
          case 'experiences':
            result = [
              await DataRetentionService.cleanupOldExperiences(
                DEFAULT_RETENTION_POLICIES.experiences
              ),
              await DataRetentionService.cleanupSoftDeletedExperiences(
                DEFAULT_RETENTION_POLICIES.experiences
              ),
            ];
            break;
          case 'users':
            result = [
              await DataRetentionService.cleanupSoftDeletedUsers(
                DEFAULT_RETENTION_POLICIES.users
              ),
            ];
            break;
          case 'orphaned':
            result = [await DataRetentionService.cleanupOrphanedRecords()];
            break;
          case 'full':
          default:
            result = await DataRetentionService.runFullCleanup(customPolicies);
            break;
        }
        message = `${cleanupType || 'full'} cleanup completed`;
      }
      break;

    case 'test_cleanup':
      // This is a safe test that only returns statistics without deleting anything
      result = {
        testMode: true,
        currentStats: await DataRetentionService.getRetentionStats(),
        policies: DEFAULT_RETENTION_POLICIES,
        recommendations: {
          experiences:
            'Run experience cleanup if recordsEligibleForCleanup > 0',
          users: 'Run user cleanup if recordsEligibleForCleanup > 0',
          general: 'Schedule regular cleanup to maintain database performance',
        },
      };
      message = 'Test cleanup analysis completed';
      break;

    case 'schedule_cleanup':
      // In a real application, this would configure a cron job or task scheduler
      result = {
        scheduled: true,
        interval: '24 hours',
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        note: 'In production, this would configure actual scheduled jobs',
        implementation:
          'Use cron jobs, AWS Lambda scheduled events, or similar',
      };
      message = 'Cleanup scheduling configured (mock)';
      break;

    default:
      throw new ValidationError(`Unknown action: ${action}`);
  }

  const responseTime = Date.now() - startTime;
  const requestId = res.getHeader('X-Request-ID') as string;

  return res.status(200).json({
    success: true,
    data: result,
    message,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      responseTime,
    },
  });
}

// Apply all middleware layers
export default withApiMiddleware(
  withErrorHandling(withRequestLogging(handler)),
  {
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? ['https://yourdomain.com']
          : true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    securityHeaders: true,
    rateLimit: false, // Disable rate limiting for admin endpoints
  }
);
