/**
 * T077: Swagger UI API Documentation Page
 *
 * Interactive API documentation using Swagger UI for the
 * AI Coding Assistant Experience Platform.
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function ApiDocs() {
  const [swaggerInitialized, setSwaggerInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !swaggerInitialized) {
      // Dynamically load Swagger UI bundle
      const script = document.createElement('script');
      script.src =
        'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js';
      script.onload = () => {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css';
        document.head.appendChild(css);

        // Initialize Swagger UI
        (window as any).SwaggerUIBundle({
          url: '/docs/openapi.yaml',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            (window as any).SwaggerUIBundle.presets.apis,
            (window as any).SwaggerUIBundle.presets.standalone,
          ],
          plugins: [(window as any).SwaggerUIBundle.plugins.DownloadUrl],
          layout: 'StandaloneLayout',
          tryItOutEnabled: true,
          requestInterceptor: (request: any) => {
            // Add any custom headers or modify requests here
            return request;
          },
          responseInterceptor: (response: any) => {
            // Handle responses here if needed
            return response;
          },
          onComplete: () => {
            console.log('Swagger UI loaded successfully');
          },
          docExpansion: 'list',
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
          displayOperationId: false,
          displayRequestDuration: true,
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          syntaxHighlight: {
            activate: true,
            theme: 'agate',
          },
          validatorUrl: null,
        });

        setSwaggerInitialized(true);
      };
      document.body.appendChild(script);
    }
  }, [swaggerInitialized]);

  return (
    <>
      <Head>
        <title>API Documentation - AI Coding Assistant Platform</title>
        <meta
          name="description"
          content="Interactive API documentation for the AI Coding Assistant Experience Platform"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  API Documentation
                </h1>
                <p className="text-gray-600 mt-2">
                  Interactive REST API documentation for the AI Coding Assistant
                  Experience Platform
                </p>
              </div>
              <div className="flex space-x-4">
                <a
                  href="/"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Back to Platform
                </a>
                <a
                  href="/docs/openapi.yaml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Download OpenAPI Spec
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* API Info Cards */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Authentication Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m0 0a2 2 0 102 2M9 7a2 2 0 00-2 2m0 0a2 2 0 00-2 2m0 0a2 2 0 002 2m0 0a2 2 0 002-2M9 7a2 2 0 012-2m0 0a2 2 0 012 2m-2 2a2 2 0 002 2m0 0a2 2 0 01-2 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  Authentication
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                All API endpoints require authentication via NextAuth.js session
                cookies.
                <a
                  href="/api/auth/signin"
                  className="text-blue-600 hover:text-blue-700 ml-1"
                >
                  Sign in with GitHub →
                </a>
              </p>
            </div>

            {/* Rate Limiting Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  Rate Limits
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                100 requests/minute for authenticated users, 10 requests/minute
                for unauthenticated requests.
              </p>
            </div>

            {/* Base URL Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  Base URL
                </h3>
              </div>
              <p className="text-gray-600 text-sm font-mono bg-gray-50 px-2 py-1 rounded">
                {typeof window !== 'undefined'
                  ? `${window.location.origin}/api`
                  : '/api'}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {!swaggerInitialized && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="bg-white rounded-lg p-8 shadow-sm border text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading API documentation...</p>
            </div>
          </div>
        )}

        {/* Swagger UI Container */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div id="swagger-ui"></div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center text-gray-600">
              <p className="mb-4">
                💡 <strong>Pro Tip:</strong> Use the "Try it out" button on each
                endpoint to test the API directly from this documentation.
              </p>
              <div className="flex justify-center space-x-6 text-sm">
                <a href="#" className="hover:text-blue-600">
                  GitHub Repository
                </a>
                <a href="#" className="hover:text-blue-600">
                  Report Issues
                </a>
                <a href="#" className="hover:text-blue-600">
                  Contribute
                </a>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                AI Coding Assistant Experience Platform API v1.0.0
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
