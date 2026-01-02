import { describe, it, expect } from 'vitest';
import { homeSummaryDbHandler } from '../src/tools/home_summary_db.js';

describe('home_summary_db tool', () => {
  it('returns found=false when no doc', async () => {
    const getDbMock = async () => ({
      collection: () => ({
        findOne: async () => null
      })
    });
    const res = await homeSummaryDbHandler({ homeId: 'x' }, getDbMock);
    const data = res.content[0].data;
    expect(data.found).toBe(false);
  });
  it('returns summary when doc exists', async () => {
    const getDbMock = async () => ({
      collection: () => ({
        findOne: async () => ({
          _id: 'h1',
          name: 'Home',
          address: 'Addr',
          requirements: '',
          requirementsList: [],
          trades: [{}, {}],
          documents: [{}]
        })
      })
    });
    const res = await homeSummaryDbHandler({ homeId: 'h1' }, getDbMock);
    const data = res.content[0].data;
    expect(data.found).toBe(true);
    expect(data.summary.tradesCount).toBe(2);
    expect(data.summary.documentsCount).toBe(1);
  });
});


