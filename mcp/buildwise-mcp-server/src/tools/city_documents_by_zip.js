import { jsonContent } from '../util.js';

export function registerCityDocumentsByZip(server) {
  server.tool(
    'city_documents_by_zip',
    {
      description: 'List known city/permit documents for a ZIP code.',
      inputSchema: {
        type: 'object',
        properties: { zip: { type: 'string' } },
        required: ['zip'],
        additionalProperties: false
      }
    },
    async ({ zip }) => {
      const result = await cityDocsHandler({ zip });
      return result;
    }
  );
}

export async function cityDocsHandler({ zip }) {
  // TODO: Replace with a real data source/API when available
  const docs = [
    { title: 'New Home Permit Checklist', url: 'https://example.city/permit-checklist.pdf' },
    { title: 'Energy Code Compliance Guide', url: 'https://example.city/energy-code.pdf' },
    { title: 'Residential Plan Review Requirements', url: 'https://example.city/plan-review.pdf' }
  ];
  return { content: jsonContent({ zip, documents: docs }) };
}


