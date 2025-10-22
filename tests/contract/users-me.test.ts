/**
 * Contract Test: GET /api/users/me
 *
 * This test validates the API contract for fetching current user profile.
 * According to the OpenAPI specification in contracts/api.yaml
 *
 * Test Status: RED (Must fail before implementation)
 * Related Task: T014
 * Implementation Task: T041
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/users/me';

describe('/api/users/me GET', () => {
  it('should return current user profile', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());

    // Validate response structure matches OpenAPI User schema
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('github_id');
    expect(data).toHaveProperty('username');
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('avatar_url');
    expect(data).toHaveProperty('bio');
    expect(data).toHaveProperty('created_at');

    // Validate field types
    expect(typeof data.id).toBe('number');
    expect(typeof data.github_id).toBe('number');
    expect(typeof data.username).toBe('string');
    expect(typeof data.avatar_url).toBe('string');
    expect(typeof data.created_at).toBe('string');

    // Email and bio can be null
    expect([null, 'string']).toContain(typeof data.email);
    expect([null, 'string']).toContain(typeof data.bio);
  });

  it('should require authentication', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    // No authentication provided
    delete req.headers.authorization;

    await handler(req, res);

    // Should redirect to login or return 401
    expect([401, 302]).toContain(res._getStatusCode());
  });

  it('should handle invalid method', async () => {
    const { req, res } = createMocks({
      method: 'POST', // Invalid method
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });
});
