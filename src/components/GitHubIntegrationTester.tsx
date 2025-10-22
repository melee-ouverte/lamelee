/**
 * T064-T065: GitHub Integration Testing Component
 *
 * Simple React component for testing GitHub OAuth and URL preview functionality
 * using basic HTML elements for maximum compatibility.
 */

'use client';

import React, { useState } from 'react';

interface OAuthTestResult {
  isValid: boolean;
  user?: any;
  rateLimit?: any;
  error?: string;
  tokenScopes?: string[];
}

interface URLPreviewResult {
  url: string;
  type: string;
  title: string;
  description?: string;
  image?: string;
  metadata?: any;
  error?: string;
}

const GitHubIntegrationTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'oauth' | 'preview'>('oauth');
  const [accessToken, setAccessToken] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState(
    'https://github.com/octocat/Hello-World'
  );
  const [testUrl, setTestUrl] = useState(
    'https://github.com/octocat/Hello-World'
  );
  const [oauthResults, setOauthResults] = useState<OAuthTestResult | null>(
    null
  );
  const [previewResults, setPreviewResults] = useState<URLPreviewResult | null>(
    null
  );

  const testOAuth = async (action: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/github/oauth-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          accessToken: accessToken || undefined,
          repositoryUrl:
            action === 'test_repo_access' ? repositoryUrl : undefined,
          requiredScopes: ['user', 'public_repo'],
        }),
      });

      const result = await response.json();
      setOauthResults(result.data);
    } catch (error) {
      console.error('OAuth test failed:', error);
      setOauthResults({
        isValid: false,
        error: 'Test request failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testURLPreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/github/url-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: testUrl,
          includeMetadata: true,
        }),
      });

      const result = await response.json();
      setPreviewResults(result.data);
    } catch (error) {
      console.error('URL preview test failed:', error);
      setPreviewResults({
        url: testUrl,
        type: 'error',
        title: 'Preview Error',
        error: 'Preview request failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderOAuthResults = () => {
    if (!oauthResults) return null;

    return (
      <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {oauthResults.isValid ? (
              <span className="w-5 h-5 text-green-500">✓</span>
            ) : (
              <span className="w-5 h-5 text-red-500">✗</span>
            )}
            OAuth Test Results
          </h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          {oauthResults.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{oauthResults.error}</p>
            </div>
          )}

          {oauthResults.user && (
            <div className="p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-3">👤 User Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Username:</span>{' '}
                  {oauthResults.user.login}
                </div>
                <div>
                  <span className="font-medium">Name:</span>{' '}
                  {oauthResults.user.name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{' '}
                  {oauthResults.user.email || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Public Repos:</span>{' '}
                  {oauthResults.user.public_repos}
                </div>
                <div>
                  <span className="font-medium">Followers:</span>{' '}
                  {oauthResults.user.followers}
                </div>
                <div>
                  <span className="font-medium">Following:</span>{' '}
                  {oauthResults.user.following}
                </div>
              </div>
            </div>
          )}

          {oauthResults.rateLimit && (
            <div className="p-4 bg-blue-50 rounded-md">
              <h4 className="font-medium mb-3">🕒 Rate Limit Status</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Remaining:</span>{' '}
                  {oauthResults.rateLimit.remaining}
                </div>
                <div>
                  <span className="font-medium">Limit:</span>{' '}
                  {oauthResults.rateLimit.limit}
                </div>
                <div>
                  <span className="font-medium">Used:</span>{' '}
                  {oauthResults.rateLimit.used}
                </div>
                <div>
                  <span className="font-medium">Reset:</span>{' '}
                  {new Date(
                    oauthResults.rateLimit.reset * 1000
                  ).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {oauthResults.tokenScopes && (
            <div className="p-4 bg-green-50 rounded-md">
              <h4 className="font-medium mb-3">Token Scopes</h4>
              <div className="flex flex-wrap gap-2">
                {oauthResults.tokenScopes.map((scope) => (
                  <span
                    key={scope}
                    className="px-2 py-1 bg-white border border-gray-200 rounded text-xs"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPreviewResults = () => {
    if (!previewResults) return null;

    return (
      <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {previewResults.type === 'error' ? (
              <span className="w-5 h-5 text-red-500">✗</span>
            ) : (
              <span className="w-5 h-5 text-green-500">✓</span>
            )}
            URL Preview Results
          </h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          {previewResults.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{previewResults.error}</p>
            </div>
          )}

          {previewResults.type !== 'error' && (
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-start gap-4">
                {previewResults.image && (
                  <img
                    src={previewResults.image}
                    alt={previewResults.title}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {previewResults.title}
                  </h3>
                  {previewResults.description && (
                    <p className="text-gray-600 text-sm mt-1">
                      {previewResults.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs">
                      {previewResults.type}
                    </span>
                    <a
                      href={previewResults.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      🔗 View
                    </a>
                  </div>
                </div>
              </div>

              {previewResults.metadata &&
                previewResults.type === 'github-repo' && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-3">🔧 Repository Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>⭐ {previewResults.metadata.stars} stars</div>
                      <div>🍴 {previewResults.metadata.forks} forks</div>
                      <div>👁️ {previewResults.metadata.issues} issues</div>
                      <div>
                        <span className="font-medium">Language:</span>{' '}
                        {previewResults.metadata.language || 'N/A'}
                      </div>
                    </div>
                    {previewResults.metadata.topics &&
                      previewResults.metadata.topics.length > 0 && (
                        <div className="mt-3">
                          <span className="font-medium text-sm">Topics:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {previewResults.metadata.topics.map(
                              (topic: string) => (
                                <span
                                  key={topic}
                                  className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs"
                                >
                                  {topic}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          GitHub Integration Tester
        </h1>
        <p className="text-gray-600">
          Test GitHub OAuth integration and URL preview functionality
        </p>
      </div>

      {/* Simple tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'oauth'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            OAuth Testing
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            URL Preview
          </button>
        </nav>
      </div>

      {activeTab === 'oauth' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                GitHub OAuth Testing
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Test GitHub OAuth token validation and API access
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Access Token (optional)
                </label>
                <input
                  type="password"
                  placeholder="ghp_... (leave empty to use environment token)"
                  value={accessToken}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAccessToken(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Uses GITHUB_ACCESS_TOKEN from environment if not provided
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository URL (for repository access test)
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  value={repositoryUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRepositoryUrl(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => testOAuth('test_token')}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '⏳ Testing...' : 'Test Token'}
                </button>
                <button
                  onClick={() => testOAuth('validate_scopes')}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Validate Scopes
                </button>
                <button
                  onClick={() => testOAuth('test_repo_access')}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Repo Access
                </button>
                <button
                  onClick={() => testOAuth('get_rate_limit')}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check Rate Limit
                </button>
              </div>
            </div>
          </div>

          {renderOAuthResults()}
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                URL Preview Testing
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Test URL preview generation for GitHub and other URLs
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL to Preview
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  value={testUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTestUrl(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={testURLPreview}
                  disabled={isLoading || !testUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '⏳ Generating...' : 'Generate Preview'}
                </button>
                <button
                  onClick={() =>
                    setTestUrl('https://github.com/octocat/Hello-World')
                  }
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Example Repo
                </button>
                <button
                  onClick={() => setTestUrl('https://github.com/octocat')}
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Example User
                </button>
                <button
                  onClick={() =>
                    setTestUrl(
                      'https://gist.github.com/octocat/6cad326836d38bd3a7ae'
                    )
                  }
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Example Gist
                </button>
              </div>
            </div>
          </div>

          {renderPreviewResults()}
        </div>
      )}
    </div>
  );
};

export default GitHubIntegrationTester;
