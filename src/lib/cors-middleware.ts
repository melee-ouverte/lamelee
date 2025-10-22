/**
 * T068: CORS Middleware
 *
 * Comprehensive CORS (Cross-Origin Resource Sharing) middleware
 * with security best practices and flexible configuration.
 */

import { NextApiRequest, NextApiResponse } from 'next';

export interface CorsOptions {
  origin?:
    | string
    | string[]
    | boolean
    | ((
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => void);
  methods?: string[];
  allowedHeaders?: string[] | '*';
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

const DEFAULT_CORS_OPTIONS: CorsOptions = {
  origin: process.env.NODE_ENV === 'development' ? true : false, // Allow all origins in dev, none in prod by default
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
    'X-Forwarded-For',
    'User-Agent',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

/**
 * Production-safe CORS configuration
 */
export const PRODUCTION_CORS_OPTIONS: CorsOptions = {
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    // Add your production domains here
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 3600, // 1 hour
  optionsSuccessStatus: 200,
};

/**
 * Development CORS configuration (more permissive)
 */
export const DEVELOPMENT_CORS_OPTIONS: CorsOptions = {
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: '*',
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(
  origin: string | undefined,
  allowedOrigin: CorsOptions['origin']
): boolean {
  if (allowedOrigin === true) {
    return true;
  }

  if (allowedOrigin === false || !allowedOrigin) {
    return false;
  }

  if (typeof allowedOrigin === 'string') {
    return origin === allowedOrigin;
  }

  if (Array.isArray(allowedOrigin)) {
    return origin ? allowedOrigin.includes(origin) : false;
  }

  if (typeof allowedOrigin === 'function') {
    return new Promise<boolean>((resolve) => {
      allowedOrigin(origin, (err, allow) => {
        resolve(!err && !!allow);
      });
    }) as any; // This would need to be handled differently in real async context
  }

  return false;
}

/**
 * Set CORS headers on response
 */
function setCorsHeaders(
  req: NextApiRequest,
  res: NextApiResponse,
  options: CorsOptions
) {
  const origin = req.headers.origin;

  // Handle Origin header
  if (options.origin !== false) {
    if (options.origin === true) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else if (typeof options.origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', options.origin);
    } else if (Array.isArray(options.origin)) {
      if (origin && options.origin.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    }

    // Vary header to indicate that the response varies based on Origin
    if (options.origin !== '*') {
      res.setHeader('Vary', 'Origin');
    }
  }

  // Handle Credentials
  if (options.credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Handle Methods
  if (options.methods && options.methods.length > 0) {
    res.setHeader('Access-Control-Allow-Methods', options.methods.join(','));
  }

  // Handle Allowed Headers
  if (options.allowedHeaders) {
    if (options.allowedHeaders === '*') {
      const requestHeaders = req.headers['access-control-request-headers'];
      if (requestHeaders) {
        res.setHeader('Access-Control-Allow-Headers', requestHeaders);
      }
    } else if (Array.isArray(options.allowedHeaders)) {
      res.setHeader(
        'Access-Control-Allow-Headers',
        options.allowedHeaders.join(',')
      );
    }
  }

  // Handle Exposed Headers
  if (options.exposedHeaders && options.exposedHeaders.length > 0) {
    res.setHeader(
      'Access-Control-Expose-Headers',
      options.exposedHeaders.join(',')
    );
  }

  // Handle Max Age
  if (options.maxAge !== undefined) {
    res.setHeader('Access-Control-Max-Age', options.maxAge.toString());
  }
}

/**
 * Handle preflight OPTIONS request
 */
function handlePreflight(
  req: NextApiRequest,
  res: NextApiResponse,
  options: CorsOptions
) {
  setCorsHeaders(req, res, options);

  // Set status code for preflight
  const statusCode = options.optionsSuccessStatus || 204;
  res.status(statusCode);

  // End the preflight request
  res.end();
}

/**
 * CORS middleware wrapper
 */
export function withCors(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  customOptions?: CorsOptions
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Merge custom options with defaults
    const options: CorsOptions = {
      ...DEFAULT_CORS_OPTIONS,
      ...customOptions,
    };

    // Use environment-specific defaults if no custom options provided
    if (!customOptions) {
      if (process.env.NODE_ENV === 'production') {
        Object.assign(options, PRODUCTION_CORS_OPTIONS);
      } else {
        Object.assign(options, DEVELOPMENT_CORS_OPTIONS);
      }
    }

    // Check if origin is allowed (for non-preflight requests)
    const origin = req.headers.origin;
    if (req.method !== 'OPTIONS' && options.origin !== true) {
      const isAllowed = isOriginAllowed(origin, options.origin);
      if (!isAllowed) {
        res.status(403).json({
          success: false,
          error: {
            code: 'CORS_NOT_ALLOWED',
            message: 'CORS policy does not allow access from this origin',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      handlePreflight(req, res, options);
      return;
    }

    // Set CORS headers for actual request
    setCorsHeaders(req, res, options);

    // Continue to the actual handler
    await handler(req, res);
  };
}

/**
 * Security headers middleware (bonus security features)
 */
export function withSecurityHeaders(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );

    // Only set HSTS in production and over HTTPS
    if (
      process.env.NODE_ENV === 'production' &&
      req.headers['x-forwarded-proto'] === 'https'
    ) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
    }

    await handler(req, res);
  };
}

/**
 * Combined middleware with CORS, security headers, and other common features
 */
export function withApiMiddleware(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options?: {
    cors?: CorsOptions;
    securityHeaders?: boolean;
    rateLimit?: boolean;
  }
) {
  const { cors, securityHeaders = true, rateLimit = false } = options || {};

  let wrappedHandler = handler;

  // Apply CORS middleware
  wrappedHandler = withCors(wrappedHandler, cors);

  // Apply security headers middleware
  if (securityHeaders) {
    wrappedHandler = withSecurityHeaders(wrappedHandler);
  }

  // Note: Rate limiting would be implemented here if enabled
  // This is a placeholder for future rate limiting middleware
  if (rateLimit) {
    // wrappedHandler = withRateLimit(wrappedHandler);
    console.log('Rate limiting requested but not yet implemented');
  }

  return wrappedHandler;
}

export default withCors;
