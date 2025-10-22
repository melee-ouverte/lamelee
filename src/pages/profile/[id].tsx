import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import UserProfile from '../../components/UserProfile';
import ExperienceCard from '../../components/ExperienceCard';
import { prisma } from '../../lib/db';
import { Code, Calendar } from 'lucide-react';

interface UserProfilePageProps {
  user: {
    id: string;
    username: string;
    email?: string;
    avatarUrl?: string;
    bio?: string;
    githubId: string;
    createdAt: string;
  };
  stats: {
    experienceCount: number;
    promptCount: number;
    totalReactions: number;
    averageRating?: number;
  };
  experiences: Array<{
    id: string;
    title: string;
    description: string;
    aiAssistantType: string;
    tags: string[];
    githubUrls: string[];
    isNews: boolean;
    createdAt: string;
    user: {
      id: string;
      username: string;
      avatarUrl?: string;
    };
    _count: {
      prompts: number;
      comments: number;
      reactions: number;
    };
  }>;
}

export default function UserProfilePage({
  user,
  stats,
  experiences,
}: UserProfilePageProps) {
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
        <title>{user.username} - AI Coding Assistant Experience Platform</title>
        <meta
          name="description"
          content={
            user.bio ||
            `${user.username}'s profile on AI Coding Assistant Experience Platform`
          }
        />
      </Head>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <UserProfile user={user} stats={stats} showStats={true} />

            {/* Quick Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Activity</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Experiences shared
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.experienceCount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">💡</span>
                    <span className="text-sm text-gray-600">
                      Prompts created
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.promptCount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">👍</span>
                    <span className="text-sm text-gray-600">
                      Reactions received
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.totalReactions}
                  </span>
                </div>

                {stats.averageRating && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">⭐</span>
                      <span className="text-sm text-gray-600">
                        Average rating
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {stats.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Member since</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experiences Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Experiences ({experiences.length})
                </h2>
                {experiences.length > 6 && (
                  <Link
                    href={`/search?user=${user.username}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View all →
                  </Link>
                )}
              </div>

              {experiences.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <Code className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No experiences yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {user.username} hasn't shared any coding experiences yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {experiences.slice(0, 6).map((experience) => (
                    <ExperienceCard
                      key={experience.id}
                      experience={{
                        id: parseInt(experience.id),
                        title: experience.title,
                        description: experience.description,
                        githubUrl: experience.githubUrls[0] || '',
                        aiAssistant: experience.aiAssistantType,
                        tags: experience.tags,
                        createdAt: experience.createdAt,
                        author: {
                          id: parseInt(experience.user.id),
                          username: experience.user.username,
                          avatarUrl: experience.user.avatarUrl || '',
                        },
                        stats: {
                          promptCount: experience._count.prompts,
                          commentCount: experience._count.comments,
                          reactionCount: experience._count.reactions,
                          averageRating: 0, // Would need to calculate this separately
                        },
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Timeline */}
            {experiences.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Activity
                </h3>

                <div className="space-y-4">
                  {experiences.slice(0, 3).map((experience) => (
                    <div
                      key={experience.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          Shared experience:{' '}
                          <Link
                            href={`/experiences/${experience.id}`}
                            className="font-medium text-blue-600 hover:text-blue-500"
                          >
                            {experience.title}
                          </Link>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(experience.createdAt)} •{' '}
                          {experience._count.prompts} prompt
                          {experience._count.prompts !== 1 ? 's' : ''} •{' '}
                          {experience._count.reactions} reaction
                          {experience._count.reactions !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {experiences.length > 3 && (
                  <div className="pt-4 border-t border-gray-200">
                    <Link
                      href={`/search?user=${user.username}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View all activity →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
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
    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        githubId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { notFound: true };
    }

    // Fetch user's experiences
    const experiences = await prisma.experience.findMany({
      where: {
        userId: parseInt(id),
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            prompts: true,
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const promptCount = await prisma.prompt.count({
      where: {
        experience: {
          userId: parseInt(id),
          deletedAt: null,
        },
      },
    });

    const totalReactions = await prisma.reaction.count({
      where: {
        experience: {
          userId: parseInt(id),
          deletedAt: null,
        },
      },
    });

    const ratings = await prisma.promptRating.findMany({
      where: {
        prompt: {
          experience: {
            userId: parseInt(id),
            deletedAt: null,
          },
        },
      },
    });

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
          ratings.length
        : undefined;

    const stats = {
      experienceCount: experiences.length,
      promptCount,
      totalReactions,
      averageRating,
    };

    // Convert to serializable format
    const serializedUser = {
      ...user,
      id: user.id.toString(),
      githubId: user.githubId.toString(),
      createdAt: user.createdAt.toISOString(),
    };

    const serializedExperiences = experiences.map((experience: any) => ({
      ...experience,
      id: experience.id.toString(),
      createdAt: experience.createdAt.toISOString(),
      user: {
        ...experience.user,
        id: experience.user.id.toString(),
      },
    }));

    return {
      props: {
        user: serializedUser,
        stats,
        experiences: serializedExperiences,
      },
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { notFound: true };
  }
};
