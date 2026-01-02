import { jsonContent } from '../util.js';
import { getDb, ObjectId } from '../db.js';

export function registerHomeSummary(server) {
  server.tool(
    'home_summary',
    {
      description: 'Get home summary by ID directly from MongoDB.',
      inputSchema: {
        type: 'object',
        properties: { homeId: { type: 'string' } },
        required: ['homeId'],
        additionalProperties: false
      }
    },
    async ({ homeId }) => {
      const result = await homeSummaryDbHandler({ homeId });
      return result;
    }
  );
}

export async function homeSummaryDbHandler({ homeId }, getDbImpl = getDb) {
  const db = await getDbImpl();
  const homes = db.collection('homes');
  let query;
  try {
    query = { _id: new ObjectId(homeId) };
  } catch {
    query = { _id: homeId };
  }
  const doc = await homes.findOne(query, {
    projection: {
      name: 1,
      address: 1,
      requirements: 1,
      requirementsList: 1,
      trades: 1,
      documents: 1
    }
  });
  if (!doc) {
    return { content: jsonContent({ found: false }) };
  }
  const summary = {
    id: doc._id,
    name: doc.name,
    address: doc.address,
    requirements: doc.requirements || '',
    requirementsList: Array.isArray(doc.requirementsList) ? doc.requirementsList : [],
    tradesCount: Array.isArray(doc.trades) ? doc.trades.length : 0,
    documentsCount: Array.isArray(doc.documents) ? doc.documents.length : 0
  };
  return { content: jsonContent({ found: true, summary }) };
}


