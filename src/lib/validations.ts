/**
 * T044-T045: Input Validation and GitHub URL Validation
 *
 * Comprehensive validation utilities for the AI Coding Assistant platform.
 * Includes form validation, GitHub URL validation, and security checks.
 */

import { z } from 'zod';

// GitHub URL validation constants
const GITHUB_DOMAIN_REGEX = /^https:\/\/github\.com\//;
const GITHUB_REPO_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\/.*)?$/;
const MALICIOUS_PATTERNS = [
  /javascript:/i,
  /vbscript:/i,
  /onload=/i,
  /onerror=/i,
  /<script/i,
  /data:text\/html/i,
];

/**
 * T044: GitHub URL Validation
 */
export const githubUrlValidation = {
  /**
   * Validates if URL is a valid GitHub repository URL
   */
  isValidGitHubUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Basic format validation
    if (!GITHUB_DOMAIN_REGEX.test(url)) {
      return false;
    }

    // Repository path validation
    if (!GITHUB_REPO_REGEX.test(url)) {
      return false;
    }

    // Security check for malicious patterns
    if (this.containsMaliciousPatterns(url)) {
      return false;
    }

    return true;
  },

  /**
   * Checks for malicious patterns in URLs
   */
  containsMaliciousPatterns(url: string): boolean {
    return MALICIOUS_PATTERNS.some(pattern => pattern.test(url));
  },

  /**
   * Sanitizes GitHub URL by removing dangerous characters
   */
  sanitizeGitHubUrl(url: string): string {
    if (!url) return '';
    
    // Remove dangerous characters and normalize
    return url
      .trim()
      .replace(/[<>'"]/g, '')
      .replace(/\s+/g, '')
      .toLowerCase();
  },

  /**
   * Extracts repository information from GitHub URL
   */
  parseGitHubUrl(url: string): { owner: string; repo: string; path?: string } | null {
    const match = url.match(/^https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/(.*))?$/);
    
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2],
      path: match[3] || undefined,
    };
  },

  /**
   * Validates and normalizes GitHub URL
   */
  validateAndNormalize(url: string): { isValid: boolean; url?: string; error?: string } {
    if (!url) {
      return { isValid: false, error: 'URL is required' };
    }

    const sanitized = this.sanitizeGitHubUrl(url);
    
    if (!this.isValidGitHubUrl(sanitized)) {
      return { isValid: false, error: 'Invalid GitHub repository URL' };
    }

    return { isValid: true, url: sanitized };
  },
};

/**
 * T045: Form Validation Schemas
 */

// User profile validation
export const userProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters'),
  
  bio: z
    .string()
    .max(500, 'Bio must not exceed 500 characters')
    .optional(),
  
  avatarUrl: z
    .string()
    .url('Invalid avatar URL')
    .optional(),
});

// Experience creation validation
export const experienceSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must not exceed 100 characters'),
  
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  
  githubUrl: z
    .string()
    .refine(
      (url) => githubUrlValidation.isValidGitHubUrl(url),
      'Must be a valid GitHub repository URL'
    ),
  
  aiAssistant: z
    .enum(['github-copilot', 'claude', 'gpt', 'cursor', 'other'])
    .default('other'),
  
  tags: z
    .string()
    .max(200, 'Tags must not exceed 200 characters')
    .optional()
    .transform((tags) => tags?.split(',').map(tag => tag.trim()).filter(Boolean).join(',') || ''),
});

// Prompt validation
export const promptSchema = z.object({
  content: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(5000, 'Prompt must not exceed 5000 characters'),
  
  context: z
    .string()
    .max(1000, 'Context must not exceed 1000 characters')
    .optional(),
  
  orderIndex: z
    .number()
    .min(0, 'Order index must be non-negative')
    .max(100, 'Too many prompts in experience'),
});

// Comment validation
export const commentSchema = z.object({
  content: z
    .string()
    .min(5, 'Comment must be at least 5 characters')
    .max(1000, 'Comment must not exceed 1000 characters'),
});

// Reaction validation
export const reactionSchema = z.object({
  reactionType: z
    .enum(['HELPFUL', 'CREATIVE', 'EDUCATIONAL', 'INNOVATIVE', 'PROBLEMATIC'])
    .refine(
      (type) => ['HELPFUL', 'CREATIVE', 'EDUCATIONAL', 'INNOVATIVE', 'PROBLEMATIC'].includes(type),
      'Invalid reaction type'
    ),
});

// Prompt rating validation
export const promptRatingSchema = z.object({
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5')
    .int('Rating must be a whole number'),
});

// Search and filtering validation
export const searchSchema = z.object({
  q: z
    .string()
    .max(100, 'Search query too long')
    .optional(),
  
  aiAssistant: z
    .enum(['github-copilot', 'claude', 'gpt', 'cursor', 'other'])
    .optional(),
  
  tags: z
    .string()
    .max(200, 'Tags filter too long')
    .optional(),
  
  page: z
    .number()
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page number too high')
    .default(1),
  
  limit: z
    .number()
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit must not exceed 50')
    .default(20),
  
  sort: z
    .enum(['recent', 'popular', 'rating'])
    .default('recent'),
});

/**
 * Validation utility functions
 */
export const validationUtils = {
  /**
   * Safely parse and validate data with Zod schema
   */
  safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    return {
      success: false,
      errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
    };
  },

  /**
   * Format validation errors for API responses
   */
  formatValidationErrors(errors: z.ZodError): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};
    
    for (const error of errors.errors) {
      const field = error.path.join('.');
      if (!formatted[field]) {
        formatted[field] = [];
      }
      formatted[field].push(error.message);
    }
    
    return formatted;
  },

  /**
   * Sanitize string input to prevent XSS
   */
  sanitizeString(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/[<>'"&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return entities[char] || char;
      });
  },

  /**
   * Validate and sanitize tags string
   */
  sanitizeTags(tags: string): string {
    if (!tags) return '';
    
    return tags
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 20)
      .filter(tag => /^[a-zA-Z0-9-]+$/.test(tag))
      .slice(0, 10) // Max 10 tags
      .join(',');
  },
};

// Schemas are already exported above as const exports