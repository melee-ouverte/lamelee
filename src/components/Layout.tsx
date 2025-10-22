/**
 * T048: Layout Component
 *
 * Main layout wrapper that provides consistent structure,
 * navigation, and session management across all pages.
 */

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main nav */}
            <div className="flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <span className="text-xl font-bold text-gray-900">
                    AI Code Experiences
                  </span>
                </div>
              </Link>

              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link href="/feed">
                  <span className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium cursor-pointer">
                    Browse
                  </span>
                </Link>
                <Link href="/create">
                  <span className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium cursor-pointer">
                    Share
                  </span>
                </Link>
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center">
              {status === 'loading' ? (
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
              ) : session?.user ? (
                <div className="flex items-center space-x-4">
                  <Link href={`/profile/${session.user.id}`}>
                    <div className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2">
                      <Image
                        className="h-8 w-8 rounded-full"
                        src={session.user.avatarUrl || '/default-avatar.png'}
                        alt={session.user.username || 'User'}
                        width={32}
                        height={32}
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {session.user.username}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('github')}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sign in with GitHub
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="/feed">
            <span className="text-gray-900 hover:text-blue-600 block px-3 py-2 text-base font-medium cursor-pointer">
              Browse Experiences
            </span>
          </Link>
          <Link href="/create">
            <span className="text-gray-900 hover:text-blue-600 block px-3 py-2 text-base font-medium cursor-pointer">
              Share Experience
            </span>
          </Link>
        </div>
      </div>

      {/* Page title */}
      {title && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              AI Coding Assistant Experience Platform - Share and discover
              AI-powered coding experiences
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <a
                href="https://github.com"
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
