/**
 * Contract Test: POST /api/experiences/{id}/comments
 * 
 * This test validates the API contract for adding comments to experiences.
 * According to the OpenAPI specification in contracts/api.yaml
 * 
 * Test Status: RED (Must fail before implementation)
 * Related Task: T011
 * Implementation Task: T038
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/experiences/[id]/comments';

describe('/api/experiences/{id}/comments POST', () => {
  const commentData = {
    content: 'This prompt worked great for my project too! Thanks for sharing.'
  };

  it('should create comment with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { id: '1' },
      body: commentData,
      headers: { 'content-type': 'application/json' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('experience_id');
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('created_at');
    expect(data.content).toBe(commentData.content);
  });

  it('should validate content length (max 1000 characters)', async () => {
    const invalidData = {
      content: 'a'.repeat(1001)
    };

    const { req, res } = createMocks({
      method: 'POST',
      query: { id: '1' },
      body: invalidData,
      headers: { 'content-type': 'application/json' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/content.*1000/i);
  });

  it('should require authentication', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { id: '1' },
      body: commentData,
      headers: { 'content-type': 'application/json' }
    });

    delete req.headers.authorization;

    await handler(req, res);

    expect([401, 302]).toContain(res._getStatusCode());
  });
});