/**
 * T077: OpenAPI Specification Endpoint
 *
 * Serves the OpenAPI 3.0 specification for the AI Coding Assistant Platform API.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the OpenAPI specification file
    const specPath = path.join(process.cwd(), 'docs', 'openapi.yaml');

    if (!fs.existsSync(specPath)) {
      return res.status(404).json({
        error: 'OpenAPI specification not found',
        message: 'The API documentation file is not available.',
      });
    }

    const specContent = fs.readFileSync(specPath, 'utf-8');

    // Set appropriate headers for YAML content
    res.setHeader('Content-Type', 'application/x-yaml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    return res.status(200).send(specContent);
  } catch (error) {
    console.error('Error serving OpenAPI specification:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to serve API documentation.',
    });
  }
}
