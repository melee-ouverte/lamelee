/**
 * Contract Test: GET /api/users/{id}
 * 
 * This test validates the API contract for fetching user profile by ID.
 * According to the OpenAPI specification in contracts/api.yaml
 * 
 * Test Status: RED (Must fail before implementation)
 * Related Task: T015
 * Implementation Task: T042
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/users/[id]';

describe('/api/users/{id} GET', () => {
  it('should return user profile with statistics', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '1' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    
    // Validate response structure matches OpenAPI UserProfile schema
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('github_id');
    expect(data).toHaveProperty('username');
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('avatar_url');
    expect(data).toHaveProperty('bio');
    expect(data).toHaveProperty('created_at');
    expect(data).toHaveProperty('experience_count');
    expect(data).toHaveProperty('prompt_count');
    
    // Validate statistics
    expect(typeof data.experience_count).toBe('number');
    expect(typeof data.prompt_count).toBe('number');
    expect(data.experience_count).toBeGreaterThanOrEqual(0);
    expect(data.prompt_count).toBeGreaterThanOrEqual(0);
  });

  it('should return 404 for non-existent user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '99999' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/user.*not found/i);
  });

  it('should validate user ID parameter', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'invalid' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/invalid.*id/i);
  });

  it('should require authentication', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '1' }
    });
    
    // No authentication provided
    delete req.headers.authorization;

    await handler(req, res);

    // Should redirect to login or return 401
    expect([401, 302]).toContain(res._getStatusCode());
  });

  it('should handle invalid method', async () => {
    const { req, res } = createMocks({
      method: 'PATCH', // Invalid method
      query: { id: '1' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });
});