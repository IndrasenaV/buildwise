// @ts-check
import { defineConfig, devices } from '@playwright/test';

// Optional HTTP Basic Auth for environments that require it
const httpUser = process.env.HTTP_USERNAME || process.env.PLAYWRIGHT_HTTP_USERNAME || process.env.E2E_HTTP_USER || '';
const httpPass = process.env.HTTP_PASSWORD || process.env.PLAYWRIGHT_HTTP_PASSWORD || process.env.E2E_HTTP_PASS || '';
const httpCredentials = httpUser && httpPass ? { username: httpUser, password: httpPass } : undefined;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5173/app',
    trace: 'on-first-retry',
    httpCredentials
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/app',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  },
  projects: [
    { name: 'chrome-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chrome-mobile', use: { ...devices['Pixel 5'] } }
  ]
});


