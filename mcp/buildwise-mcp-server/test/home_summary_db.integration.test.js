import { describe, it, expect } from 'vitest';
import { homeSummaryDbHandler } from '../src/tools/home_summary_db.js';

const HOME_ID = '692bc26916d446ea2deb36a2';
const hasMongo = !!process.env.MONGODB_URI;

(hasMongo ? describe : describe.skip)('home_summary (integration, real DB)', () => {
  it(
    'finds the home by ObjectId',
    async () => {
      const res = await homeSummaryDbHandler({ homeId: HOME_ID });
      const content = Array.isArray(res?.content) ? res.content[0] : null;
      expect(content && content.type).toBe('json');
      const data = content.data;
      expect(data?.found).toBe(true);
      expect(String(data?.summary?.id)).toBe(HOME_ID);
      expect(data?.summary?.name).toBeDefined();
    },
    15000
  );
});


