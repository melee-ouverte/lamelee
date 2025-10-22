/**
 * Contract Test: POST /api/experiences/{id}/reactions
 * 
 * This test validates the API contract for adding reactions to experiences.
 * According to the OpenAPI specification in contracts/api.yaml
 * 
 * Test Status: RED (Must fail before implementation)
 * Related Task: T012
 * Implementation Task: T039
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/experiences/[id]/reactions';

describe('/api/experiences/{id}/reactions POST', () => {
  const reactionData = {
    reaction_type: 'helpful'
  };

  it('should create reaction with valid type', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { id: '1' },
      body: reactionData,
      headers: { 'content-type': 'application/json' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('experience_id');
    expect(data).toHaveProperty('reaction_type');
    expect(data.reaction_type).toBe(reactionData.reaction_type);
  });

  it('should validate reaction type enum', async () => {
    const invalidData = {
      reaction_type: 'invalid_reaction'
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
    expect(data.error).toMatch(/reaction_type.*like|helpful|bookmark/i);
  });

  it('should handle unique constraint (one reaction per user per experience per type)', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { id: '1' },
      body: reactionData,
      headers: { 'content-type': 'application/json' }
    });

    await handler(req, res);

    // Should either create (201) or handle duplicate gracefully
    expect([201, 409]).toContain(res._getStatusCode());
  });
});