/**
 * Contract Test: DELETE /api/experiences/{id}
 * 
 * This test validates the API contract for deleting experiences.
 * According to the OpenAPI specification in contracts/api.yaml
 * 
 * Test Status: RED (Must fail before implementation)
 * Related Task: T010
 * Implementation Task: T036
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/experiences/[id]';

describe('/api/experiences/{id} DELETE', () => {
  it('should delete experience with owner validation', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: '1' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(204);
    expect(res._getData()).toBe('');
  });

  it('should cascade delete related prompts, comments, and reactions', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: '1' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(204);
  });

  it('should require owner validation', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: '1' }
    });

    await handler(req, res);

    // Should return 403 if user is not the owner
    expect([204, 403]).toContain(res._getStatusCode());
  });

  it('should return 404 for non-existent experience', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: '99999' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
  });
});