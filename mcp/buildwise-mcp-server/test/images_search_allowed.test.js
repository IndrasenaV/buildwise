import { describe, it, expect, vi } from 'vitest';
import { imagesSearchAllowedHandler } from '../src/tools/images_search_allowed.js';

describe('images_search_allowed', () => {
  const key = process.env.BING_API_KEY;
  beforeAll(() => {
    process.env.BING_API_KEY = 'test-key';
  });
  afterAll(() => {
    process.env.BING_API_KEY = key;
  });
  it('filters results to allowed domains', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        value: [
          { contentUrl: 'https://thermador.com/img1.jpg', thumbnailUrl: 'https://thermador.com/t1.jpg', name: 'A', hostPageUrl: 'https://thermador.com/p/a' },
          { contentUrl: 'https://random.com/img2.jpg', thumbnailUrl: 'https://random.com/t2.jpg', name: 'B', hostPageUrl: 'https://random.com/p/b' }
        ]
      })
    });
    const res = await imagesSearchAllowedHandler({ query: 'range', count: 5, domains: ['thermador.com'] }, fetchMock);
    const data = res.content[0].data;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBe(1);
    expect(data.items[0].domain).toContain('thermador.com');
  });
});


