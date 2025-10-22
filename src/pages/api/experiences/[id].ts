/**
 * T032: /api/experiences/[id] - Experience Detail Operations
 *
 * Handles GET (view), PUT (update), and DELETE (delete) requests
 * for individual experiences.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { experienceSchema, validationUtils } from '@/lib/validations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;
    const experienceId = parseInt(id as string);

    if (isNaN(experienceId)) {
      return res.status(400).json({ error: 'Invalid experience ID' });
    }

    switch (req.method) {
      case 'GET':
        await handleGetExperience(req, res, experienceId);
        break;
      case 'PUT':
        await handleUpdateExperience(req, res, experienceId);
        break;
      case 'DELETE':
        await handleDeleteExperience(req, res, experienceId);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error in /api/experiences/[id]:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/experiences/[id] - Get experience details
 */
async function handleGetExperience(
  req: NextApiRequest,
  res: NextApiResponse,
  experienceId: number
) {
  try {
    const experience = await prisma.experience.findFirst({
      where: {
        id: experienceId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
        prompts: {
          where: { deletedAt: null },
          orderBy: { orderIndex: 'asc' },
          include: {
            ratings: true,
          },
        },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    // Calculate reaction counts by type
    const reactionCounts = experience.reactions.reduce(
      (acc: any, reaction: any) => {
        acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
        return acc;
      },
      {}
    );

    // Format prompts with ratings
    const formattedPrompts = experience.prompts.map((prompt: any) => ({
      id: prompt.id,
      content: prompt.content,
      context: prompt.context,
      orderIndex: prompt.orderIndex,
      createdAt: prompt.createdAt.toISOString(),
      averageRating: prompt.averageRating,
      ratingCount: prompt.ratingCount,
    }));

    // Format comments
    const formattedComments = experience.comments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl,
      },
    }));

    // Format response
    const formattedExperience = {
      id: experience.id,
      title: experience.title,
      description: experience.description,
      githubUrl: experience.githubUrl,
      aiAssistant: experience.aiAssistant,
      tags: experience.tags ? experience.tags.split(',').filter(Boolean) : [],
      createdAt: experience.createdAt.toISOString(),
      updatedAt: experience.updatedAt.toISOString(),
      author: {
        id: experience.user.id,
        username: experience.user.username,
        avatarUrl: experience.user.avatarUrl,
        bio: experience.user.bio,
      },
      prompts: formattedPrompts,
      comments: formattedComments,
      reactions: {
        counts: reactionCounts,
        total: experience.reactions.length,
      },
      stats: {
        promptCount: experience.prompts.length,
        commentCount: experience.comments.length,
        reactionCount: experience.reactions.length,
        averageRating: experience.averageRating,
      },
    };

    res.status(200).json({ experience: formattedExperience });
  } catch (error) {
    console.error('Error fetching experience:', error);
    res.status(500).json({ error: 'Failed to fetch experience' });
  }
}

/**
 * PUT /api/experiences/[id] - Update experience
 */
async function handleUpdateExperience(
  req: NextApiRequest,
  res: NextApiResponse,
  experienceId: number
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if experience exists and user owns it
  const existingExperience = await prisma.experience.findFirst({
    where: {
      id: experienceId,
      deletedAt: null,
    },
  });

  if (!existingExperience) {
    return res.status(404).json({ error: 'Experience not found' });
  }

  if (existingExperience.userId !== parseInt(session.user.id)) {
    return res
      .status(403)
      .json({ error: 'Not authorized to update this experience' });
  }

  // Validate request body
  const validation = validationUtils.safeValidate(experienceSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid experience data',
      details: validation.errors,
    });
  }

  const { title, description, githubUrl, aiAssistant, tags } = validation.data;

  try {
    // Update experience
    const experience = await prisma.experience.update({
      where: { id: experienceId },
      data: {
        title,
        description,
        githubUrl,
        aiAssistant,
        tags: tags || '',
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

    // Format response
    const formattedExperience = {
      id: experience.id,
      title: experience.title,
      description: experience.description,
      githubUrl: experience.githubUrl,
      aiAssistant: experience.aiAssistant,
      tags: experience.tags ? experience.tags.split(',').filter(Boolean) : [],
      createdAt: experience.createdAt.toISOString(),
      updatedAt: experience.updatedAt.toISOString(),
      author: {
        id: experience.user.id,
        username: experience.user.username,
        avatarUrl: experience.user.avatarUrl,
      },
    };

    res.status(200).json({
      message: 'Experience updated successfully',
      experience: formattedExperience,
    });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({ error: 'Failed to update experience' });
  }
}

/**
 * DELETE /api/experiences/[id] - Delete experience (soft delete)
 */
async function handleDeleteExperience(
  req: NextApiRequest,
  res: NextApiResponse,
  experienceId: number
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if experience exists and user owns it
  const existingExperience = await prisma.experience.findFirst({
    where: {
      id: experienceId,
      deletedAt: null,
    },
  });

  if (!existingExperience) {
    return res.status(404).json({ error: 'Experience not found' });
  }

  if (existingExperience.userId !== parseInt(session.user.id)) {
    return res
      .status(403)
      .json({ error: 'Not authorized to delete this experience' });
  }

  try {
    // Soft delete experience and related data
    await prisma.$transaction(async (tx: any) => {
      // Soft delete experience
      await tx.experience.update({
        where: { id: experienceId },
        data: { deletedAt: new Date() },
      });

      // Soft delete related prompts
      await tx.prompt.updateMany({
        where: {
          experienceId: experienceId,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      // Soft delete related comments
      await tx.comment.updateMany({
        where: {
          experienceId: experienceId,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      // Update user's experience count
      await tx.user.update({
        where: { id: parseInt(session.user.id) },
        data: {
          experienceCount: { decrement: 1 },
        },
      });
    });

    res.status(200).json({
      message: 'Experience deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({ error: 'Failed to delete experience' });
  }
}
