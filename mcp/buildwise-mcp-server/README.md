Buildwise MCP Server
====================

Custom MCP server that exposes Buildwise-aware tools to Cursor (or any MCP client).

Tools
- ping: Health check
- home_summary: Fetch basic summary for a home from MongoDB (name, address, requirements, counts)
- city_documents_by_zip: Stub list of city/permit docs by ZIP (replace with real data when available)
- building_tips: Topic-based building tips (foundation, HVAC, daylight, etc.)
- images_search_allowed: Site-allowlisted image search (Bing)
- images_get_allowed: Validate/HEAD-check an image from allowed domains

Folder
- /Users/indra/buildwise/mcp/buildwise-mcp-server

Requirements
- Node.js 18+
- Buildwise backend running locally (for home_summary) at http://localhost:5051/api
- Optional: direct MongoDB access for home_summary_db

Environment configuration
- Copy `env.example` to `.env` in this folder and set values:
  - `MONGODB_URI` (required): e.g., `mongodb://127.0.0.1:27017/buildwise`
  - `MONGODB_DB` (optional): defaults to DB in URI path or `buildwise`
  - `BUILDWISE_API_BASE` (optional): defaults to `http://localhost:5051/api`
  - `BING_API_KEY` (for images_search_allowed)
  - `IMAGES_PROVIDER` (optional: `bing` (default) or `google`)
  - `GOOGLE_CSE_ID` and `GOOGLE_CSE_KEY` (if using Google provider)
  - `ALLOWED_IMAGE_DOMAINS` (comma-separated, e.g., `thermador.com,pergo.com,shawfloors.com`)

Install dependencies
```bash
cd /Users/indra/buildwise/mcp/buildwise-mcp-server
npm install
```

Run (manual)
```bash
npm start
```

Run tests
```bash
npm test
```

Cursor MCP registration (macOS)
1) Open Cursor settings JSON:
   - Cmd+, then open Settings (JSON).
2) Add the server entry (absolute paths recommended):
```json
{
  "mcpServers": {
    "buildwise-mcp": {
      "command": "node",
      "args": ["/Users/indra/buildwise/mcp/buildwise-mcp-server/server.js"],
      "env": {
        "NODE_ENV": "production",
        "BUILDWISE_API_BASE": "http://localhost:5051/api"
      }
    }
  }
}
```
3) Restart Cursor to load the MCP server.

Usage examples
- “List MCP tools.” → you should see ping, home_summary, city_documents_by_zip, building_tips
- “Run home_summary with homeId=<ID>”
- “Get city_documents_by_zip for 75201”
- “building_tips topic=daylight”
- “images_search_allowed query='wide plank oak flooring' count=8 domains=['pergo.com','shawfloors.com']”
- “images_get_allowed url='https://thermador.com/path/to/image.jpg'”

Notes
- BUILDWISE_API_BASE can be changed if your backend runs elsewhere.
- city_documents_by_zip is stubbed; wire it to a real source when ready.
- For MongoDB direct access: set MONGODB_URI and optionally MONGODB_DB; the server uses `homes` collection.
  - Recommended: set them in `.env` (same folder). The server loads `.env` next to `server.js`.


