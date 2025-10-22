/**
 * Contract Test: GET /api/experiences/{id}
 * 
 * This test validates the API contract for fetching a specific experience by ID.
 * According to the OpenAPI specification in contracts/api.yaml
 * 
 * Test Status: RED (Must fail before implementation)
 * Related Task: T008
 * Implementation Task: T034
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/experiences/[id]';

describe('/api/experiences/{id} GET', () => {
  it('should return experience details with correct structure', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '1' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    
    // Validate response structure matches OpenAPI ExperienceDetail schema
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('ai_assistant_type');
    expect(data).toHaveProperty('tags');
    expect(data).toHaveProperty('github_urls');
    expect(data).toHaveProperty('is_news');
    expect(data).toHaveProperty('created_at');
    expect(data).toHaveProperty('updated_at');
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('prompts');
    expect(data).toHaveProperty('reaction_counts');
    
    // Validate nested objects
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('username');
    expect(data.user).toHaveProperty('avatar_url');
    
    expect(Array.isArray(data.prompts)).toBe(true);
    
    expect(data.reaction_counts).toHaveProperty('likes');
    expect(data.reaction_counts).toHaveProperty('helpful');
    expect(data.reaction_counts).toHaveProperty('bookmarks');
  });

  it('should return 404 for non-existent experience', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '99999' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/not found/i);
  });

  it('should validate experience ID parameter', async () => {
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

  it('should validate prompts structure when present', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '1' }
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());
    
    if (data.prompts && data.prompts.length > 0) {
      const prompt = data.prompts[0];
      
      expect(prompt).toHaveProperty('id');
      expect(prompt).toHaveProperty('experience_id');
      expect(prompt).toHaveProperty('content');
      expect(prompt).toHaveProperty('context');
      expect(prompt).toHaveProperty('results_achieved');
      expect(prompt).toHaveProperty('average_rating');
      expect(prompt).toHaveProperty('rating_count');
      expect(prompt).toHaveProperty('created_at');
    }
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