import { describe, it, expect, vi } from 'vitest';
import { imagesSearchAllowedHandler } from '../src/tools/images_search_allowed.js';

describe('images_search_allowed (google provider)', () => {
  const prevProvider = process.env.IMAGES_PROVIDER;
  const prevCseId = process.env.GOOGLE_CSE_ID;
  const prevCseKey = process.env.GOOGLE_CSE_KEY;
  beforeAll(() => {
    process.env.IMAGES_PROVIDER = 'google';
    process.env.GOOGLE_CSE_ID = 'cx';
    process.env.GOOGLE_CSE_KEY = 'key';
  });
  afterAll(() => {
    process.env.IMAGES_PROVIDER = prevProvider;
    process.env.GOOGLE_CSE_ID = prevCseId;
    process.env.GOOGLE_CSE_KEY = prevCseKey;
  });

  it('maps google items and enforces allowlist', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            link: 'https://pergo.com/img.jpg',
            title: 'Pergo',
            displayLink: 'pergo.com',
            image: { thumbnailLink: 'https://pergo.com/thumb.jpg', contextLink: 'https://pergo.com/p/x', width: 1000, height: 800 }
          },
          {
            link: 'https://random.com/img.jpg',
            title: 'Other',
            displayLink: 'random.com',
            image: { thumbnailLink: 'https://random.com/thumb.jpg', contextLink: 'https://random.com/p/x', width: 1000, height: 800 }
          }
        ]
      })
    });
    const res = await imagesSearchAllowedHandler({ query: 'oak flooring', count: 5, domains: ['pergo.com'] }, fetchMock);
    const data = res.content[0].data;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBe(1);
    expect(data.items[0].domain).toContain('pergo.com');
    expect(data.provider).toBe('google');
  });
});


