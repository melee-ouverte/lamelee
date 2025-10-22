/**
 * Contract Test: POST /api/prompts/{id}/ratings
 * 
 * This test validates the API contract for rating prompts.
 * According to the OpenAPI specification in contracts/api.yaml
 * 
 * Test Status: RED (Must fail before implementation)
 * Related Task: T013
 * Implementation Task: T040
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/prompts/[id]/ratings';

describe('/api/prompts/{id}/ratings POST', () => {
  const ratingData = {
    rating: 5
  };

  it('should create rating with valid 1-5 scale', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { id: '1' },
      body: ratingData,
      headers: { 'content-type': 'application/json' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('prompt_id');
    expect(data).toHaveProperty('rating');
    expect(data.rating).toBe(ratingData.rating);
  });

  it('should validate rating range (1-5)', async () => {
    const invalidData = {
      rating: 6 // Outside valid range
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
    expect(data.error).toMatch(/rating.*1.*5/i);
  });

  it('should validate rating is integer', async () => {
    const invalidData = {
      rating: 3.5 // Should be integer
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
    expect(data.error).toMatch(/rating.*integer/i);
  });

  it('should calculate average rating after creation', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { id: '1' },
      body: ratingData,
      headers: { 'content-type': 'application/json' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('average_rating');
    expect(data).toHaveProperty('rating_count');
  });

  it('should handle unique constraint (one rating per user per prompt)', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { id: '1' },
      body: ratingData,
      headers: { 'content-type': 'application/json' }
    });

    await handler(req, res);

    // Should either create (201) or handle duplicate gracefully
    expect([201, 409]).toContain(res._getStatusCode());
  });
});