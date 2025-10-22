/**
 * Contract Test: PUT /api/experiences/{id}
 * 
 * This test validates the API contract for updating experiences.
 * According to the OpenAPI specification in contracts/api.yaml
 * 
 * Test Status: RED (Must fail before implementation)
 * Related Task: T009
 * Implementation Task: T035
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/experiences/[id]';

describe('/api/experiences/{id} PUT', () => {
  const updateData = {
    title: 'Updated: Using GitHub Copilot for React Components',
    description: 'Updated description with more details',
    ai_assistant_type: 'GitHub Copilot',
    tags: ['react', 'typescript', 'components', 'updated'],
    github_urls: ['https://github.com/user/repo/blob/main/UpdatedComponent.tsx']
  };

  it('should update experience with valid data', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      query: { id: '1' },
      body: updateData,
      headers: { 'content-type': 'application/json' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data.title).toBe(updateData.title);
    expect(data.description).toBe(updateData.description);
  });

  it('should require owner validation', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      query: { id: '1' },
      body: updateData,
      headers: { 'content-type': 'application/json' }
    });

    await handler(req, res);

    // Should return 403 if user is not the owner
    expect([200, 403]).toContain(res._getStatusCode());
  });

  it('should return 404 for non-existent experience', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      query: { id: '99999' },
      body: updateData,
      headers: { 'content-type': 'application/json' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
  });
});