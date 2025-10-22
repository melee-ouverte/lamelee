import React from 'react';
import { Github, Calendar, Star, Code } from 'lucide-react';

interface UserProfileProps {
  user: {
    id: string;
    username: string;
    email?: string;
    avatarUrl?: string;
    bio?: string;
    githubId: string;
    createdAt: string;
  };
  stats?: {
    experienceCount: number;
    promptCount: number;
    totalReactions: number;
    averageRating?: number;
  };
  showStats?: boolean;
}

export default function UserProfile({
  user,
  stats,
  showStats = true,
}: UserProfileProps) {
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Profile Header */}
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.username}'s avatar`}
              className="h-16 w-16 rounded-full border-2 border-gray-200"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-200">
              <span className="text-gray-600 font-medium text-lg">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900 truncate">
              {user.username}
            </h3>
            <a
              href={`https://github.com/${user.githubId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>

          {user.email && (
            <p className="text-sm text-gray-600 mb-2">{user.email}</p>
          )}

          <div className="flex items-center text-sm text-gray-500 mb-3">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Joined {joinDate}</span>
          </div>

          {user.bio && (
            <p className="text-sm text-gray-700 leading-relaxed">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Statistics */}
      {showStats && stats && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">
            Contributions
          </h4>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Experience Count */}
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <Code className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {stats.experienceCount}
              </div>
              <div className="text-xs text-gray-500">
                Experience{stats.experienceCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Prompt Count */}
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <span className="text-green-600 font-bold text-lg">💡</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {stats.promptCount}
              </div>
              <div className="text-xs text-gray-500">
                Prompt{stats.promptCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Total Reactions */}
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <span className="text-purple-600 font-bold text-lg">👍</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {stats.totalReactions}
              </div>
              <div className="text-xs text-gray-500">Reactions</div>
            </div>

            {/* Average Rating */}
            {stats.averageRating && (
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
                  <Star className="h-6 w-6 text-yellow-600 fill-current" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Avg Rating</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
