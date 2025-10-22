/**
 * T071: Unit Tests for GitHub URL Validation
 *
 * Comprehensive unit tests for GitHub URL validation functions,
 * testing valid/invalid URLs, edge cases, and error handling.
 */

import { githubUrlValidation } from '../../src/lib/validations';

describe('GitHub URL Validation', () => {
  describe('isValidGitHubUrl', () => {
    it('should validate correct GitHub repository URLs', () => {
      const validUrls = [
        'https://github.com/owner/repo',
        'https://github.com/owner/repo-name',
        'https://github.com/owner/repo_name',
        'https://github.com/owner/repo.name',
        'https://github.com/owner-name/repo',
        'https://github.com/owner_name/repo',
        'https://github.com/owner.name/repo',
        'https://github.com/microsoft/vscode',
        'https://github.com/facebook/react',
        'https://github.com/vercel/next.js',
        'https://github.com/owner/repo/tree/main',
        'https://github.com/owner/repo/blob/main/README.md',
        'https://github.com/owner/repo/issues/123',
        'https://github.com/owner/repo/pull/456',
        'https://github.com/user123/project-2024',
      ];

      validUrls.forEach((url) => {
        expect(githubUrlValidation.isValidGitHubUrl(url)).toBe(true);
      });
    });

    it('should reject invalid GitHub URLs', () => {
      const invalidUrls = [
        'http://github.com/owner/repo', // HTTP instead of HTTPS
        'https://gitlab.com/owner/repo', // Wrong domain
        'https://github.io/owner/repo', // Wrong subdomain
        'https://github.com/owner', // Missing repository
        'https://github.com/', // Missing owner and repo
        'https://github.com/owner/', // Missing repo
        'https://github.com/owner/repo/owner/repo', // Invalid path structure
        'github.com/owner/repo', // Missing protocol
        'https://github.com/owner@malicious/repo', // Invalid characters
        'https://github.com/owner/repo?evil=script', // Suspicious query params
        'https://github.com/owner/../repo', // Path traversal attempt
        'https://github.com/.owner/repo', // Invalid owner format
        'https://github.com/owner/.repo', // Invalid repo format
      ];

      invalidUrls.forEach((url) => {
        expect(githubUrlValidation.isValidGitHubUrl(url)).toBe(false);
      });
    });

    it('should handle edge cases and invalid inputs', () => {
      const edgeCases = [
        '', // Empty string
        null as any, // Null
        undefined as any, // Undefined
        123 as any, // Number
        {} as any, // Object
        [] as any, // Array
        'not-a-url', // Random string
        'https://example.com', // Valid URL but not GitHub
        'https://github.com/owner/repo with spaces', // Spaces in URL
        'https://github.com/owner/repo\nmalicious', // Newline injection
        'https://github.com/owner/repo#fragment', // Fragment (valid but tested)
      ];

      edgeCases.slice(0, -1).forEach((input) => {
        expect(githubUrlValidation.isValidGitHubUrl(input)).toBe(false);
      });

      // Fragment URLs should be valid
      expect(
        githubUrlValidation.isValidGitHubUrl(
          'https://github.com/owner/repo#fragment'
        )
      ).toBe(true);
    });
  });

  describe('containsMaliciousPatterns', () => {
    it('should detect malicious JavaScript patterns', () => {
      const maliciousUrls = [
        'https://github.com/owner/repo?javascript:alert(1)',
        'https://github.com/owner/repo#javascript:void(0)',
        'https://github.com/owner/repo/tree/main?onload=evil()',
        'https://github.com/owner/repo<script>alert(1)</script>',
        'https://github.com/owner/repo?data:text/html,<script>alert(1)</script>',
        'https://github.com/owner/repo?vbscript:msgbox("xss")',
        'https://github.com/owner/repo?onerror=alert(1)',
      ];

      maliciousUrls.forEach((url) => {
        expect(githubUrlValidation.containsMaliciousPatterns(url)).toBe(true);
      });
    });

    it('should allow safe URLs', () => {
      const safeUrls = [
        'https://github.com/owner/repo',
        'https://github.com/owner/repo/tree/main',
        'https://github.com/owner/repo?tab=readme',
        'https://github.com/owner/repo#installation',
        'https://github.com/owner/repo/blob/main/script.js', // File named script.js is OK
      ];

      safeUrls.forEach((url) => {
        expect(githubUrlValidation.containsMaliciousPatterns(url)).toBe(false);
      });
    });
  });

  describe('sanitizeGitHubUrl', () => {
    it('should remove dangerous characters', () => {
      const testCases = [
        {
          input: 'https://github.com/owner/repo<script>',
          expected: 'https://github.com/owner/repo',
        },
        {
          input: 'https://github.com/owner/repo"onclick="alert(1)"',
          expected: 'https://github.com/owner/repo',
        },
        {
          input: "https://github.com/owner/repo'onload='evil()'",
          expected: 'https://github.com/owner/repo',
        },
        {
          input: 'https://github.com/owner/repo>malicious',
          expected: 'https://github.com/owner/repomalicious',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(githubUrlValidation.sanitizeGitHubUrl(input)).toBe(expected);
      });
    });

    it('should normalize whitespace and case', () => {
      const testCases = [
        {
          input: '  https://github.com/owner/REPO  ',
          expected: 'https://github.com/owner/repo',
        },
        {
          input: 'https://github.com/owner/repo  with  spaces',
          expected: 'https://github.com/owner/repowithspaces',
        },
        {
          input: 'HTTPS://GITHUB.COM/OWNER/REPO',
          expected: 'https://github.com/owner/repo',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(githubUrlValidation.sanitizeGitHubUrl(input)).toBe(expected);
      });
    });

    it('should handle empty or null inputs', () => {
      expect(githubUrlValidation.sanitizeGitHubUrl('')).toBe('');
      expect(githubUrlValidation.sanitizeGitHubUrl(null as any)).toBe('');
      expect(githubUrlValidation.sanitizeGitHubUrl(undefined as any)).toBe('');
    });
  });

  describe('parseGitHubUrl', () => {
    it('should correctly parse repository information', () => {
      const testCases = [
        {
          url: 'https://github.com/microsoft/vscode',
          expected: { owner: 'microsoft', repo: 'vscode' },
        },
        {
          url: 'https://github.com/facebook/react',
          expected: { owner: 'facebook', repo: 'react' },
        },
        {
          url: 'https://github.com/vercel/next.js',
          expected: { owner: 'vercel', repo: 'next.js' },
        },
        {
          url: 'https://github.com/owner_name/repo-name',
          expected: { owner: 'owner_name', repo: 'repo-name' },
        },
      ];

      testCases.forEach(({ url, expected }) => {
        const result = githubUrlValidation.parseGitHubUrl(url);
        expect(result).toEqual(expected);
      });
    });

    it('should parse URLs with paths', () => {
      const testCases = [
        {
          url: 'https://github.com/owner/repo/tree/main',
          expected: { owner: 'owner', repo: 'repo', path: 'tree/main' },
        },
        {
          url: 'https://github.com/owner/repo/blob/main/README.md',
          expected: {
            owner: 'owner',
            repo: 'repo',
            path: 'blob/main/README.md',
          },
        },
        {
          url: 'https://github.com/owner/repo/issues/123',
          expected: { owner: 'owner', repo: 'repo', path: 'issues/123' },
        },
        {
          url: 'https://github.com/owner/repo/pull/456/files',
          expected: { owner: 'owner', repo: 'repo', path: 'pull/456/files' },
        },
      ];

      testCases.forEach(({ url, expected }) => {
        const result = githubUrlValidation.parseGitHubUrl(url);
        expect(result).toEqual(expected);
      });
    });

    it('should return null for invalid URLs', () => {
      const invalidUrls = [
        'https://gitlab.com/owner/repo',
        'https://github.com/owner',
        'https://github.com/',
        'not-a-url',
        'https://github.com/owner@malicious/repo',
      ];

      invalidUrls.forEach((url) => {
        expect(githubUrlValidation.parseGitHubUrl(url)).toBeNull();
      });
    });
  });

  describe('validateAndNormalize', () => {
    it('should validate and normalize correct URLs', () => {
      const validUrls = [
        '  https://github.com/owner/REPO  ',
        'https://github.com/microsoft/vscode',
        'https://github.com/vercel/next.js/tree/canary',
      ];

      validUrls.forEach((url) => {
        const result = githubUrlValidation.validateAndNormalize(url);
        expect(result.isValid).toBe(true);
        expect(result.url).toBeDefined();
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid URLs with appropriate errors', () => {
      const testCases = [
        {
          input: '',
          expectedError: 'URL is required',
        },
        {
          input: null as any,
          expectedError: 'URL is required',
        },
        {
          input: 'https://gitlab.com/owner/repo',
          expectedError: 'Invalid GitHub repository URL',
        },
        {
          input: 'not-a-url',
          expectedError: 'Invalid GitHub repository URL',
        },
        {
          input: 'https://github.com/owner<script>alert(1)</script>/repo',
          expectedError: 'Invalid GitHub repository URL',
        },
      ];

      testCases.forEach(({ input, expectedError }) => {
        const result = githubUrlValidation.validateAndNormalize(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(expectedError);
        expect(result.url).toBeUndefined();
      });
    });

    it('should handle malicious URLs', () => {
      const maliciousUrls = [
        'https://github.com/owner/repo?javascript:alert(1)',
        'https://github.com/owner/repo<script>evil()</script>',
        'https://github.com/owner/repo?onload=malicious()',
      ];

      maliciousUrls.forEach((url) => {
        const result = githubUrlValidation.validateAndNormalize(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid GitHub repository URL');
      });
    });
  });

  describe('Performance and Security', () => {
    it('should handle long URLs efficiently', () => {
      const longUrl = 'https://github.com/owner/repo/' + 'a'.repeat(1000);
      const start = Date.now();
      const result = githubUrlValidation.isValidGitHubUrl(longUrl);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should process in under 100ms
      expect(result).toBe(true); // Long paths are valid
    });

    it('should handle regex DoS protection', () => {
      // Test with potentially problematic regex inputs
      const testUrls = [
        'https://github.com/owner/repo' + '/'.repeat(100),
        'https://github.com/' + 'a'.repeat(50) + '/' + 'b'.repeat(50),
        'https://github.com/owner/repo?' + 'x=y&'.repeat(100),
      ];

      testUrls.forEach((url) => {
        const start = Date.now();
        githubUrlValidation.isValidGitHubUrl(url);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(50); // Should be very fast
      });
    });
  });
});
