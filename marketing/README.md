# BuildWise AI — Marketing Site

This is a proper React app (Vite) for the BuildWise AI marketing site located at `customhome/marketing/`. It uses React 18 and Material UI 5 with Emotion.

Project structure:
- `index.html` — Vite entry
- `vite.config.js` — Vite config with React plugin
- `package.json` — scripts and dependencies
- `src/` — React source
  - `main.jsx` — entrypoint with theme provider
  - `App.jsx` — page composition
  - `components/` — MUI sections (NavBar, Hero, Features, Segments, Pricing, HowItWorks, FAQ, Contact, Footer)
  - `assets/logo.svg` — logo
- `styles.css` — background/misc cosmetics layered under MUI

Install and run:
```bash
cd customhome/marketing
npm install
npm run dev
```
Open the dev server URL shown (default `http://localhost:5173`).

Build and preview:
```bash
npm run build
npm run preview
```

Deploy:
- The `dist/` folder is static output suitable for any static host (S3, Netlify, Vercel, nginx, etc.).

Notes:
- If integrating into an existing app, copy `components/` and `App.jsx` as needed and ensure `@mui/material`, `@emotion/react`, and `@emotion/styled` are installed.

End-to-end tests (Playwright):
```bash
# one-time (install browsers)
npx playwright install

# run dev + tests
npm run test:e2e

# headed mode
npm run test:e2e:headed

# open HTML report
npm run test:e2e:report
```
The test suite covers: homepage smoke, navbar section navigation, pricing tiers and amounts, FAQ expansion, and contact form submission confirmation.*** End Patch```  ***!

