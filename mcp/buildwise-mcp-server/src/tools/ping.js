import { jsonContent } from '../util.js';

export function registerPing(server, { serverName, version }) {
  server.tool(
    'ping',
    {
      description: 'Health check for the Buildwise MCP server.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    async () => {
      return { content: jsonContent({ ok: true, server: serverName, version, time: new Date().toISOString() }) };
    }
  );
}

// Export handler for tests if needed
export async function pingHandler({ serverName, version }) {
  return { content: jsonContent({ ok: true, server: serverName, version, time: 'TEST' }) };
}


