/**
 * T034: /api/experiences/[id]/reactions - Experience Reactions
 * 
 * Handles POST requests to add/update reactions on experiences.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { reactionSchema, validationUtils } from '@/lib/validations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const experienceId = parseInt(id as string);

    if (isNaN(experienceId)) {
      return res.status(400).json({ error: 'Invalid experience ID' });
    }

    switch (req.method) {
      case 'POST':
        await handleCreateOrUpdateReaction(req, res, experienceId);
        break;
      default:
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error in /api/experiences/[id]/reactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/experiences/[id]/reactions - Create or update reaction
 */
async function handleCreateOrUpdateReaction(req: NextApiRequest, res: NextApiResponse, experienceId: number) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate request body
  const validation = validationUtils.safeValidate(reactionSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid reaction data',
      details: validation.errors,
    });
  }

  const { reactionType } = validation.data;
  const userId = parseInt(session.user.id);

  try {
    // Check if experience exists
    const experience = await prisma.experience.findFirst({
      where: {
        id: experienceId,
        deletedAt: null,
      },
    });

    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    // Check if user already has a reaction on this experience
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userId_experienceId: {
          userId,
          experienceId,
        },
      },
    });

    let reaction;
    let isUpdate = false;

    if (existingReaction) {
      // Update existing reaction
      reaction = await prisma.reaction.update({
        where: {
          userId_experienceId: {
            userId,
            experienceId,
          },
        },
        data: {
          reactionType,
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
      // Create new reaction
      reaction = await prisma.reaction.create({
        data: {
          reactionType,
          userId,
          experienceId,
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

      // Update experience reaction count
      await prisma.experience.update({
        where: { id: experienceId },
        data: {
          reactionCount: { increment: 1 },
        },
      });
    }

    // Get updated reaction counts for this experience
    const reactionCounts = await prisma.reaction.groupBy({
      by: ['reactionType'],
      where: { experienceId },
      _count: { reactionType: true },
    });

    const formattedReactionCounts = reactionCounts.reduce((acc: any, item: any) => {
      acc[item.reactionType] = item._count.reactionType;
      return acc;
    }, {});

    // Format response
    const formattedReaction = {
      id: reaction.id,
      reactionType: reaction.reactionType,
      createdAt: reaction.createdAt.toISOString(),
      user: {
        id: reaction.user.id,
        username: reaction.user.username,
        avatarUrl: reaction.user.avatarUrl,
      },
    };

    res.status(isUpdate ? 200 : 201).json({
      message: isUpdate ? 'Reaction updated successfully' : 'Reaction added successfully',
      reaction: formattedReaction,
      reactionCounts: formattedReactionCounts,
    });

  } catch (error) {
    console.error('Error creating/updating reaction:', error);
    res.status(500).json({ error: 'Failed to process reaction' });
  }
}