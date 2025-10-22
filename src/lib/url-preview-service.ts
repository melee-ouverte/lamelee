/**
 * T065: GitHub URL Preview Service
 *
 * Provides URL preview functionality for GitHub repositories and other URLs,
 * fetching metadata, repository information, and generating rich previews.
 */

import { Octokit } from '@octokit/rest';

interface URLPreview {
  url: string;
  type: 'github-repo' | 'github-user' | 'github-gist' | 'generic' | 'error';
  title: string;
  description?: string;
  image?: string;
  metadata?: Record<string, any>;
  error?: string;
}

interface GitHubRepoPreview {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  issues: number;
  isPrivate: boolean;
  owner: {
    login: string;
    avatarUrl: string;
    type: string;
  };
  topics: string[];
  lastUpdated: string;
  defaultBranch: string;
  size: number;
  license?: string;
}

interface GitHubUserPreview {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  company: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  hireable: boolean | null;
  createdAt: string;
}

export class URLPreviewService {
  private octokit: Octokit;

  constructor(githubToken?: string) {
    this.octokit = new Octokit({
      auth: githubToken,
    });
  }

  /**
   * Generate preview for any URL
   */
  async generatePreview(url: string): Promise<URLPreview> {
    try {
      // Normalize URL
      const normalizedUrl = this.normalizeUrl(url);

      // Determine URL type
      const urlType = this.determineUrlType(normalizedUrl);

      switch (urlType) {
        case 'github-repo':
          return await this.generateGitHubRepoPreview(normalizedUrl);
        case 'github-user':
          return await this.generateGitHubUserPreview(normalizedUrl);
        case 'github-gist':
          return await this.generateGitHubGistPreview(normalizedUrl);
        case 'generic':
          return await this.generateGenericPreview(normalizedUrl);
        default:
          return this.createErrorPreview(normalizedUrl, 'Unsupported URL type');
      }
    } catch (error: any) {
      console.error('URL preview generation failed:', error);
      return this.createErrorPreview(
        url,
        error.message || 'Preview generation failed'
      );
    }
  }

  /**
   * Generate preview for GitHub repository
   */
  private async generateGitHubRepoPreview(url: string): Promise<URLPreview> {
    const { owner, repo } = this.parseGitHubRepoUrl(url) || {};

    if (!owner || !repo) {
      return this.createErrorPreview(url, 'Invalid GitHub repository URL');
    }

    try {
      const [repoResponse, languagesResponse] = await Promise.all([
        this.octokit.rest.repos.get({ owner, repo }),
        this.octokit.rest.repos
          .listLanguages({ owner, repo })
          .catch(() => ({ data: {} })),
      ]);

      const repoData = repoResponse.data;
      const languages = Object.keys(languagesResponse.data);
      const primaryLanguage = languages[0] || null;

      const preview: GitHubRepoPreview = {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        language: repoData.language || primaryLanguage,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        issues: repoData.open_issues_count,
        isPrivate: repoData.private,
        owner: {
          login: repoData.owner.login,
          avatarUrl: repoData.owner.avatar_url,
          type: repoData.owner.type,
        },
        topics: repoData.topics || [],
        lastUpdated: repoData.updated_at,
        defaultBranch: repoData.default_branch,
        size: repoData.size,
        license: repoData.license?.name,
      };

      return {
        url,
        type: 'github-repo',
        title: repoData.full_name,
        description:
          repoData.description ||
          `${repoData.language || 'Code'} repository by ${repoData.owner.login}`,
        image: repoData.owner.avatar_url,
        metadata: preview,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return this.createErrorPreview(url, 'Repository not found or private');
      }
      throw error;
    }
  }

  /**
   * Generate preview for GitHub user profile
   */
  private async generateGitHubUserPreview(url: string): Promise<URLPreview> {
    const username = this.parseGitHubUserUrl(url);

    if (!username) {
      return this.createErrorPreview(url, 'Invalid GitHub user URL');
    }

    try {
      const userResponse = await this.octokit.rest.users.getByUsername({
        username,
      });
      const userData = userResponse.data;

      const preview: GitHubUserPreview = {
        login: userData.login,
        name: userData.name,
        bio: userData.bio,
        avatarUrl: userData.avatar_url,
        publicRepos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        company: userData.company,
        location: userData.location,
        blog: userData.blog,
        email: userData.email,
        hireable: userData.hireable,
        createdAt: userData.created_at,
      };

      return {
        url,
        type: 'github-user',
        title: userData.name || userData.login,
        description:
          userData.bio ||
          `GitHub user with ${userData.public_repos} public repositories`,
        image: userData.avatar_url,
        metadata: preview,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return this.createErrorPreview(url, 'User not found');
      }
      throw error;
    }
  }

  /**
   * Generate preview for GitHub Gist
   */
  private async generateGitHubGistPreview(url: string): Promise<URLPreview> {
    const gistId = this.parseGitHubGistUrl(url);

    if (!gistId) {
      return this.createErrorPreview(url, 'Invalid GitHub Gist URL');
    }

    try {
      const gistResponse = await this.octokit.rest.gists.get({
        gist_id: gistId,
      });
      const gistData = gistResponse.data;

      const fileNames = Object.keys(gistData.files || {});
      const firstFile = fileNames[0] ? gistData.files![fileNames[0]] : null;
      const language = firstFile?.language || 'Text';

      return {
        url,
        type: 'github-gist',
        title: gistData.description || `${language} Gist`,
        description: `${fileNames.length} file(s) • ${language}${gistData.public ? ' • Public' : ' • Secret'}`,
        image: gistData.owner?.avatar_url,
        metadata: {
          id: gistData.id,
          description: gistData.description,
          public: gistData.public,
          files: fileNames,
          owner: gistData.owner?.login,
          createdAt: gistData.created_at,
          updatedAt: gistData.updated_at,
        },
      };
    } catch (error: any) {
      if (error.status === 404) {
        return this.createErrorPreview(url, 'Gist not found');
      }
      throw error;
    }
  }

  /**
   * Generate preview for generic URLs using meta tags
   */
  private async generateGenericPreview(url: string): Promise<URLPreview> {
    try {
      // For now, return a basic preview
      // In a production app, you'd want to fetch the URL and parse meta tags
      const urlObj = new URL(url);

      return {
        url,
        type: 'generic',
        title: urlObj.hostname,
        description: `External link to ${urlObj.hostname}`,
        metadata: {
          hostname: urlObj.hostname,
          pathname: urlObj.pathname,
        },
      };
    } catch (error) {
      return this.createErrorPreview(url, 'Invalid URL format');
    }
  }

  /**
   * Utility methods
   */
  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url.replace(/\/$/, ''); // Remove trailing slash
  }

  private determineUrlType(url: string): URLPreview['type'] {
    const urlObj = new URL(url);

    if (
      urlObj.hostname === 'github.com' ||
      urlObj.hostname === 'www.github.com'
    ) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (pathParts.length === 1) {
        return 'github-user';
      } else if (pathParts.length >= 2 && !pathParts[0].startsWith('gist')) {
        return 'github-repo';
      }
    }

    if (urlObj.hostname === 'gist.github.com') {
      return 'github-gist';
    }

    return 'generic';
  }

  private parseGitHubRepoUrl(
    url: string
  ): { owner: string; repo: string } | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (pathParts.length >= 2) {
        return {
          owner: pathParts[0],
          repo: pathParts[1],
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private parseGitHubUserUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (pathParts.length === 1) {
        return pathParts[0];
      }
      return null;
    } catch {
      return null;
    }
  }

  private parseGitHubGistUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      // Gist URLs: gist.github.com/username/gist_id
      if (pathParts.length >= 2) {
        return pathParts[1];
      }
      return null;
    } catch {
      return null;
    }
  }

  private createErrorPreview(url: string, error: string): URLPreview {
    return {
      url,
      type: 'error',
      title: 'Preview Error',
      description: error,
      error,
    };
  }
}

/**
 * Static utility functions for URL preview
 */
export const URLPreviewUtils = {
  /**
   * Quick check if URL is a GitHub URL
   */
  isGitHubUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['github.com', 'www.github.com', 'gist.github.com'].includes(
        urlObj.hostname
      );
    } catch {
      return false;
    }
  },

  /**
   * Extract GitHub repository info from URL
   */
  extractGitHubInfo(
    url: string
  ): { type: string; owner?: string; repo?: string; gistId?: string } | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (urlObj.hostname === 'gist.github.com' && pathParts.length >= 2) {
        return {
          type: 'gist',
          gistId: pathParts[1],
        };
      }

      if (
        urlObj.hostname === 'github.com' ||
        urlObj.hostname === 'www.github.com'
      ) {
        if (pathParts.length === 1) {
          return {
            type: 'user',
            owner: pathParts[0],
          };
        } else if (pathParts.length >= 2) {
          return {
            type: 'repo',
            owner: pathParts[0],
            repo: pathParts[1],
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  },
};

export default URLPreviewService;
