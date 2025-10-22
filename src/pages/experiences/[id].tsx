import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import PromptDisplay from '../../components/PromptDisplay';
import CommentList from '../../components/CommentList';
import ReactionButtons from '../../components/ReactionButtons';
import PromptRating from '../../components/PromptRating';
import UserProfile from '../../components/UserProfile';
import { prisma } from '../../lib/db';
import { ExternalLink, Calendar, Tag, Github } from 'lucide-react';

interface ExperienceDetailProps {
  experience: {
    id: string;
    title: string;
    description: string;
    aiAssistantType: string;
    tags: string[];
    githubUrls: string[];
    isNews: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      username: string;
      avatarUrl?: string;
      bio?: string;
      githubId: string;
      createdAt: string;
    };
    prompts: Array<{
      id: string;
      content: string;
      context?: string;
      resultsAchieved?: string;
      createdAt: string;
      ratings: Array<{
        id: string;
        rating: number;
        userId: string;
      }>;
    }>;
    comments: Array<{
      id: string;
      content: string;
      createdAt: string;
      user: {
        id: string;
        username: string;
        avatarUrl?: string;
      };
    }>;
    reactions: Array<{
      id: string;
      type: 'like' | 'helpful' | 'bookmark' | 'insightful' | 'inspiring';
      userId: string;
    }>;
  };
}

export default function ExperienceDetail({
  experience,
}: ExperienceDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddComment = async (content: string) => {
    const response = await fetch(`/api/experiences/${experience.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    // Refresh the page to show the new comment
    router.reload();
  };

  const handleReact = async (reactionType: string) => {
    const response = await fetch(
      `/api/experiences/${experience.id}/reactions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reactionType }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to react');
    }

    // Refresh the page to show the new reaction
    router.reload();
  };

  const handleRatePrompt = async (promptId: string, rating: number) => {
    const response = await fetch(`/api/prompts/${promptId}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });

    if (!response.ok) {
      throw new Error('Failed to rate prompt');
    }

    // Refresh the page to show the new rating
    router.reload();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <Head>
        <title>
          {experience.title} - AI Coding Assistant Experience Platform
        </title>
        <meta name="description" content={experience.description} />
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Experience Header */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {experience.title}
              </h1>

              {experience.isNews && (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">
                  News
                </div>
              )}

              <p className="text-gray-700 leading-relaxed mb-4">
                {experience.description}
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(experience.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-medium">AI Assistant:</span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">
                    {experience.aiAssistantType}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {experience.tags.length > 0 && (
                <div className="flex items-center space-x-2 mb-4">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <div className="flex flex-wrap gap-2">
                    {experience.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* GitHub URLs */}
              {experience.githubUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <Github className="h-4 w-4" />
                    <span>Related GitHub repositories:</span>
                  </div>
                  <div className="space-y-1">
                    {experience.githubUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>{url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Author Profile */}
            <div className="ml-6 flex-shrink-0 w-64">
              <UserProfile user={experience.user} showStats={false} />
            </div>
          </div>

          {/* Reactions */}
          <div className="border-t border-gray-200 pt-6">
            <ReactionButtons
              experienceId={experience.id}
              reactions={experience.reactions}
              onReact={handleReact}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Prompts */}
        {experience.prompts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Prompts ({experience.prompts.length})
            </h2>
            {experience.prompts.map((prompt) => (
              <div key={prompt.id} className="space-y-4">
                <PromptDisplay prompt={prompt} />
                <div className="ml-6">
                  <PromptRating
                    promptId={prompt.id}
                    ratings={prompt.ratings}
                    onRate={(rating) => handleRatePrompt(prompt.id, rating)}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comments */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <CommentList
            experienceId={experience.id}
            comments={experience.comments}
            onAddComment={handleAddComment}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;

  if (typeof id !== 'string') {
    return { notFound: true };
  }

  try {
    const experience = await prisma.experience.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            githubId: true,
            createdAt: true,
          },
        },
        prompts: {
          include: {
            ratings: {
              select: {
                id: true,
                rating: true,
                userId: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        reactions: {
          select: {
            id: true,
            reactionType: true,
            userId: true,
          },
        },
      },
    });

    if (!experience) {
      return { notFound: true };
    }

    // Convert to serializable format
    const serializedExperience = {
      ...experience,
      id: experience.id.toString(),
      createdAt: experience.createdAt.toISOString(),
      updatedAt: experience.updatedAt.toISOString(),
      githubUrls: experience.githubUrl ? [experience.githubUrl] : [], // Convert single URL to array
      tags: experience.tags ? experience.tags.split(',').filter(Boolean) : [], // Convert string to array
      user: {
        ...(experience as any).user,
        id: (experience as any).user.id.toString(),
        githubId: (experience as any).user.githubId.toString(),
        createdAt: (experience as any).user.createdAt.toISOString(),
      },
      prompts: (experience as any).prompts.map((prompt: any) => ({
        ...prompt,
        id: prompt.id.toString(),
        createdAt: prompt.createdAt.toISOString(),
        updatedAt: prompt.updatedAt.toISOString(),
        ratings: prompt.ratings.map((rating: any) => ({
          ...rating,
          id: rating.id.toString(),
        })),
      })),
      comments: (experience as any).comments.map((comment: any) => ({
        ...comment,
        id: comment.id.toString(),
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: {
          ...comment.user,
          id: comment.user.id.toString(),
        },
      })),
      reactions: (experience as any).reactions.map((reaction: any) => ({
        ...reaction,
        id: reaction.id.toString(),
      })),
    };

    return {
      props: {
        experience: serializedExperience,
      },
    };
  } catch (error) {
    console.error('Error fetching experience:', error);
    return { notFound: true };
  }
};
