/**
 * T067: Error Handling Middleware
 *
 * Comprehensive error handling middleware for API routes with
 * proper error classification, logging, and user-friendly responses.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  stack?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
  timestamp: string;
}

/**
 * Custom error classes for different types of API errors
 */
export class ValidationError extends Error {
  public statusCode = 400;
  public code = 'VALIDATION_ERROR';

  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  public statusCode = 401;
  public code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  public statusCode = 403;
  public code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  public statusCode = 404;
  public code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  public statusCode = 409;
  public code = 'CONFLICT';

  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  public statusCode = 429;
  public code = 'RATE_LIMIT_EXCEEDED';

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends Error {
  public statusCode = 500;
  public code = 'INTERNAL_SERVER_ERROR';

  constructor(
    message: string = 'Internal server error',
    public details?: any
  ) {
    super(message);
    this.name = 'InternalServerError';
  }
}

/**
 * Convert various error types to our standardized ApiError format
 */
function normalizeError(error: any): ApiError {
  // Handle our custom error classes
  if (
    error instanceof ValidationError ||
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError ||
    error instanceof NotFoundError ||
    error instanceof ConflictError ||
    error instanceof RateLimitError ||
    error instanceof InternalServerError
  ) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: (error as any).details,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'A record with this information already exists',
          statusCode: 409,
          details: { field: error.meta?.target },
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        };
      case 'P2025':
        return {
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record was not found',
          statusCode: 404,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        };
      case 'P2003':
        return {
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          message: 'This operation would violate a data relationship',
          statusCode: 400,
          details: { field: error.meta?.field_name },
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        };
      default:
        return {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
          statusCode: 500,
          details:
            process.env.NODE_ENV === 'development'
              ? { prismaCode: error.code }
              : undefined,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        };
    }
  }

  if (error instanceof PrismaClientUnknownRequestError) {
    return {
      code: 'DATABASE_ERROR',
      message: 'An unknown database error occurred',
      statusCode: 500,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  if (error instanceof PrismaClientRustPanicError) {
    return {
      code: 'DATABASE_PANIC',
      message: 'A critical database error occurred',
      statusCode: 500,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  if (error instanceof PrismaClientInitializationError) {
    return {
      code: 'DATABASE_CONNECTION_ERROR',
      message: 'Could not connect to the database',
      statusCode: 503,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  if (error instanceof PrismaClientValidationError) {
    return {
      code: 'DATABASE_VALIDATION_ERROR',
      message: 'Invalid data provided to database',
      statusCode: 400,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  // Handle standard HTTP errors
  if (error.statusCode && error.message) {
    return {
      code: error.code || 'HTTP_ERROR',
      message: error.message,
      statusCode: error.statusCode,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('fetch')) {
      return {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'Failed to communicate with external service',
        statusCode: 502,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }

    if (error.message.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Request timed out',
        statusCode: 408,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }

    return {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'An internal error occurred',
      statusCode: 500,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  // Handle unknown error types
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    statusCode: 500,
    details: process.env.NODE_ENV === 'development' ? error : undefined,
  };
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  apiError: ApiError,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    },
    requestId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log error with appropriate level
 */
function logError(error: ApiError, req: NextApiRequest, requestId?: string) {
  const logLevel =
    error.statusCode >= 500
      ? 'ERROR'
      : error.statusCode >= 400
        ? 'WARN'
        : 'INFO';
  const prefix = requestId ? `[${requestId}]` : '';

  console[
    logLevel === 'ERROR' ? 'error' : logLevel === 'WARN' ? 'warn' : 'log'
  ](`${prefix} ${error.code} ${error.statusCode}: ${error.message}`, {
    url: req.url,
    method: req.method,
    details: error.details,
    stack: error.stack,
  });
}

/**
 * Error handling middleware wrapper
 */
export function withErrorHandling(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);

      // If response hasn't been sent and no status code is set, something went wrong
      if (!res.headersSent && !res.statusCode) {
        throw new InternalServerError(
          'Handler completed without sending response'
        );
      }
    } catch (error) {
      // Don't handle errors if response was already sent
      if (res.headersSent) {
        console.error('Error occurred after response was sent:', error);
        return;
      }

      const apiError = normalizeError(error);
      const requestId = res.getHeader('X-Request-ID') as string;

      // Log the error
      logError(apiError, req, requestId);

      // Send error response
      const errorResponse = createErrorResponse(apiError, requestId);
      res.status(apiError.statusCode).json(errorResponse);
    }
  };
}

/**
 * Validation helper functions
 */
export const validate = {
  required: (value: any, fieldName: string) => {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError(`${fieldName} is required`);
    }
  },

  email: (value: string, fieldName: string = 'Email') => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid email address`);
    }
  },

  minLength: (value: string, minLength: number, fieldName: string) => {
    if (value.length < minLength) {
      throw new ValidationError(
        `${fieldName} must be at least ${minLength} characters long`
      );
    }
  },

  maxLength: (value: string, maxLength: number, fieldName: string) => {
    if (value.length > maxLength) {
      throw new ValidationError(
        `${fieldName} must be no more than ${maxLength} characters long`
      );
    }
  },

  number: (value: any, fieldName: string) => {
    if (isNaN(Number(value))) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
  },

  integer: (value: any, fieldName: string) => {
    if (!Number.isInteger(Number(value))) {
      throw new ValidationError(`${fieldName} must be a valid integer`);
    }
  },

  positiveInteger: (value: any, fieldName: string) => {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new ValidationError(`${fieldName} must be a positive integer`);
    }
  },

  array: (value: any, fieldName: string) => {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`);
    }
  },

  enum: (value: any, allowedValues: any[], fieldName: string) => {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`
      );
    }
  },
};

export default withErrorHandling;
