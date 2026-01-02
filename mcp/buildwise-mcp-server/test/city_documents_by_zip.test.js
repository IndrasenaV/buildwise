import { describe, it, expect } from 'vitest';
import { cityDocsHandler } from '../src/tools/city_documents_by_zip.js';

describe('city_documents_by_zip tool', () => {
  it('returns docs array with zip', async () => {
    const res = await cityDocsHandler({ zip: '75201' });
    const data = res.content[0].data;
    expect(data.zip).toBe('75201');
    expect(Array.isArray(data.documents)).toBe(true);
    expect(data.documents.length).toBeGreaterThan(0);
  });
});


