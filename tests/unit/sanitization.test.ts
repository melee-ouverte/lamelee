/**
 * T072: Unit Tests for Input Sanitization
 *
 * Comprehensive unit tests for input sanitization utility functions,
 * testing XSS prevention, data cleaning, and security measures.
 */

import { validationUtils } from '../../src/lib/validations';
import { z } from 'zod';

describe('Input Sanitization', () => {
  describe('sanitizeString', () => {
    it('should sanitize dangerous HTML characters', () => {
      const testCases = [
        {
          input: '<script>alert("xss")</script>',
          expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        },
        {
          input: '<img src="x" onerror="alert(1)">',
          expected:
            '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;',
        },
        {
          input: 'Hello <b>world</b>!',
          expected: 'Hello &lt;b&gt;world&lt;/b&gt;!',
        },
        {
          input: 'User "John" & Company',
          expected: 'User &quot;John&quot; &amp; Company',
        },
        {
          input: "It's a 'test' string",
          expected: 'It&#x27;s a &#x27;test&#x27; string',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(validationUtils.sanitizeString(input)).toBe(expected);
      });
    });

    it('should handle edge cases and empty inputs', () => {
      expect(validationUtils.sanitizeString('')).toBe('');
      expect(validationUtils.sanitizeString(null as any)).toBe('');
      expect(validationUtils.sanitizeString(undefined as any)).toBe('');
    });

    it('should preserve safe content', () => {
      const safeInputs = [
        'Hello World!',
        'This is a normal string',
        'Numbers: 12345',
        'Symbols: @#$%^*()_+-=[]{}|;:,./\\',
        'Unicode: 你好 🌍 café',
        'Email: user@example.com',
        'URL: https://example.com/path?query=value#fragment',
      ];

      safeInputs.forEach((input) => {
        const result = validationUtils.sanitizeString(input);
        // Should not contain HTML entities for safe characters
        expect(result).not.toContain('&lt;');
        expect(result).not.toContain('&gt;');
        expect(result).not.toContain('&quot;');
        expect(result).not.toContain('&#x27;');
        expect(result).not.toContain('&amp;');
      });
    });

    it('should handle complex XSS attempts', () => {
      const xssAttempts = [
        'javascript:alert("xss")',
        'onclick="alert(1)"',
        'onload="malicious()"',
        'onerror="steal_cookies()"',
        '<iframe src="javascript:alert(1)">',
        '<svg onload="alert(1)">',
        '<details open ontoggle="alert(1)">',
        '<marquee onstart="alert(1)">',
        '"><script>alert(1)</script>',
        "';alert(1);//",
        '--><script>alert(1)</script><!--',
      ];

      xssAttempts.forEach((attempt) => {
        const sanitized = validationUtils.sanitizeString(attempt);

        // Should not contain executable script tags
        expect(sanitized).not.toMatch(/<script.*?>/i);
        expect(sanitized).not.toMatch(/javascript:/i);
        expect(sanitized).not.toMatch(/onload=/i);
        expect(sanitized).not.toMatch(/onerror=/i);
        expect(sanitized).not.toMatch(/onclick=/i);

        // Should contain escaped characters instead
        if (attempt.includes('<')) {
          expect(sanitized).toContain('&lt;');
        }
        if (attempt.includes('>')) {
          expect(sanitized).toContain('&gt;');
        }
        if (attempt.includes('"')) {
          expect(sanitized).toContain('&quot;');
        }
      });
    });

    it('should handle performance with large strings', () => {
      const largeString = '<script>alert(1)</script>'.repeat(1000);
      const start = Date.now();
      const result = validationUtils.sanitizeString(largeString);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should process quickly
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });
  });

  describe('sanitizeTags', () => {
    it('should clean and normalize tags', () => {
      const testCases = [
        {
          input: 'javascript, react, nextjs',
          expected: 'javascript,react,nextjs',
        },
        {
          input: 'JavaScript, React, Next.js',
          expected: 'javascript,react,next-js', // Note: dots become hyphens
        },
        {
          input: '  frontend  ,  backend  ,  fullstack  ',
          expected: 'frontend,backend,fullstack',
        },
        {
          input: 'web-dev, mobile-app, api-design',
          expected: 'web-dev,mobile-app,api-design',
        },
        {
          input:
            'tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12',
          expected: 'tag1,tag2,tag3,tag4,tag5,tag6,tag7,tag8,tag9,tag10', // Max 10 tags
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(validationUtils.sanitizeTags(input)).toBe(expected);
      });
    });

    it('should remove invalid characters and tags', () => {
      const testCases = [
        {
          input: 'valid-tag, <script>alert(1)</script>, another-tag',
          expected: 'valid-tag,another-tag',
        },
        {
          input: 'tag@with#special$chars%, valid-tag',
          expected: 'valid-tag',
        },
        {
          input: 'toolongtagnamethatshouldbefiltered, ok',
          expected: 'ok',
        },
        {
          input: ', , , empty, , tags, ,',
          expected: 'empty,tags',
        },
        {
          input: 'spaced tag, hyphen-tag, under_score', // Underscores not allowed
          expected: 'hyphen-tag',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(validationUtils.sanitizeTags(input)).toBe(expected);
      });
    });

    it('should handle edge cases', () => {
      expect(validationUtils.sanitizeTags('')).toBe('');
      expect(validationUtils.sanitizeTags(null as any)).toBe('');
      expect(validationUtils.sanitizeTags(undefined as any)).toBe('');
      expect(validationUtils.sanitizeTags(',,,,')).toBe('');
      expect(validationUtils.sanitizeTags('   ')).toBe('');
    });

    it('should enforce tag format rules', () => {
      const validTags = [
        'javascript',
        'react',
        'next-js',
        'web-development',
        'api-design',
        'full-stack',
        'frontend',
        'backend',
        'database',
        'typescript',
      ];

      const tagsString = validTags.join(', ');
      const result = validationUtils.sanitizeTags(tagsString);
      const resultTags = result.split(',');

      // All tags should be lowercase
      resultTags.forEach((tag) => {
        expect(tag).toBe(tag.toLowerCase());
      });

      // All tags should contain only valid characters
      resultTags.forEach((tag) => {
        expect(tag).toMatch(/^[a-z0-9-]+$/);
      });

      // No tag should be longer than 20 characters
      resultTags.forEach((tag) => {
        expect(tag.length).toBeLessThanOrEqual(20);
      });
    });
  });

  describe('safeValidate', () => {
    const testSchema = z.object({
      name: z.string().min(1).max(50),
      email: z.string().email(),
      age: z.number().min(0).max(120),
    });

    it('should validate correct data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const result = validationUtils.safeValidate(testSchema, validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        name: '', // Too short
        email: 'invalid-email', // Invalid format
        age: -5, // Too young
      };

      const result = validationUtils.safeValidate(testSchema, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeInstanceOf(Array);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some((error) => error.includes('name'))).toBe(
          true
        );
        expect(result.errors.some((error) => error.includes('email'))).toBe(
          true
        );
        expect(result.errors.some((error) => error.includes('age'))).toBe(true);
      }
    });

    it('should handle missing fields', () => {
      const incompleteData = {
        name: 'John Doe',
        // Missing email and age
      };

      const result = validationUtils.safeValidate(testSchema, incompleteData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBe(2); // Missing email and age
      }
    });

    it('should handle extra fields gracefully', () => {
      const dataWithExtras = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        extraField: 'should be ignored',
        anotherExtra: 123,
      };

      const result = validationUtils.safeValidate(testSchema, dataWithExtras);

      expect(result.success).toBe(true);
      if (result.success) {
        // Extra fields should be stripped
        expect(result.data).not.toHaveProperty('extraField');
        expect(result.data).not.toHaveProperty('anotherExtra');
        expect(Object.keys(result.data)).toEqual(['name', 'email', 'age']);
      }
    });
  });

  describe('formatValidationErrors', () => {
    const testSchema = z.object({
      user: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email format'),
      }),
      preferences: z.object({
        theme: z.enum(['light', 'dark'], {
          message: 'Theme must be light or dark',
        }),
      }),
    });

    it('should format nested validation errors correctly', () => {
      const invalidData = {
        user: {
          name: '',
          email: 'invalid-email',
        },
        preferences: {
          theme: 'invalid-theme',
        },
      };

      const parseResult = testSchema.safeParse(invalidData);
      expect(parseResult.success).toBe(false);

      if (!parseResult.success) {
        const formatted = validationUtils.formatValidationErrors(
          parseResult.error
        );

        expect(formatted['user.name']).toBeDefined();
        expect(formatted['user.email']).toBeDefined();
        expect(formatted['preferences.theme']).toBeDefined();

        expect(formatted['user.name']).toContain('Name is required');
        expect(formatted['user.email']).toContain('Invalid email format');
        expect(formatted['preferences.theme']).toContain(
          'Theme must be light or dark'
        );
      }
    });

    it('should handle multiple errors for the same field', () => {
      const multiErrorSchema = z.object({
        password: z
          .string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain uppercase letter')
          .regex(/[0-9]/, 'Password must contain a number'),
      });

      const parseResult = multiErrorSchema.safeParse({ password: 'weak' });
      expect(parseResult.success).toBe(false);

      if (!parseResult.success) {
        const formatted = validationUtils.formatValidationErrors(
          parseResult.error
        );

        expect(formatted).toHaveProperty('password');
        expect(formatted.password).toBeInstanceOf(Array);
        expect(formatted.password.length).toBeGreaterThan(1);
      }
    });
  });

  describe('Security and Performance', () => {
    it('should handle very long inputs efficiently', () => {
      const veryLongString = 'x'.repeat(10000);
      const start = Date.now();

      const sanitized = validationUtils.sanitizeString(veryLongString);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50); // Should be very fast
      expect(sanitized).toBe(veryLongString); // No dangerous chars to replace
    });

    it('should handle unicode and special characters safely', () => {
      const unicodeString = '🚀 Hello 世界 café naïve résumé';
      const sanitized = validationUtils.sanitizeString(unicodeString);

      // Should preserve unicode characters
      expect(sanitized).toBe(unicodeString);
    });

    it('should prevent ReDoS attacks in tag sanitization', () => {
      // Test with potentially problematic inputs for regex
      const problematicInputs = [
        'a'.repeat(1000),
        'a-'.repeat(500),
        ','.repeat(1000),
        'tag,'.repeat(500),
      ];

      problematicInputs.forEach((input) => {
        const start = Date.now();
        validationUtils.sanitizeTags(input);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(100); // Should complete quickly
      });
    });
  });
});
