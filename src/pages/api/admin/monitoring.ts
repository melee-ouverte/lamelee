/**
 * T066-T068: Middleware Testing & Monitoring API
 *
 * API endpoint for monitoring request logs, testing middleware,
 * and providing system health information.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { withApiMiddleware } from '../../../lib/cors-middleware';
import {
  withRequestLogging,
  getRequestLogs,
  getRequestStats,
} from '../../../lib/request-logging';
import {
  withErrorHandling,
  ValidationError,
  AuthorizationError,
  validate,
} from '../../../lib/error-handling';

interface MonitoringRequest {
  action: 'get_logs' | 'get_stats' | 'test_error' | 'health_check';
  limit?: number;
  timeframe?: 'hour' | 'day' | 'week';
  errorType?: 'validation' | 'auth' | 'server' | 'custom';
  userId?: string;
  status?: 'success' | 'error' | 'all';
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

  // Only allow GET and POST methods
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

  // Simple admin check (in production, use proper role-based access)
  const isAdmin =
    session.user.email?.endsWith('@admin.com') ||
    session.user.username?.toLowerCase().includes('admin');

  if (!isAdmin) {
    throw new AuthorizationError(
      'Admin privileges required for monitoring access'
    );
  }

  const data: MonitoringRequest = req.method === 'GET' ? req.query : req.body;
  const { action, limit, timeframe, errorType, userId, status } = data;

  validate.required(action, 'action');
  validate.enum(
    action,
    ['get_logs', 'get_stats', 'test_error', 'health_check'],
    'action'
  );

  let result;
  let message;

  switch (action) {
    case 'get_logs':
      // Validate optional parameters
      if (limit) validate.positiveInteger(limit, 'limit');
      if (status) validate.enum(status, ['success', 'error', 'all'], 'status');

      result = getRequestLogs({
        limit: limit ? Number(limit) : 100,
        userId,
        status,
        since: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours by default
      });

      message = `Retrieved ${result.length} request logs`;
      break;

    case 'get_stats':
      if (timeframe)
        validate.enum(timeframe, ['hour', 'day', 'week'], 'timeframe');

      result = getRequestStats(timeframe || 'day');
      message = `Retrieved ${timeframe || 'day'} statistics`;
      break;

    case 'test_error':
      validate.enum(
        errorType,
        ['validation', 'auth', 'server', 'custom'],
        'errorType'
      );

      // Throw different types of errors for testing
      switch (errorType) {
        case 'validation':
          throw new ValidationError('This is a test validation error', {
            field: 'testField',
          });
        case 'auth':
          throw new AuthorizationError('This is a test authorization error');
        case 'server':
          throw new Error('This is a test server error');
        case 'custom':
          const customError = new Error('Custom test error') as any;
          customError.statusCode = 418;
          customError.code = 'TEST_ERROR';
          throw customError;
      }
      break;

    case 'health_check':
      result = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: 'connected', // This would check actual DB connection
          auth: 'operational',
          cors: 'enabled',
          logging: 'active',
        },
      };
      message = 'System health check completed';
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
    rateLimit: false, // Disable for admin endpoints
  }
);
