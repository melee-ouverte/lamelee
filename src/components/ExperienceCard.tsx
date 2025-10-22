/**
 * T047: ExperienceCard Component
 * 
 * Reusable card component for displaying experience summaries
 * in lists and grids throughout the application.
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ExperienceCardProps {
  experience: {
    id: number;
    title: string;
    description: string;
    githubUrl: string;
    aiAssistant: string;
    tags: string[];
    createdAt: string;
    author: {
      id: number;
      username: string;
      avatarUrl: string;
    };
    stats: {
      promptCount: number;
      commentCount: number;
      reactionCount: number;
      averageRating: number;
    };
  };
  className?: string;
}

const AI_ASSISTANT_COLORS = {
  'github-copilot': 'bg-blue-100 text-blue-800',
  'claude': 'bg-orange-100 text-orange-800',
  'gpt': 'bg-green-100 text-green-800',
  'cursor': 'bg-purple-100 text-purple-800',
  'other': 'bg-gray-100 text-gray-800',
};

export default function ExperienceCard({ experience, className = '' }: ExperienceCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const aiAssistantColor = AI_ASSISTANT_COLORS[experience.aiAssistant as keyof typeof AI_ASSISTANT_COLORS] || AI_ASSISTANT_COLORS.other;

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link href={`/experiences/${experience.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2">
                {experience.title}
              </h3>
            </Link>
            <p className="text-sm text-gray-600 mt-1 line-clamp-3">
              {experience.description}
            </p>
          </div>
        </div>

        {/* AI Assistant Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${aiAssistantColor}`}>
            {experience.aiAssistant}
          </span>
          {experience.stats.averageRating > 0 && (
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600 ml-1">
                {experience.stats.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {experience.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {experience.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {experience.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                +{experience.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {experience.stats.promptCount}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V10a2 2 0 012-2h8z" />
              </svg>
              {experience.stats.commentCount}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {experience.stats.reactionCount}
            </span>
          </div>
          <span>{formatDate(experience.createdAt)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Image
              className="h-6 w-6 rounded-full"
              src={experience.author.avatarUrl || '/default-avatar.png'}
              alt={experience.author.username}
              width={24}
              height={24}
            />
            <Link href={`/users/${experience.author.id}`}>
              <span className="ml-2 text-sm font-medium text-gray-700 hover:text-blue-600 cursor-pointer">
                {experience.author.username}
              </span>
            </Link>
          </div>
          <a
            href={experience.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              />
            </svg>
            View Code
          </a>
        </div>
      </div>
    </div>
  );
}