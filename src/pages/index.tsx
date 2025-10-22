/**
 * T053: Home Page
 *
 * Landing page that showcases the platform and provides
 * quick access to browse and share experiences.
 */

import React from 'react';
import { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import ExperienceCard from '@/components/ExperienceCard';
import { prisma } from '@/lib/db';

interface HomeProps {
  featuredExperiences: any[];
  stats: {
    totalExperiences: number;
    totalUsers: number;
    totalPrompts: number;
  };
}

export default function Home({ featuredExperiences, stats }: HomeProps) {
  return (
    <Layout>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6">
          AI Coding Assistant
          <br />
          <span className="text-blue-600">Experience Platform</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Discover, share, and learn from real-world experiences with AI coding
          assistants like GitHub Copilot, Claude, GPT, and more. Connect with
          fellow developers and accelerate your AI-powered development journey.
        </p>
        <div className="flex gap-4 justify-center flex-col sm:flex-row">
          <a
            href="/feed"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Browse Experiences
          </a>
          <a
            href="/create"
            className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Share Your Experience
          </a>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalExperiences}
            </div>
            <div className="text-gray-600 mt-1">Shared Experiences</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">
              {stats.totalUsers}
            </div>
            <div className="text-gray-600 mt-1">Active Developers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {stats.totalPrompts}
            </div>
            <div className="text-gray-600 mt-1">Prompts Shared</div>
          </div>
        </div>
      </div>

      {/* Featured Experiences */}
      {featuredExperiences.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Featured Experiences
            </h2>
            <a
              href="/feed"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredExperiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-gray-50 rounded-lg p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Share Your Experience
            </h3>
            <p className="text-gray-600">
              Document your AI coding assistant experiences, including prompts,
              context, and outcomes.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Discover & Learn
            </h3>
            <p className="text-gray-600">
              Browse experiences from other developers and learn effective AI
              prompting techniques.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V10a2 2 0 012-2h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connect & Discuss
            </h3>
            <p className="text-gray-600">
              Engage with the community through comments, reactions, and ratings
              on shared experiences.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Get featured experiences (recent with good ratings)
    const featuredExperiences = await prisma.experience.findMany({
      where: {
        deletedAt: null,
        averageRating: { gte: 4.0 },
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
            prompts: { where: { deletedAt: null } },
            comments: { where: { deletedAt: null } },
            reactions: true,
          },
        },
      },
      orderBy: [{ averageRating: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    });

    // Get platform statistics
    const [totalExperiences, totalUsers, totalPrompts] = await Promise.all([
      prisma.experience.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.prompt.count({ where: { deletedAt: null } }),
    ]);

    // Format experiences
    const formattedExperiences = featuredExperiences.map((exp: any) => ({
      id: exp.id,
      title: exp.title,
      description: exp.description,
      githubUrl: exp.githubUrl,
      aiAssistant: exp.aiAssistant,
      tags: exp.tags ? exp.tags.split(',').filter(Boolean) : [],
      createdAt: exp.createdAt.toISOString(),
      author: {
        id: exp.user.id,
        username: exp.user.username,
        avatarUrl: exp.user.avatarUrl,
      },
      stats: {
        promptCount: exp._count.prompts,
        commentCount: exp._count.comments,
        reactionCount: exp._count.reactions,
        averageRating: exp.averageRating,
      },
    }));

    return {
      props: {
        featuredExperiences: formattedExperiences,
        stats: {
          totalExperiences,
          totalUsers,
          totalPrompts,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching home page data:', error);
    return {
      props: {
        featuredExperiences: [],
        stats: {
          totalExperiences: 0,
          totalUsers: 0,
          totalPrompts: 0,
        },
      },
    };
  }
};
