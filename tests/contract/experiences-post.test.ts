/**
 * Contract Test: POST /api/experiences
 *
 * This test validates the API contract for creating new experiences.
 * According to the OpenAPI specification in contracts/api.yaml
 *
 * Test Status: RED (Must fail before implementation)
 * Related Task: T007
 * Implementation Task: T033
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/experiences/index';

describe('/api/experiences POST', () => {
  const validExperienceData = {
    title: 'Using GitHub Copilot for React Components',
    description:
      'Copilot helped me create reusable components faster with better TypeScript support.',
    ai_assistant_type: 'GitHub Copilot',
    tags: ['react', 'typescript', 'components'],
    github_urls: ['https://github.com/user/repo/blob/main/Component.tsx'],
    is_news: false,
    prompts: [
      {
        content: 'Create a reusable Button component with TypeScript',
        context: 'Building a design system for our React application',
        results_achieved:
          'Generated clean, typed component with proper props interface',
      },
    ],
  };

  it('should create experience with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validExperienceData,
      headers: {
        'content-type': 'application/json',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);

    const data = JSON.parse(res._getData());

    // Validate response structure matches OpenAPI schema
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

    // Validate created data matches input
    expect(data.title).toBe(validExperienceData.title);
    expect(data.description).toBe(validExperienceData.description);
    expect(data.ai_assistant_type).toBe(validExperienceData.ai_assistant_type);
    expect(data.tags).toEqual(validExperienceData.tags);
    expect(data.github_urls).toEqual(validExperienceData.github_urls);
    expect(data.is_news).toBe(validExperienceData.is_news);
  });

  it('should validate required fields', async () => {
    const invalidData = { ...validExperienceData } as any;
    delete invalidData.title;

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidData,
      headers: {
        'content-type': 'application/json',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/title.*required/i);
  });

  it('should validate title length limit (500 characters)', async () => {
    const invalidData = {
      ...validExperienceData,
      title: 'a'.repeat(501), // Exceeds 500 character limit
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidData,
      headers: {
        'content-type': 'application/json',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/title.*500/i);
  });

  it('should validate AI assistant type enum', async () => {
    const invalidData = {
      ...validExperienceData,
      ai_assistant_type: 'Invalid Assistant',
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidData,
      headers: {
        'content-type': 'application/json',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/ai_assistant_type.*invalid/i);
  });

  it('should validate GitHub URLs pattern', async () => {
    const invalidData = {
      ...validExperienceData,
      github_urls: ['https://gitlab.com/user/repo'], // Not github.com
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidData,
      headers: {
        'content-type': 'application/json',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/github.*url/i);
  });

  it('should validate tags array limit (max 10 items)', async () => {
    const invalidData = {
      ...validExperienceData,
      tags: Array(11).fill('tag'), // Exceeds 10 item limit
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidData,
      headers: {
        'content-type': 'application/json',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/tags.*10/i);
  });

  it('should validate prompt content length (max 5000 characters)', async () => {
    const invalidData = {
      ...validExperienceData,
      prompts: [
        {
          content: 'a'.repeat(5001), // Exceeds 5000 character limit
          context: 'Test context',
          results_achieved: 'Test results',
        },
      ],
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidData,
      headers: {
        'content-type': 'application/json',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/prompt.*content.*5000/i);
  });

  it('should require authentication', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validExperienceData,
      headers: {
        'content-type': 'application/json',
      },
    });

    // No authentication provided
    delete req.headers.authorization;

    await handler(req, res);

    // Should redirect to login or return 401
    expect([401, 302]).toContain(res._getStatusCode());
  });

  it('should handle invalid JSON', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: '{ invalid json' as any,
      headers: {
        'content-type': 'application/json',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/invalid.*json/i);
  });

  it('should handle invalid method', async () => {
    const { req, res } = createMocks({
      method: 'PATCH', // Invalid method
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should handle missing content-type header', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validExperienceData,
      // Missing content-type header
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/content.*type/i);
  });
});
