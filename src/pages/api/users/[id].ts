/**
 * T037: /api/users/[id] - User Profile by ID
 *
 * Handles GET requests to view public user profiles and statistics.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;
    const userId = parseInt(id as string);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    switch (req.method) {
      case 'GET':
        await handleGetUser(req, res, userId);
        break;
      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error in /api/users/[id]:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/users/[id] - Get user profile with public statistics
 */
async function handleGetUser(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: number
) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        experiences: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            description: true,
            githubUrl: true,
            aiAssistant: true,
            tags: true,
            createdAt: true,
            averageRating: true,
            reactionCount: true,
            commentCount: true,
            promptCount: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            experiences: {
              where: { deletedAt: null },
            },
            comments: {
              where: { deletedAt: null },
            },
            reactions: true,
            promptRatings: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate additional statistics
    const totalReactions = await prisma.reaction.count({
      where: {
        experience: {
          userId: userId,
          deletedAt: null,
        },
      },
    });

    const totalComments = await prisma.comment.count({
      where: {
        experience: {
          userId: userId,
          deletedAt: null,
        },
      },
    });

    const totalPrompts = await prisma.prompt.count({
      where: {
        experience: {
          userId: userId,
          deletedAt: null,
        },
        deletedAt: null,
      },
    });

    // Calculate average rating received on user's content
    const userExperiences = user.experiences;
    const totalExperienceRating = userExperiences.reduce(
      (sum: number, exp: any) => sum + exp.averageRating,
      0
    );
    const averageRatingReceived =
      userExperiences.length > 0
        ? totalExperienceRating / userExperiences.length
        : 0;

    // Get AI assistant distribution
    const aiAssistantCounts = userExperiences.reduce((acc: any, exp: any) => {
      acc[exp.aiAssistant] = (acc[exp.aiAssistant] || 0) + 1;
      return acc;
    }, {});

    // Get most used tags
    const allTags = userExperiences
      .map((exp: any) => (exp.tags ? exp.tags.split(',').filter(Boolean) : []))
      .flat();

    const tagCounts = allTags.reduce((acc: any, tag: any) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    const topTags = Object.entries(tagCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Format response (public data only)
    const formattedUser = {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      githubUsername: user.githubUsername,
      createdAt: user.createdAt.toISOString(),
      stats: {
        experienceCount: user._count.experiences,
        promptCount: totalPrompts,
        totalReactionsReceived: totalReactions,
        totalCommentsReceived: totalComments,
        commentsGiven: user._count.comments,
        reactionsGiven: user._count.reactions,
        ratingsGiven: user._count.promptRatings,
        averageRatingReceived: parseFloat(averageRatingReceived.toFixed(2)),
        aiAssistantDistribution: aiAssistantCounts,
        topTags,
      },
      experiences: user.experiences.map((exp: any) => ({
        id: exp.id,
        title: exp.title,
        description:
          exp.description.length > 200
            ? exp.description.substring(0, 200) + '...'
            : exp.description,
        githubUrl: exp.githubUrl,
        aiAssistant: exp.aiAssistant,
        tags: exp.tags ? exp.tags.split(',').filter(Boolean) : [],
        createdAt: exp.createdAt.toISOString(),
        stats: {
          promptCount: exp.promptCount,
          reactionCount: exp.reactionCount,
          commentCount: exp.commentCount,
          averageRating: exp.averageRating,
        },
      })),
    };

    res.status(200).json({ user: formattedUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}
