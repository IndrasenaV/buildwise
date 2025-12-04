import { test, expect } from '@playwright/test';
import { stubApi, loginUI } from './helpers';

test('Task guidance demo: show trade tasks and quality checks', async ({ page }) => {
  await stubApi(page, {
    'POST /api/auth/login': { body: { token: 'stub-token', user: { email: 'demo@builder.com' } } },
    'GET /api/my/homes': { body: [] },
    'GET /api/homes/h-tasks': {
      body: {
        _id: 'h-tasks',
        name: 'Tasks Demo Home',
        trades: [
          {
            _id: 'b2',
            name: 'Electrical',
            phaseKeys: ['interior'],
            tasks: [
              { _id: 'tsk1', title: 'Rough-in wiring', phaseKey: 'interior', status: 'done' },
              { _id: 'tsk2', title: 'Install fixtures', phaseKey: 'interior', status: 'todo' },
              { _id: 'tsk3', title: 'Panel labeling', phaseKey: 'interior', status: 'todo' }
            ],
            qualityChecks: [
              { _id: 'qc1', phaseKey: 'interior', title: 'Arc-fault/GFCI compliance', accepted: false }
            ],
            invoices: [],
            attachments: []
          }
        ],
        documents: [],
        schedules: []
      }
    },
    'GET /api/homes/h-tasks/messages?tradeId=b2&limit=50': { body: [] },
    '*': { body: {} }
  });
  await loginUI(page);
  await page.goto('/homes/h-tasks/trades/b2');
  await expect(page.getByText('Work')).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/tasks-work-tab.png', fullPage: true });
  // Switch to Quality Checks tab and capture
  await page.locator('[role=\"tab\"]').nth(1).click();
  await page.screenshot({ path: 'tests/screenshots/quality-checks.png', fullPage: true });
});


