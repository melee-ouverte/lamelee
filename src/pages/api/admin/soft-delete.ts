/**
 * T063: Admin Soft Delete API
 *
 * Provides secure admin endpoints for soft delete operations
 * with proper authentication and validation.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import SoftDeleteService from '../../../lib/soft-delete';

interface SoftDeleteRequest {
  action:
    | 'delete_user'
    | 'delete_experience'
    | 'restore_user'
    | 'restore_experience'
    | 'get_stats'
    | 'get_records';
  userId?: number;
  experienceId?: number;
  cascade?: boolean;
  deletionReason?: string;
  daysOld?: number;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST requests for mutations, GET for queries
  const allowedMethods = ['POST', 'GET'];
  if (!allowedMethods.includes(req.method || '')) {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Simple admin check - in production, you'd want a proper role system
    const isAdmin =
      session.user.email?.endsWith('@admin.com') ||
      session.user.username?.toLowerCase().includes('admin');

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required',
      });
    }

    const body: SoftDeleteRequest = req.method === 'GET' ? req.query : req.body;
    const { action, userId, experienceId, cascade, deletionReason, daysOld } =
      body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required',
      });
    }

    let result;

    switch (action) {
      case 'delete_user':
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: 'userId is required for delete_user action',
          });
        }
        result = await SoftDeleteService.deleteUser(Number(userId), {
          cascade: cascade !== false, // default to true
          deletionReason: deletionReason || 'Admin deletion',
        });
        return res.status(200).json({
          success: true,
          data: result,
          message: `User ${userId} soft deleted successfully${result.cascadedExperiences > 0 ? ` with ${result.cascadedExperiences} experiences` : ''}`,
        });

      case 'delete_experience':
        if (!experienceId) {
          return res.status(400).json({
            success: false,
            error: 'experienceId is required for delete_experience action',
          });
        }
        result = await SoftDeleteService.deleteExperience(
          Number(experienceId),
          {
            deletionReason: deletionReason || 'Admin deletion',
          }
        );
        return res.status(200).json({
          success: true,
          data: result,
          message: `Experience ${experienceId} soft deleted successfully`,
        });

      case 'restore_user':
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: 'userId is required for restore_user action',
          });
        }
        result = await SoftDeleteService.restoreUser(Number(userId));
        return res.status(200).json({
          success: true,
          data: result,
          message: `User ${userId} restored successfully`,
        });

      case 'restore_experience':
        if (!experienceId) {
          return res.status(400).json({
            success: false,
            error: 'experienceId is required for restore_experience action',
          });
        }
        result = await SoftDeleteService.restoreExperience(
          Number(experienceId)
        );
        return res.status(200).json({
          success: true,
          data: result,
          message: `Experience ${experienceId} restored successfully`,
        });

      case 'get_stats':
        result = await SoftDeleteService.getSoftDeleteStats();
        return res.status(200).json({
          success: true,
          data: result,
          message: 'Soft delete statistics retrieved successfully',
        });

      case 'get_records':
        const days = daysOld || 30;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        result = await SoftDeleteService.getSoftDeletedRecords(cutoffDate);
        return res.status(200).json({
          success: true,
          data: result,
          message: `Retrieved ${result.total} soft deleted records older than ${days} days`,
        });

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`,
        });
    }
  } catch (error) {
    console.error('Soft delete API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
