/**
 * T036: /api/users/me - Current User Profile
 *
 * Handles GET and PUT requests for the current authenticated user's profile.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { userProfileSchema, validationUtils } from '@/lib/validations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGetCurrentUser(req, res);
        break;
      case 'PUT':
        await handleUpdateCurrentUser(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error in /api/users/me:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/users/me - Get current user profile
 */
async function handleGetCurrentUser(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(session.user.id),
        deletedAt: null,
      },
      include: {
        experiences: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            createdAt: true,
            averageRating: true,
            reactionCount: true,
            commentCount: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Recent experiences
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
    const promptRatingsGiven = await prisma.promptRating.findMany({
      where: { userId: user.id },
      select: { rating: true },
    });

    const averageRatingGiven =
      promptRatingsGiven.length > 0
        ? promptRatingsGiven.reduce(
            (sum: number, r: any) => sum + r.rating,
            0
          ) / promptRatingsGiven.length
        : 0;

    // Format response
    const formattedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      githubUsername: user.githubUsername,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      stats: {
        experienceCount: user._count.experiences,
        commentCount: user._count.comments,
        reactionCount: user._count.reactions,
        ratingsGiven: user._count.promptRatings,
        averageRatingReceived: user.totalRating / Math.max(user.ratingCount, 1),
        averageRatingGiven: parseFloat(averageRatingGiven.toFixed(2)),
      },
      recentExperiences: user.experiences.map((exp: any) => ({
        id: exp.id,
        title: exp.title,
        createdAt: exp.createdAt.toISOString(),
        averageRating: exp.averageRating,
        reactionCount: exp.reactionCount,
        commentCount: exp.commentCount,
      })),
    };

    res.status(200).json({ user: formattedUser });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

/**
 * PUT /api/users/me - Update current user profile
 */
async function handleUpdateCurrentUser(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate request body (partial update allowed)
  const validation = validationUtils.safeValidate(
    userProfileSchema.partial(), // Allow partial updates
    req.body
  );

  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid user data',
      details: validation.errors,
    });
  }

  try {
    // Check if username is taken (if being updated)
    if (validation.data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validation.data.username,
          id: { not: parseInt(session.user.id) },
          deletedAt: null,
        },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        ...validation.data,
        updatedAt: new Date(),
      },
    });

    // Format response
    const formattedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      githubUsername: user.githubUsername,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    res.status(200).json({
      message: 'Profile updated successfully',
      user: formattedUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
