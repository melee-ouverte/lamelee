/**
 * T035: /api/prompts/[id]/ratings - Prompt Ratings
 *
 * Handles POST requests to rate individual prompts (1-5 scale).
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { promptRatingSchema, validationUtils } from '@/lib/validations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;
    const promptId = parseInt(id as string);

    if (isNaN(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID' });
    }

    switch (req.method) {
      case 'POST':
        await handleCreateOrUpdateRating(req, res, promptId);
        break;
      default:
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error in /api/prompts/[id]/ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/prompts/[id]/ratings - Create or update prompt rating
 */
async function handleCreateOrUpdateRating(
  req: NextApiRequest,
  res: NextApiResponse,
  promptId: number
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate request body
  const validation = validationUtils.safeValidate(promptRatingSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid rating data',
      details: validation.errors,
    });
  }

  const { rating } = validation.data;
  const userId = parseInt(session.user.id);

  try {
    // Check if prompt exists
    const prompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        deletedAt: null,
      },
      include: {
        experience: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Check if user already rated this prompt
    const existingRating = await prisma.promptRating.findUnique({
      where: {
        userId_promptId: {
          userId,
          promptId,
        },
      },
    });

    let promptRating;
    let isUpdate = false;
    let _oldRating = 0;

    if (existingRating) {
      // Update existing rating
      _oldRating = existingRating.rating;
      promptRating = await prisma.promptRating.update({
        where: {
          userId_promptId: {
            userId,
            promptId,
          },
        },
        data: {
          rating,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });
      isUpdate = true;
    } else {
      // Create new rating
      promptRating = await prisma.promptRating.create({
        data: {
          rating,
          userId,
          promptId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });
    }

    // Recalculate prompt's average rating
    const allRatings = await prisma.promptRating.findMany({
      where: { promptId },
      select: { rating: true },
    });

    const totalRatings = allRatings.length;
    const sumRatings = allRatings.reduce(
      (sum: number, r: any) => sum + r.rating,
      0
    );
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    // Update prompt with new average rating
    await prisma.prompt.update({
      where: { id: promptId },
      data: {
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingCount: totalRatings,
      },
    });

    // Update experience's overall rating if needed
    const experiencePrompts = await prisma.prompt.findMany({
      where: {
        experienceId: prompt.experience.id,
        deletedAt: null,
      },
      select: {
        averageRating: true,
        ratingCount: true,
      },
    });

    // Calculate experience average rating (weighted by number of ratings per prompt)
    let totalWeightedRating = 0;
    let totalRatingCount = 0;

    experiencePrompts.forEach((p: any) => {
      if (p.ratingCount > 0) {
        totalWeightedRating += p.averageRating * p.ratingCount;
        totalRatingCount += p.ratingCount;
      }
    });

    const experienceAverageRating =
      totalRatingCount > 0 ? totalWeightedRating / totalRatingCount : 0;

    await prisma.experience.update({
      where: { id: prompt.experience.id },
      data: {
        averageRating: parseFloat(experienceAverageRating.toFixed(2)),
      },
    });

    // Format response
    const formattedRating = {
      id: promptRating.id,
      rating: promptRating.rating,
      createdAt: promptRating.createdAt.toISOString(),
      updatedAt: promptRating.updatedAt.toISOString(),
      user: {
        id: promptRating.user.id,
        username: promptRating.user.username,
        avatarUrl: promptRating.user.avatarUrl,
      },
    };

    res.status(isUpdate ? 200 : 201).json({
      message: isUpdate
        ? 'Rating updated successfully'
        : 'Rating added successfully',
      rating: formattedRating,
      promptStats: {
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingCount: totalRatings,
      },
      experienceStats: {
        averageRating: parseFloat(experienceAverageRating.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Error creating/updating rating:', error);
    res.status(500).json({ error: 'Failed to process rating' });
  }
}
