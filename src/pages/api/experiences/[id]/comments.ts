/**
 * T033: /api/experiences/[id]/comments - Experience Comments
 * 
 * Handles POST requests to create comments on experiences.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { commentSchema, validationUtils } from '@/lib/validations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const experienceId = parseInt(id as string);

    if (isNaN(experienceId)) {
      return res.status(400).json({ error: 'Invalid experience ID' });
    }

    switch (req.method) {
      case 'POST':
        await handleCreateComment(req, res, experienceId);
        break;
      default:
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error in /api/experiences/[id]/comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/experiences/[id]/comments - Create comment on experience
 */
async function handleCreateComment(req: NextApiRequest, res: NextApiResponse, experienceId: number) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate request body
  const validation = validationUtils.safeValidate(commentSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid comment data',
      details: validation.errors,
    });
  }

  const { content } = validation.data;

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

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        userId: parseInt(session.user.id),
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

    // Update experience comment count
    await prisma.experience.update({
      where: { id: experienceId },
      data: {
        commentCount: { increment: 1 },
      },
    });

    // Format response
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl,
      },
    };

    res.status(201).json({
      message: 'Comment created successfully',
      comment: formattedComment,
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
}