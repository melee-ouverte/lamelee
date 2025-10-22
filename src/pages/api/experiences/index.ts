/**
 * T031: /api/experiences/index - Experience List and Creation
 * 
 * Handles GET (list experiences) and POST (create experience) requests
 * for the AI Coding Assistant Experience Platform.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { experienceSchema, searchSchema, validationUtils } from '@/lib/validations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGetExperiences(req, res);
        break;
      case 'POST':
        await handleCreateExperience(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error in /api/experiences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/experiences - List experiences with filtering and pagination
 */
async function handleGetExperiences(req: NextApiRequest, res: NextApiResponse) {
  // Validate query parameters
  const validation = validationUtils.safeValidate(searchSchema, {
    q: req.query.q as string,
    aiAssistant: req.query.aiAssistant as string,
    tags: req.query.tags as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    sort: req.query.sort as string || 'recent',
  });

  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid query parameters',
      details: validation.errors,
    });
  }

  const { q, aiAssistant, tags, page, limit, sort } = validation.data;

  try {
    // Build where clause for filtering
    const where: any = {
      deletedAt: null, // Only active experiences
    };

    // Text search
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // AI assistant filter
    if (aiAssistant) {
      where.aiAssistant = aiAssistant;
    }

    // Tags filter
    if (tags) {
      where.tags = { contains: tags };
    }

    // Build order by clause
    let orderBy: any = {};
    switch (sort) {
      case 'popular':
        orderBy = { reactionCount: 'desc' };
        break;
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Execute query with pagination, excluding soft-deleted records
    const [experiences, totalCount] = await Promise.all([
      prisma.experience.findMany({
        where: {
          ...where,
          deletedAt: null, // Exclude soft-deleted experiences
          user: {
            deletedAt: null, // Exclude experiences from soft-deleted users
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.experience.count({ 
        where: {
          ...where,
          deletedAt: null,
          user: {
            deletedAt: null,
          },
        }
      }),
    ]);

    // Format response
    const formattedExperiences = experiences.map((exp: any) => ({
      id: exp.id,
      title: exp.title,
      description: exp.description,
      githubUrl: exp.githubUrl,
      aiAssistant: exp.aiAssistant,
      tags: exp.tags ? exp.tags.split(',').filter(Boolean) : [],
      createdAt: exp.createdAt.toISOString(),
      updatedAt: exp.updatedAt.toISOString(),
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

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      experiences: formattedExperiences,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        q,
        aiAssistant,
        tags,
        sort,
      },
    });

  } catch (error) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
}

/**
 * POST /api/experiences - Create new experience
 */
async function handleCreateExperience(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
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
    // Create experience
    const experience = await prisma.experience.create({
      data: {
        title,
        description,
        githubUrl,
        aiAssistant,
        tags: tags || '',
        userId: parseInt(session.user.id),
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

    // Update user's experience count
    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        experienceCount: { increment: 1 },
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
      stats: {
        promptCount: 0,
        commentCount: 0,
        reactionCount: 0,
        averageRating: 0,
      },
    };

    res.status(201).json({
      message: 'Experience created successfully',
      experience: formattedExperience,
    });

  } catch (error) {
    console.error('Error creating experience:', error);
    res.status(500).json({ error: 'Failed to create experience' });
  }
}