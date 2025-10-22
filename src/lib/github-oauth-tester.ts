/**
 * T064: GitHub OAuth Integration Testing Service
 *
 * Provides utilities to test and validate GitHub OAuth integration,
 * including token validation, rate limit checking, and user data verification.
 */

import { Octokit } from '@octokit/rest';

interface GitHubUserData {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

interface GitHubOAuthTestResult {
  isValid: boolean;
  user?: GitHubUserData;
  rateLimit?: GitHubRateLimit;
  error?: string;
  tokenScopes?: string[];
}

export class GitHubOAuthTester {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  /**
   * Test GitHub OAuth token validity and fetch user data
   */
  async testOAuthToken(): Promise<GitHubOAuthTestResult> {
    try {
      // Test token by fetching authenticated user
      const userResponse = await this.octokit.rest.users.getAuthenticated();

      // Get rate limit information
      const rateLimitResponse = await this.octokit.rest.rateLimit.get();

      return {
        isValid: true,
        user: userResponse.data,
        rateLimit: rateLimitResponse.data.rate,
        tokenScopes: this.parseTokenScopes(userResponse.headers),
      };
    } catch (error: any) {
      console.error('GitHub OAuth test failed:', error);

      return {
        isValid: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Test repository access with the current token
   */
  async testRepositoryAccess(owner: string, repo: string) {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return {
        success: true,
        repository: {
          id: response.data.id,
          name: response.data.name,
          fullName: response.data.full_name,
          description: response.data.description,
          private: response.data.private,
          url: response.data.html_url,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Repository access failed',
        status: error.status,
      };
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimit(): Promise<GitHubRateLimit> {
    const response = await this.octokit.rest.rateLimit.get();
    return response.data.rate;
  }

  /**
   * Parse token scopes from response headers
   */
  private parseTokenScopes(headers: any): string[] {
    const scopeHeader = headers['x-oauth-scopes'];
    if (!scopeHeader) return [];

    return scopeHeader
      .split(',')
      .map((scope: string) => scope.trim())
      .filter(Boolean);
  }

  /**
   * Validate required scopes for the application
   */
  async validateRequiredScopes(
    requiredScopes: string[] = ['user', 'public_repo']
  ): Promise<{
    hasRequiredScopes: boolean;
    missingScopes: string[];
    currentScopes: string[];
  }> {
    const testResult = await this.testOAuthToken();

    if (!testResult.isValid || !testResult.tokenScopes) {
      return {
        hasRequiredScopes: false,
        missingScopes: requiredScopes,
        currentScopes: [],
      };
    }

    const currentScopes = testResult.tokenScopes;
    const missingScopes = requiredScopes.filter(
      (scope) => !currentScopes.includes(scope)
    );

    return {
      hasRequiredScopes: missingScopes.length === 0,
      missingScopes,
      currentScopes,
    };
  }
}

/**
 * Static utility functions for GitHub OAuth testing
 */
export const GitHubOAuthUtils = {
  /**
   * Test a GitHub access token without creating a class instance
   */
  async testToken(accessToken: string): Promise<GitHubOAuthTestResult> {
    const tester = new GitHubOAuthTester(accessToken);
    return await tester.testOAuthToken();
  },

  /**
   * Quick validation of token format (basic check)
   */
  isValidTokenFormat(token: string): boolean {
    // GitHub personal access tokens are typically 40 characters
    // GitHub App tokens start with 'ghs_' and are longer
    // OAuth tokens start with 'gho_' and are around 36 characters
    return (
      /^(gh[ps]_[a-zA-Z0-9]{36,40}|gho_[a-zA-Z0-9]{16})$/.test(token) ||
      /^[a-f0-9]{40}$/.test(token)
    ); // Legacy format
  },

  /**
   * Extract owner and repo from GitHub URL
   */
  parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\.git|\/)?$/);
    if (!match) return null;

    return {
      owner: match[1],
      repo: match[2],
    };
  },

  /**
   * Generate OAuth URL for GitHub authentication
   */
  generateOAuthUrl(
    clientId: string,
    redirectUri: string,
    scopes: string[] = ['user', 'public_repo']
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  },
};

export default GitHubOAuthTester;
