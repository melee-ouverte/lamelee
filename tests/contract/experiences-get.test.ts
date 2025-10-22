/**
 * Contract Test: GET /api/experiences
 * 
 * This test validates the API contract for fetching experiences feed.
 * According to the OpenAPI specification in contracts/api.yaml
 * 
 * Test Status: RED (Must fail before implementation)
 * Related Task: T006
 * Implementation Task: T032
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/experiences/index';

describe('/api/experiences GET', () => {
  it('should return experiences list with correct structure', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        page: '1',
        limit: '20'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    
    // Validate response structure matches OpenAPI schema
    expect(data).toHaveProperty('experiences');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('pages');
    
    expect(Array.isArray(data.experiences)).toBe(true);
    expect(typeof data.total).toBe('number');
    expect(typeof data.page).toBe('number');
    expect(typeof data.pages).toBe('number');
  });

  it('should support filtering by AI assistant type', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        ai_assistant: 'GitHub Copilot'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('experiences');
    expect(Array.isArray(data.experiences)).toBe(true);
  });

  it('should support filtering by tags', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        tags: ['react', 'typescript']
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('experiences');
    expect(Array.isArray(data.experiences)).toBe(true);
  });

  it('should support search functionality', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        search: 'react components'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('experiences');
    expect(Array.isArray(data.experiences)).toBe(true);
  });

  it('should validate experience object structure', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());
    
    if (data.experiences.length > 0) {
      const experience = data.experiences[0];
      
      // Validate required fields according to OpenAPI schema
      expect(experience).toHaveProperty('id');
      expect(experience).toHaveProperty('user_id');
      expect(experience).toHaveProperty('title');
      expect(experience).toHaveProperty('description');
      expect(experience).toHaveProperty('ai_assistant_type');
      expect(experience).toHaveProperty('tags');
      expect(experience).toHaveProperty('github_urls');
      expect(experience).toHaveProperty('is_news');
      expect(experience).toHaveProperty('created_at');
      expect(experience).toHaveProperty('updated_at');
      
      // Validate field types
      expect(typeof experience.id).toBe('number');
      expect(typeof experience.user_id).toBe('number');
      expect(typeof experience.title).toBe('string');
      expect(typeof experience.description).toBe('string');
      expect(typeof experience.ai_assistant_type).toBe('string');
      expect(Array.isArray(experience.tags)).toBe(true);
      expect(Array.isArray(experience.github_urls)).toBe(true);
      expect(typeof experience.is_news).toBe('boolean');
      expect(typeof experience.created_at).toBe('string');
      expect(typeof experience.updated_at).toBe('string');
    }
  });

  it('should handle pagination correctly', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        page: '2',
        limit: '10'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data.page).toBe(2);
    expect(data.experiences.length).toBeLessThanOrEqual(10);
  });

  it('should require authentication', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });
    
    // No authentication provided
    delete req.headers.authorization;

    await handler(req, res);

    // Should redirect to login or return 401
    expect([401, 302]).toContain(res._getStatusCode());
  });

  it('should handle invalid method', async () => {
    const { req, res } = createMocks({
      method: 'PATCH' // Invalid method
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });
});