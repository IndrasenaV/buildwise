import { describe, it, expect } from 'vitest';
import { buildingTipsHandler } from '../src/tools/building_tips.js';

describe('building_tips tool', () => {
  it('returns generic tips for unknown topic', async () => {
    const res = await buildingTipsHandler({ topic: 'other' });
    const data = res.content[0].data;
    expect(Array.isArray(data.tips)).toBe(true);
    expect(data.tips.length).toBeGreaterThan(0);
  });
  it('returns foundation tips', async () => {
    const res = await buildingTipsHandler({ topic: 'foundation' });
    const txt = res.content[0].data.tips.join(' ');
    expect(txt.toLowerCase()).toContain('soil');
  });
});


