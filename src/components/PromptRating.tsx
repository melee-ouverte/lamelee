import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Star } from 'lucide-react';

interface Rating {
  id: string;
  rating: number;
  userId: string;
}

interface PromptRatingProps {
  _promptId: string;
  ratings: Rating[];
  onRate?: (rating: number) => Promise<void>;
  _isLoading?: boolean;
  showAverage?: boolean;
}

export default function PromptRating({
  _promptId,
  ratings,
  onRate,
  _isLoading = false,
  showAverage = true,
}: PromptRatingProps) {
  const { data: session } = useSession();
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate average rating
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  // Get current user's rating
  const userRating = session?.user
    ? ratings.find((r) => r.userId === session.user.id)?.rating
    : null;

  const handleRating = async (rating: number) => {
    if (!session || !onRate || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onRate(rating);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarIcon = ({
    filled,
    interactive = false,
    onClick,
    onMouseEnter,
  }: {
    filled: boolean;
    interactive?: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
  }) => (
    <Star
      className={`h-5 w-5 transition-colors duration-150 ${
        filled
          ? 'text-yellow-400 fill-current'
          : interactive
            ? 'text-gray-300 hover:text-yellow-300 cursor-pointer'
            : 'text-gray-300'
      } ${interactive ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    />
  );

  if (!session) {
    return (
      <div className="space-y-3">
        {showAverage && ratings.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  filled={star <= Math.round(averageRating)}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {averageRating.toFixed(1)} ({ratings.length} rating
              {ratings.length !== 1 ? 's' : ''})
            </span>
          </div>
        )}
        <div className="text-sm text-gray-500">
          <a
            href="/api/auth/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </a>{' '}
          to rate this prompt
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Average Rating Display */}
      {showAverage && ratings.length > 0 && (
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} filled={star <= Math.round(averageRating)} />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {averageRating.toFixed(1)} ({ratings.length} rating
            {ratings.length !== 1 ? 's' : ''})
          </span>
        </div>
      )}

      {/* User Rating Interface */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">
          {userRating ? 'Your rating:' : 'Rate this prompt:'}
        </div>

        <div
          className="flex space-x-1"
          onMouseLeave={() => setHoveredRating(null)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const filled =
              hoveredRating !== null
                ? star <= hoveredRating
                : userRating !== null && userRating !== undefined
                  ? star <= userRating
                  : false;

            return (
              <StarIcon
                key={star}
                filled={filled}
                interactive={!isSubmitting}
                onClick={() => !isSubmitting && handleRating(star)}
                onMouseEnter={() => !isSubmitting && setHoveredRating(star)}
              />
            );
          })}
        </div>

        {/* Rating Labels */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>Poor</span>
          <span>Excellent</span>
        </div>

        {/* Current Status */}
        {isSubmitting ? (
          <div className="text-sm text-gray-500">Submitting rating...</div>
        ) : userRating ? (
          <div className="text-sm text-gray-600">
            You rated this {userRating} star{userRating !== 1 ? 's' : ''}
            <button
              onClick={() => setHoveredRating(null)}
              className="ml-2 text-blue-600 hover:text-blue-500 font-medium"
            >
              Change rating
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            {hoveredRating
              ? `Rate ${hoveredRating} star${hoveredRating !== 1 ? 's' : ''}`
              : 'Hover to rate'}
          </div>
        )}
      </div>

      {/* Rating Distribution (for prompts with many ratings) */}
      {ratings.length >= 5 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Rating distribution:
          </div>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratings.filter((r) => r.rating === stars).length;
              const percentage = (count / ratings.length) * 100;

              return (
                <div
                  key={stars}
                  className="flex items-center space-x-2 text-xs"
                >
                  <span className="w-4 text-gray-600">{stars}</span>
                  <StarIcon filled={true} />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
