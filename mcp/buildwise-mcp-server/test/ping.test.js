import { describe, it, expect } from 'vitest';
import { pingHandler } from '../src/tools/ping.js';

describe('ping tool', () => {
  it('returns ok with server name and version', async () => {
    const res = await pingHandler({ serverName: 'buildwise-mcp', version: '0.1.0' });
    expect(res?.content?.[0]?.type).toBe('json');
    const data = res.content[0].data;
    expect(data.ok).toBe(true);
    expect(data.server).toBe('buildwise-mcp');
    expect(data.version).toBe('0.1.0');
  });
});


