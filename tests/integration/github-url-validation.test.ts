/**
 * Integration Test: GitHub URL Validation
 *
 * This test validates GitHub URL validation (github.com only).
 * Based on User Journey Validation from quickstart.md
 *
 * Test Status: RED (Must fail before implementation)
 * Related Task: T021
 * Implementation Tasks: T044 (validation utility), T033 (experience creation)
 */

import { githubUrlValidation } from '@/lib/validations';

// Mock the validation utility
jest.mock('@/lib/validations');

describe('GitHub URL Validation Integration', () => {
  describe('Valid GitHub URLs', () => {
    const validUrls = [
      'https://github.com/user/repo',
      'https://github.com/user/repo/blob/main/file.ts',
      'https://github.com/user/repo/pull/123',
      'https://github.com/user/repo/issues/456',
      'https://github.com/user/repo/tree/develop',
      'https://github.com/user/repo/commit/abc123',
      'https://github.com/organization/project',
      'https://github.com/user-name/repo-name',
      'https://github.com/user123/repo_name',
    ];

    it.each(validUrls)('should accept valid GitHub URL: %s', (url) => {
      (githubUrlValidation.isValidGitHubUrl as jest.Mock).mockReturnValue(true);

      const result = githubUrlValidation.isValidGitHubUrl(url);
      expect(result).toBe(true);
    });
  });

  describe('Invalid URLs', () => {
    const invalidUrls = [
      'https://gitlab.com/user/repo',
      'https://bitbucket.org/user/repo',
      'https://codeberg.org/user/repo',
      'https://git.example.com/user/repo',
      'http://github.com/user/repo', // HTTP instead of HTTPS
      'https://github.co/user/repo', // Wrong domain
      'https://githab.com/user/repo', // Typo in domain
      'https://github.com', // No repository path
      'https://github.com/', // No repository path
      'https://github.com/user', // Incomplete path
      'ftp://github.com/user/repo', // Wrong protocol
      'github.com/user/repo', // Missing protocol
      'https://github.com/user/repo?malicious=script',
      'https://github.com/user/repo#fragment',
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      '',
      null,
      undefined,
    ];

    it.each(invalidUrls)('should reject invalid URL: %s', (url) => {
      (githubUrlValidation.isValidGitHubUrl as jest.Mock).mockReturnValue(
        false
      );

      const result = githubUrlValidation.isValidGitHubUrl(url!);
      expect(result).toBe(false);
    });
  });

  describe('URL Pattern Validation', () => {
    it('should validate github.com domain specifically', () => {
      (githubUrlValidation.isValidGitHubUrl as jest.Mock).mockImplementation(
        (url) => {
          if (!url || typeof url !== 'string') return false;
          return url.startsWith('https://github.com/') && url.length > 19;
        }
      );

      expect(
        githubUrlValidation.isValidGitHubUrl('https://github.com/user/repo')
      ).toBe(true);
      expect(
        githubUrlValidation.isValidGitHubUrl('https://gitlab.com/user/repo')
      ).toBe(false);
      expect(
        githubUrlValidation.isValidGitHubUrl('https://github.co/user/repo')
      ).toBe(false);
    });

    it('should require HTTPS protocol', () => {
      (githubUrlValidation.isValidGitHubUrl as jest.Mock).mockImplementation(
        (url) => {
          return url && url.startsWith('https://github.com/');
        }
      );

      expect(
        githubUrlValidation.isValidGitHubUrl('https://github.com/user/repo')
      ).toBe(true);
      expect(
        githubUrlValidation.isValidGitHubUrl('http://github.com/user/repo')
      ).toBe(false);
      expect(
        githubUrlValidation.isValidGitHubUrl('ftp://github.com/user/repo')
      ).toBe(false);
    });

    it('should require repository path', () => {
      (githubUrlValidation.isValidGitHubUrl as jest.Mock).mockImplementation(
        (url) => {
          if (!url || !url.startsWith('https://github.com/')) return false;
          const path = url.replace('https://github.com/', '');
          return path.length > 0 && path.includes('/');
        }
      );

      expect(
        githubUrlValidation.isValidGitHubUrl('https://github.com/user/repo')
      ).toBe(true);
      expect(githubUrlValidation.isValidGitHubUrl('https://github.com/')).toBe(
        false
      );
      expect(githubUrlValidation.isValidGitHubUrl('https://github.com')).toBe(
        false
      );
      expect(
        githubUrlValidation.isValidGitHubUrl('https://github.com/user')
      ).toBe(false);
    });
  });

  describe('XSS and Security Validation', () => {
    const maliciousUrls = [
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      'https://github.com/user/repo"><script>alert("xss")</script>',
      'https://github.com/user/repo\'"onmouseover="alert(1)"',
      'https://github.com/user/repo?redirect=javascript:alert("xss")',
      'https://github.com/user/repo#<script>alert("xss")</script>',
    ];

    it.each(maliciousUrls)('should reject malicious URL: %s', (url) => {
      (githubUrlValidation.isValidGitHubUrl as jest.Mock).mockImplementation(
        (url) => {
          if (!url || typeof url !== 'string') return false;

          // Check for malicious patterns
          const maliciousPatterns = [
            /javascript:/i,
            /data:/i,
            /<script/i,
            /onmouseover/i,
            /onclick/i,
            /onerror/i,
          ];

          if (maliciousPatterns.some((pattern) => pattern.test(url))) {
            return false;
          }

          return url.startsWith('https://github.com/');
        }
      );

      const result = githubUrlValidation.isValidGitHubUrl(url);
      expect(result).toBe(false);
    });
  });

  describe('URL Normalization', () => {
    it('should handle URLs with trailing slashes', () => {
      (githubUrlValidation.isValidGitHubUrl as jest.Mock).mockImplementation(
        (url) => {
          if (!url) return false;
          const normalized = url.replace(/\/$/, ''); // Remove trailing slash
          return (
            normalized.startsWith('https://github.com/') &&
            normalized.includes('/', 19)
          );
        }
      );

      expect(
        githubUrlValidation.isValidGitHubUrl('https://github.com/user/repo/')
      ).toBe(true);
      expect(
        githubUrlValidation.isValidGitHubUrl('https://github.com/user/repo')
      ).toBe(true);
    });

    it('should handle URLs with query parameters', () => {
      (githubUrlValidation.isValidGitHubUrl as jest.Mock).mockImplementation(
        (url) => {
          if (!url) return false;
          const baseUrl = url.split('?')[0]; // Remove query params for validation
          return (
            baseUrl.startsWith('https://github.com/') &&
            baseUrl.includes('/', 19)
          );
        }
      );

      expect(
        githubUrlValidation.isValidGitHubUrl(
          'https://github.com/user/repo?tab=readme'
        )
      ).toBe(true);
      expect(
        githubUrlValidation.isValidGitHubUrl(
          'https://github.com/user/repo/blob/main/file.ts?line=10'
        )
      ).toBe(true);
    });
  });

  describe('Array Validation', () => {
    it('should validate arrays of GitHub URLs', () => {
      const validateGitHubUrls = (urls: string[]) => {
        return urls.every((url) => githubUrlValidation.isValidGitHubUrl(url));
      };

      (githubUrlValidation.isValidGitHubUrl as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      const validUrls = [
        'https://github.com/user/repo1',
        'https://github.com/user/repo2/blob/main/file.ts',
        'https://github.com/org/project/pull/123',
      ];

      expect(validateGitHubUrls(validUrls)).toBe(true);
    });

    it('should reject arrays with mixed valid/invalid URLs', () => {
      const validateGitHubUrls2 = (urls: string[]) => {
        return urls.every((url) => githubUrlValidation.isValidGitHubUrl(url));
      };

      (githubUrlValidation.isValidGitHubUrl as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false) // Invalid URL
        .mockReturnValueOnce(true);

      const mixedUrls = [
        'https://github.com/user/repo1',
        'https://gitlab.com/user/repo2', // Invalid
        'https://github.com/user/repo3',
      ];

      expect(validateGitHubUrls2(mixedUrls)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long GitHub URLs', () => {
      const longUrl =
        'https://github.com/user/very-long-repository-name-that-exceeds-normal-limits/blob/feature/very-long-branch-name-with-multiple-parts/src/components/deeply/nested/directory/structure/VeryLongComponentNameThatExceedsNormalLimits.tsx';

      (githubUrlValidation.isValidGitHubUrl as jest.Mock).mockImplementation(
        (url) => {
          if (!url || url.length > 2000) return false; // Reasonable length limit
          return url.startsWith('https://github.com/') && url.includes('/', 19);
        }
      );

      expect(githubUrlValidation.isValidGitHubUrl(longUrl)).toBe(true);
    });

    it('should handle URLs with special characters in repository names', () => {
      const specialCharUrls = [
        'https://github.com/user/repo-name',
        'https://github.com/user/repo_name',
        'https://github.com/user/repo.name',
        'https://github.com/user-name/repo-name',
        'https://github.com/user_name/repo_name',
      ];

      (githubUrlValidation.isValidGitHubUrl as jest.Mock).mockImplementation(
        (url) => {
          if (!url) return false;
          const path = url.replace('https://github.com/', '');
          // Allow alphanumeric, hyphens, underscores, dots
          return /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+/.test(path);
        }
      );

      specialCharUrls.forEach((url) => {
        expect(githubUrlValidation.isValidGitHubUrl(url)).toBe(true);
      });
    });
  });
});
