import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, User } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

interface CommentListProps {
  _experienceId: number;
  comments: Comment[];
  onAddComment?: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CommentList({
  _experienceId,
  comments,
  onAddComment,
  isLoading = false,
}: CommentListProps) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !onAddComment || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <MessageCircle className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-medium text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form */}
      {session && onAddComment && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              {session.user?.avatarUrl ? (
                <img
                  src={session.user.avatarUrl}
                  alt="Your avatar"
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  {newComment.length}/500 characters
                </div>
                <button
                  type="submit"
                  disabled={
                    !newComment.trim() ||
                    isSubmitting ||
                    newComment.length > 500
                  }
                  className="inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Sign In Prompt */}
      {!session && (
        <div className="text-center py-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            <a
              href="/api/auth/signin"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in with GitHub
            </a>{' '}
            to join the discussion
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {comment.user.avatarUrl ? (
                  <img
                    src={comment.user.avatarUrl}
                    alt={`${comment.user.username}'s avatar`}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Comment Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {comment.user.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
