import { jsonContent } from '../util.js';

export function registerBuildingTips(server) {
  server.tool(
    'building_tips',
    {
      description: 'Provide concise building tips for a topic (e.g., foundation, HVAC, daylight).',
      inputSchema: {
        type: 'object',
        properties: { topic: { type: 'string' } },
        required: ['topic'],
        additionalProperties: false
      }
    },
    async ({ topic }) => {
      const result = await buildingTipsHandler({ topic });
      return result;
    }
  );
}

export async function buildingTipsHandler({ topic }) {
  const t = String(topic || '').toLowerCase();
  let tips = [
    'Define constraints and success criteria up front.',
    'Track dependencies and lead times early.',
    'Budget a 10–15% contingency.'
  ];
  if (t.includes('foundation')) {
    tips = [
      'Verify soil report and bearing capacity before footing design.',
      'Coordinate slab penetrations with MEP early.',
      'Confirm waterproofing and drainage around the foundation.'
    ];
  } else if (t.includes('hvac')) {
    tips = [
      'Perform a proper load calculation (Manual J) before sizing.',
      'Plan duct routing to minimize static pressure.',
      'Coordinate returns and supply for balanced airflow.'
    ];
  } else if (t.includes('daylight') || t.includes('lighting')) {
    tips = [
      'Orient main living spaces for desirable natural light.',
      'Balance glazing for daylight vs. heat gain.',
      'Use overhangs and shading where appropriate.'
    ];
  }
  return { content: jsonContent({ topic, tips }) };
}


