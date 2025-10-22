import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, ThumbsUp, Bookmark, HelpCircle, Zap } from 'lucide-react';

interface Reaction {
  id: string;
  type: 'like' | 'helpful' | 'bookmark' | 'insightful' | 'inspiring';
  userId: string;
}

interface ReactionButtonsProps {
  _experienceId: string;
  reactions: Reaction[];
  onReact?: (reactionType: Reaction['type']) => Promise<void>;
  isLoading?: boolean;
}

const reactionConfig = {
  like: {
    icon: ThumbsUp,
    label: 'Like',
    activeColor: 'text-blue-600',
    hoverColor: 'hover:text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  helpful: {
    icon: HelpCircle,
    label: 'Helpful',
    activeColor: 'text-green-600',
    hoverColor: 'hover:text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  bookmark: {
    icon: Bookmark,
    label: 'Bookmark',
    activeColor: 'text-purple-600',
    hoverColor: 'hover:text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  insightful: {
    icon: Zap,
    label: 'Insightful',
    activeColor: 'text-yellow-600',
    hoverColor: 'hover:text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  inspiring: {
    icon: Heart,
    label: 'Inspiring',
    activeColor: 'text-red-600',
    hoverColor: 'hover:text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
} as const;

export default function ReactionButtons({
  _experienceId,
  reactions,
  onReact,
  isLoading = false,
}: ReactionButtonsProps) {
  const { data: session } = useSession();
  const [pendingReaction, setPendingReaction] = useState<string | null>(null);

  // Group reactions by type and count them
  const reactionCounts = reactions.reduce(
    (acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Check which reactions the current user has made
  const userReactions = new Set(
    session?.user
      ? reactions.filter((r) => r.userId === session.user.id).map((r) => r.type)
      : []
  );

  const handleReaction = async (reactionType: Reaction['type']) => {
    if (!session || !onReact || pendingReaction) return;

    setPendingReaction(reactionType);
    try {
      await onReact(reactionType);
    } catch (error) {
      console.error('Failed to react:', error);
    } finally {
      setPendingReaction(null);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>
          <a
            href="/api/auth/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </a>{' '}
          to react to this experience
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">
          Your reaction:
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(reactionConfig).map(([type, config]) => {
          const Icon = config.icon;
          const count = reactionCounts[type] || 0;
          const isActive = userReactions.has(type as Reaction['type']);
          const isPending = pendingReaction === type;

          return (
            <button
              key={type}
              onClick={() => handleReaction(type as Reaction['type'])}
              disabled={isLoading || isPending}
              className={`
                inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                ${
                  isActive
                    ? `${config.activeColor} ${config.bgColor} ${config.borderColor}`
                    : `text-gray-600 bg-white border-gray-300 ${config.hoverColor} hover:bg-gray-50`
                }
                ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              `}
            >
              <Icon className={`h-4 w-4 ${isPending ? 'animate-pulse' : ''}`} />
              <span>{config.label}</span>
              {count > 0 && (
                <span
                  className={`
                  inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full
                  ${
                    isActive
                      ? 'bg-white bg-opacity-80 text-gray-800'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {reactions.length > 0 && (
        <div className="text-xs text-gray-500">
          {reactions.length} reaction{reactions.length !== 1 ? 's' : ''} total
        </div>
      )}
    </div>
  );
}
