Custom Home Backend (Node.js + Express + MongoDB)
=================================================

Overview
--------
This service provides an API for tracking custom home builds. It stores almost everything inside a single `Home` MongoDB document (bids, tasks, schedules, documents), as requested. Media files (photos) are intended to be stored in S3 with links kept in the `Home` document.

Key Features
------------
- Single-document model per home with nested arrays for bids, tasks, schedules, and documents
- Minimal collections (only `homes`)
- REST API to manage homes and nested entities
- CORS-enabled for a React PWA frontend
- Optional S3 presign endpoint (stubbed unless AWS env vars are provided)

Getting Started
---------------
1) Prerequisites:
- Node.js 18+
- MongoDB 6+ running locally or a connection string

2) Install dependencies:
```bash
cd customhome/backend
npm install
```

3) Environment variables:
Create a `.env` file next to `package.json` with:
```
PORT=5051
MONGODB_URI=mongodb://localhost:27017/customhome
CORS_ORIGIN=http://localhost:5173

# Optional: enable real S3 presign (otherwise a stub is used)
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

4) Run the server:
```bash
npm run dev
```

API Summary
-----------
- `GET /api/health` — healthcheck
- `GET /api/homes` — list homes
- `POST /api/homes` — create a home (optionally with a template)
- `GET /api/homes/:homeId` — get a single home
- `PUT /api/homes/:homeId` — update basic fields of a home
- `POST /api/homes/:homeId/bids` — add a bid to the home
- `POST /api/homes/:homeId/bids/:bidId/tasks` — add a task to a bid
- `POST /api/homes/:homeId/schedules` — add a schedule item
- `POST /api/homes/:homeId/documents` — add a document (URL or S3 key)
- `POST /api/uploads/presign` — get a presigned upload URL (stub unless AWS configured)

Data Model Notes
----------------
- Phases: `preconstruction`, `exterior`, `interior`
- Bids belong to one or more phases and own their tasks
- Schedules live at the home level and reference bid/task ids where relevant
- Documents live at the home level and can be pinned to a bid or task


