/**
 * T064: GitHub OAuth Testing API
 *
 * API endpoint for testing GitHub OAuth integration and token validation.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import GitHubOAuthTester, {
  GitHubOAuthUtils,
} from '../../../lib/github-oauth-tester';

interface TestRequest {
  action:
    | 'test_token'
    | 'test_repo_access'
    | 'validate_scopes'
    | 'get_rate_limit';
  accessToken?: string;
  repositoryUrl?: string;
  requiredScopes?: string[];
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { action, accessToken, repositoryUrl, requiredScopes }: TestRequest =
      req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required',
      });
    }

    // Use provided token or try to get from session
    const token = accessToken || process.env.GITHUB_ACCESS_TOKEN;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'GitHub access token is required',
      });
    }

    // Validate token format
    if (!GitHubOAuthUtils.isValidTokenFormat(token)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GitHub token format',
      });
    }

    const tester = new GitHubOAuthTester(token);
    let result;

    switch (action) {
      case 'test_token':
        result = await tester.testOAuthToken();
        return res.status(200).json({
          success: result.isValid,
          data: result,
          message: result.isValid
            ? 'Token is valid'
            : 'Token validation failed',
        });

      case 'test_repo_access':
        if (!repositoryUrl) {
          return res.status(400).json({
            success: false,
            error: 'Repository URL is required for repo access test',
          });
        }

        const repoInfo = GitHubOAuthUtils.parseGitHubUrl(repositoryUrl);
        if (!repoInfo) {
          return res.status(400).json({
            success: false,
            error: 'Invalid GitHub repository URL',
          });
        }

        result = await tester.testRepositoryAccess(
          repoInfo.owner,
          repoInfo.repo
        );
        return res.status(200).json({
          success: result.success,
          data: result,
          message: result.success
            ? 'Repository access successful'
            : 'Repository access failed',
        });

      case 'validate_scopes':
        const scopes = requiredScopes || ['user', 'public_repo'];
        result = await tester.validateRequiredScopes(scopes);
        return res.status(200).json({
          success: result.hasRequiredScopes,
          data: result,
          message: result.hasRequiredScopes
            ? 'All required scopes are present'
            : `Missing required scopes: ${result.missingScopes.join(', ')}`,
        });

      case 'get_rate_limit':
        result = await tester.getRateLimit();
        return res.status(200).json({
          success: true,
          data: result,
          message: `Rate limit: ${result.remaining}/${result.limit} remaining`,
        });

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`,
        });
    }
  } catch (error) {
    console.error('GitHub OAuth test API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
