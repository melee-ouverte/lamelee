import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ExperienceCard from '../components/ExperienceCard';
import { prisma } from '../lib/db';
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeedProps {
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search?: string;
    aiAssistant?: string;
    tags?: string[];
    user?: string;
  };
  availableTags: string[];
}

const AI_ASSISTANTS = [
  { value: 'github-copilot', label: 'GitHub Copilot' },
  { value: 'claude', label: 'Claude' },
  { value: 'gpt', label: 'GPT' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'other', label: 'Other' },
];

export default function Feed({ experiences, pagination, filters, availableTags }: FeedProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedAiAssistant, setSelectedAiAssistant] = useState(filters.aiAssistant || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [showFilters, setShowFilters] = useState(false);

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const query: any = { ...router.query };
    
    // Update search
    if (newFilters.search !== undefined) {
      if (newFilters.search) {
        query.search = newFilters.search;
      } else {
        delete query.search;
      }
    }

    // Update AI assistant
    if (newFilters.aiAssistant !== undefined) {
      if (newFilters.aiAssistant) {
        query.aiAssistant = newFilters.aiAssistant;
      } else {
        delete query.aiAssistant;
      }
    }

    // Update tags
    if (newFilters.tags !== undefined) {
      if (newFilters.tags.length > 0) {
        query.tags = newFilters.tags;
      } else {
        delete query.tags;
      }
    }

    // Reset to page 1 when filters change
    if (query.page && query.page !== '1') {
      query.page = '1';
    }

    router.push({
      pathname: router.pathname,
      query,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchTerm });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    updateFilters({ tags: newTags });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAiAssistant('');
    setSelectedTags([]);
    updateFilters({ search: '', aiAssistant: '', tags: [] });
  };

  const hasActiveFilters = filters.search || filters.aiAssistant || (filters.tags && filters.tags.length > 0);

  return (
    <Layout>
      <Head>
        <title>Feed - AI Coding Assistant Experience Platform</title>
        <meta name="description" content="Discover and explore AI coding assistant experiences shared by the community" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Experiences</h1>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>

            {/* Search */}
            <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <form onSubmit={handleSearch} className="space-y-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  Search
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search experiences..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* AI Assistant Filter */}
              <div className="space-y-2">
                <label htmlFor="aiAssistant" className="block text-sm font-medium text-gray-700">
                  AI Assistant
                </label>
                <select
                  id="aiAssistant"
                  value={selectedAiAssistant}
                  onChange={(e) => {
                    setSelectedAiAssistant(e.target.value);
                    updateFilters({ aiAssistant: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All assistants</option>
                  {AI_ASSISTANTS.map((assistant) => (
                    <option key={assistant.value} value={assistant.value}>
                      {assistant.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableTags.slice(0, 20).map((tag) => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
                {availableTags.length > 20 && (
                  <p className="text-xs text-gray-500">
                    Showing top 20 tags. Use search to find more specific tags.
                  </p>
                )}
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear all filters
                </button>
              )}

              {/* Create Experience CTA */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Share Your Experience
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Help others by sharing your AI coding assistant experiences.
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Experience
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {filters.search && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: {filters.search}
                  </span>
                )}
                {filters.aiAssistant && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {AI_ASSISTANTS.find(a => a.value === filters.aiAssistant)?.label}
                  </span>
                )}
                {filters.tags?.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {pagination.total} experience{pagination.total !== 1 ? 's' : ''} found
                {hasActiveFilters && ' (filtered)'}
              </div>
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </div>
            </div>

            {/* Experiences List */}
            {experiences.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No experiences found
                </h3>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters 
                    ? 'Try adjusting your filters to see more results.'
                    : 'Be the first to share an AI coding assistant experience!'
                  }
                </p>
                {hasActiveFilters ? (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Clear filters
                  </button>
                ) : (
                  <Link
                    href="/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Experience
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {experiences.map((experience) => (
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <Link
                    href={{
                      pathname: router.pathname,
                      query: { ...router.query, page: Math.max(1, pagination.page - 1) },
                    }}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      pagination.page <= 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </Link>
                  <Link
                    href={{
                      pathname: router.pathname,
                      query: { ...router.query, page: Math.min(pagination.totalPages, pagination.page + 1) },
                    }}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      pagination.page >= pagination.totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </Link>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <Link
                        href={{
                          pathname: router.pathname,
                          query: { ...router.query, page: Math.max(1, pagination.page - 1) },
                        }}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          pagination.page <= 1
                            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'text-gray-500 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Link>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Link
                            key={page}
                            href={{
                              pathname: router.pathname,
                              query: { ...router.query, page },
                            }}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pagination.page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </Link>
                        );
                      })}
                      
                      <Link
                        href={{
                          pathname: router.pathname,
                          query: { ...router.query, page: Math.min(pagination.totalPages, pagination.page + 1) },
                        }}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          pagination.page >= pagination.totalPages
                            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'text-gray-500 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query } = context;
  
  // Parse query parameters
  const page = parseInt(query.page as string) || 1;
  const limit = 12;
  const search = query.search as string || '';
  const aiAssistant = query.aiAssistant as string || '';
  const tags = Array.isArray(query.tags) ? query.tags as string[] : 
                query.tags ? [query.tags as string] : [];
  const user = query.user as string || '';

  try {
    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (aiAssistant) {
      where.aiAssistantType = aiAssistant;
    }

    if (tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (user) {
      where.user = { username: user };
    }

    // Get total count
    const total = await prisma.experience.count({ where });

    // Get experiences
    const experiences = await prisma.experience.findMany({
      where,
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
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get available tags for filter
    const tagAggregation = await prisma.experience.findMany({
      where: { deletedAt: null },
      select: { tags: true },
    });

    const tagCounts: Record<string, number> = {};
    tagAggregation.forEach((exp: any) => {
      exp.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const availableTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag);

    // Serialize data
    const serializedExperiences = experiences.map((exp: any) => ({
      ...exp,
      id: exp.id.toString(),
      createdAt: exp.createdAt.toISOString(),
      user: {
        ...exp.user,
        id: exp.user.id.toString(),
      },
    }));

    return {
      props: {
        experiences: serializedExperiences,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          search: search || undefined,
          aiAssistant: aiAssistant || undefined,
          tags: tags.length > 0 ? tags : undefined,
          user: user || undefined,
        },
        availableTags,
      },
    };
  } catch (error) {
    console.error('Error fetching feed:', error);
    return {
      props: {
        experiences: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
        filters: {},
        availableTags: [],
      },
    };
  }
};