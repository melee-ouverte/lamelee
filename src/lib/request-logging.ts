/**
 * T066: Request Logging Middleware
 *
 * Comprehensive request logging middleware for tracking API usage,
 * performance metrics, and debugging information.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  username?: string;
  statusCode?: number;
  responseTime?: number;
  responseSize?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RequestContext {
  requestId: string;
  startTime: number;
  user?: {
    id: string;
    username: string;
    email?: string;
  };
}

// In-memory request logs (in production, use a proper logging service)
const requestLogs: RequestLog[] = [];
const MAX_LOGS = 10000; // Keep last 10k requests

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get client IP address from request
 */
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(',')[0]
    : req.socket.remoteAddress;
  return ip || 'unknown';
}

/**
 * Log request start
 */
export async function logRequestStart(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<RequestContext> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Try to get user session
  let user;
  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user) {
      user = {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email || undefined,
      };
    }
  } catch (error) {
    // Ignore session errors for logging
  }

  // Create initial log entry
  const logEntry: RequestLog = {
    id: requestId,
    timestamp: new Date().toISOString(),
    method: req.method || 'UNKNOWN',
    url: req.url || '',
    userAgent: req.headers['user-agent'],
    ip: getClientIP(req),
    userId: user?.id,
    username: user?.username,
    metadata: {
      query: req.query,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
    },
  };

  // Add to logs
  requestLogs.push(logEntry);

  // Trim logs if needed
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.splice(0, requestLogs.length - MAX_LOGS);
  }

  // Add request ID to response headers for debugging
  res.setHeader('X-Request-ID', requestId);

  console.log(
    `[${requestId}] ${req.method} ${req.url} - ${user?.username || 'anonymous'} (${getClientIP(req)})`
  );

  return {
    requestId,
    startTime,
    user,
  };
}

/**
 * Log request completion
 */
export function logRequestEnd(
  context: RequestContext,
  statusCode: number,
  responseSize?: number,
  error?: Error
) {
  const { requestId, startTime } = context;
  const responseTime = Date.now() - startTime;

  // Find and update the log entry
  const logIndex = requestLogs.findIndex((log) => log.id === requestId);
  if (logIndex !== -1) {
    requestLogs[logIndex] = {
      ...requestLogs[logIndex],
      statusCode,
      responseTime,
      responseSize,
      error: error?.message,
    };
  }

  const status =
    statusCode >= 400 ? 'ERROR' : statusCode >= 300 ? 'REDIRECT' : 'SUCCESS';
  const logLevel =
    statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';

  console.log(
    `[${requestId}] ${status} ${statusCode} - ${responseTime}ms${error ? ` - ${error.message}` : ''}`
  );

  if (logLevel === 'ERROR') {
    console.error(`[${requestId}] Error details:`, error);
  }
}

/**
 * Request logging middleware wrapper
 */
export function withRequestLogging(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const context = await logRequestStart(req, res);

    // Track response size
    let responseSize = 0;
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function (body: any) {
      responseSize = Buffer.byteLength(body || '', 'utf8');
      return originalSend.call(this, body);
    };

    res.json = function (object: any) {
      const jsonString = JSON.stringify(object);
      responseSize = Buffer.byteLength(jsonString, 'utf8');
      return originalJson.call(this, object);
    };

    try {
      await handler(req, res);
      logRequestEnd(context, res.statusCode, responseSize);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logRequestEnd(context, res.statusCode || 500, responseSize, err);
      throw error;
    }
  };
}

/**
 * Get request logs (for admin/debugging)
 */
export function getRequestLogs(
  options: {
    limit?: number;
    userId?: string;
    status?: 'success' | 'error' | 'all';
    since?: Date;
  } = {}
): RequestLog[] {
  const { limit = 100, userId, status = 'all', since } = options;

  let filteredLogs = [...requestLogs];

  // Filter by user
  if (userId) {
    filteredLogs = filteredLogs.filter((log) => log.userId === userId);
  }

  // Filter by status
  if (status !== 'all') {
    if (status === 'error') {
      filteredLogs = filteredLogs.filter(
        (log) => log.statusCode && log.statusCode >= 400
      );
    } else if (status === 'success') {
      filteredLogs = filteredLogs.filter(
        (log) => log.statusCode && log.statusCode < 400
      );
    }
  }

  // Filter by time
  if (since) {
    filteredLogs = filteredLogs.filter(
      (log) => new Date(log.timestamp) >= since
    );
  }

  // Sort by timestamp (newest first) and limit
  return filteredLogs
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, limit);
}

/**
 * Get request statistics
 */
export function getRequestStats(timeframe: 'hour' | 'day' | 'week' = 'day') {
  const now = new Date();
  let since: Date;

  switch (timeframe) {
    case 'hour':
      since = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case 'day':
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
  }

  const recentLogs = requestLogs.filter(
    (log) => new Date(log.timestamp) >= since
  );

  const stats = {
    totalRequests: recentLogs.length,
    successfulRequests: recentLogs.filter(
      (log) => log.statusCode && log.statusCode < 400
    ).length,
    errorRequests: recentLogs.filter(
      (log) => log.statusCode && log.statusCode >= 400
    ).length,
    averageResponseTime: 0,
    uniqueUsers: new Set(
      recentLogs.filter((log) => log.userId).map((log) => log.userId)
    ).size,
    uniqueIPs: new Set(recentLogs.map((log) => log.ip)).size,
    topEndpoints: {} as Record<string, number>,
    topUsers: {} as Record<string, number>,
    errorRates: {} as Record<string, number>,
  };

  if (recentLogs.length > 0) {
    // Calculate average response time
    const timeLogs = recentLogs.filter((log) => log.responseTime);
    if (timeLogs.length > 0) {
      stats.averageResponseTime = Math.round(
        timeLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) /
          timeLogs.length
      );
    }

    // Top endpoints
    recentLogs.forEach((log) => {
      const endpoint = `${log.method} ${log.url.split('?')[0]}`;
      stats.topEndpoints[endpoint] = (stats.topEndpoints[endpoint] || 0) + 1;
    });

    // Top users
    recentLogs.forEach((log) => {
      if (log.username) {
        stats.topUsers[log.username] = (stats.topUsers[log.username] || 0) + 1;
      }
    });

    // Error rates by endpoint
    const endpointGroups = recentLogs.reduce(
      (acc, log) => {
        const endpoint = `${log.method} ${log.url.split('?')[0]}`;
        if (!acc[endpoint]) acc[endpoint] = { total: 0, errors: 0 };
        acc[endpoint].total++;
        if (log.statusCode && log.statusCode >= 400) {
          acc[endpoint].errors++;
        }
        return acc;
      },
      {} as Record<string, { total: number; errors: number }>
    );

    Object.entries(endpointGroups).forEach(([endpoint, data]) => {
      stats.errorRates[endpoint] = Math.round((data.errors / data.total) * 100);
    });
  }

  return stats;
}

export default withRequestLogging;
