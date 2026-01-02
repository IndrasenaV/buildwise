// server.js - Buildwise MCP server (Node 18+, ESM)
import fetch from 'node-fetch';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/transports/stdio.js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Tools
import { registerPing } from './src/tools/ping.js';
import { registerHomeSummary } from './src/tools/home_summary_db.js';
import { registerCityDocumentsByZip } from './src/tools/city_documents_by_zip.js';
import { registerBuildingTips } from './src/tools/building_tips.js';

const SERVER_NAME = 'buildwise-mcp';
const SERVER_VERSION = '0.1.0';

// Load .env from the same directory as this server file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// API base for Buildwise backend (optional; used by http tool)
const API_BASE = process.env.BUILDWISE_API_BASE || 'http://localhost:5051/api';

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

// Register tools
registerPing(server, { serverName: SERVER_NAME, version: SERVER_VERSION });
registerHomeSummary(server);
registerCityDocumentsByZip(server);
registerBuildingTips(server);

await server.connect(new StdioServerTransport());


