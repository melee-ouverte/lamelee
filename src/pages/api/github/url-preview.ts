/**
 * T065: URL Preview API
 * 
 * API endpoint for generating URL previews, especially for GitHub URLs.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import URLPreviewService, { URLPreviewUtils } from '../../../lib/url-preview-service';

interface PreviewRequest {
  url: string;
  includeMetadata?: boolean;
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
  // Allow both GET and POST requests
  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Parse request data (support both GET query params and POST body)
    const data: PreviewRequest = req.method === 'GET' ? req.query : req.body;
    const { url, includeMetadata = true } = data;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'URL parameter is required' 
      });
    }

    // Validate URL format
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL format' 
      });
    }

    // Initialize preview service with GitHub token if available
    const githubToken = process.env.GITHUB_ACCESS_TOKEN;
    const previewService = new URLPreviewService(githubToken);

    // Generate preview
    const preview = await previewService.generatePreview(url);

    // Filter metadata based on request
    if (!includeMetadata && preview.metadata) {
      delete preview.metadata;
    }

    // Add additional context for GitHub URLs
    if (URLPreviewUtils.isGitHubUrl(url)) {
      const githubInfo = URLPreviewUtils.extractGitHubInfo(url);
      if (githubInfo) {
        preview.metadata = {
          ...preview.metadata,
          githubInfo,
        };
      }
    }

    if (preview.type === 'error') {
      return res.status(400).json({
        success: false,
        data: preview,
        error: preview.error,
        message: 'Failed to generate preview',
      });
    }

    return res.status(200).json({
      success: true,
      data: preview,
      message: `Generated ${preview.type} preview successfully`,
    });

  } catch (error) {
    console.error('URL preview API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * URL Preview Cache (in-memory for now, could be moved to Redis)
 */
const previewCache = new Map<string, { preview: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const URLPreviewCache = {
  get(url: string) {
    const cached = previewCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.preview;
    }
    return null;
  },

  set(url: string, preview: any) {
    previewCache.set(url, {
      preview,
      timestamp: Date.now(),
    });
    
    // Clean old entries periodically
    if (previewCache.size > 1000) {
      const cutoff = Date.now() - CACHE_TTL;
      const entriesToDelete = Array.from(previewCache.entries())
        .filter(([_, value]) => value.timestamp < cutoff)
        .map(([key, _]) => key);
      
      entriesToDelete.forEach(key => previewCache.delete(key));
    }
  },

  clear() {
    previewCache.clear();
  },
};