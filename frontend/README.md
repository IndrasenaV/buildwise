Custom Home Frontend (React + Vite)
===================================

Quick Start
-----------
1) Install dependencies:
```bash
cd customhome/frontend
npm install
```

2) Run the dev server:
```bash
npm run dev
```

3) Configure API base (optional):
Create `.env` with:
```
VITE_API_BASE=http://localhost:5051/api
```
If omitted, the app defaults to `http://localhost:5051/api`.

Features
--------
- Create a new Home (with optional templates)
- View Homes list
- View a Home, add Bids, and add Tasks to Bids
- PWA manifest included (basic)

Notes
-----
- Ensure the backend service is running on the configured API base before using the UI.


End-to-end tests (Playwright)
----------------------------
One-time setup:
```bash
cd customhome/frontend
npx playwright install
```

Run tests (the dev server auto-starts on port 5173):
```bash
npm run test:e2e
```

Useful:
- Headed mode: `npm run test:e2e:headed`
- Open HTML report: `npm run test:e2e:report`

Screenshots are saved under `tests/screenshots/` for use in product docs and marketing:
- `auth_onboarding.spec.ts`: Login, redirect to onboarding; captures onboarding steps
- `homes_list.spec.ts`: Homes grid with sample data
- `trades_table.spec.ts`: Trades table with progress chips
- `onboarding_full.spec.ts`: Full onboarding wizard with stubbed templates and people

