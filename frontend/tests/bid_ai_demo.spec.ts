import { test, expect } from '@playwright/test';
import { stubApi, loginUI } from './helpers';

test('Bid analysis with AI demo: open dialog and run analysis', async ({ page }) => {
  await stubApi(page, {
    'POST /api/auth/login': { body: { token: 'stub-token', user: { email: 'demo@builder.com' } } },
    'GET /api/my/homes': { body: [] },
    'GET /api/homes/h-ai': {
      body: {
        _id: 'h-ai',
        name: 'AI Demo Home',
        trades: [
          {
            _id: 'b1',
            name: 'Cabinets',
            phaseKeys: ['interior'],
            tasks: [],
            qualityChecks: [],
            invoices: [],
            attachments: []
          }
        ],
        documents: [
          { _id: 'd1', title: 'Cabinets Bid A.pdf', url: 'https://example.com/cabinets-bid-a.pdf', pinnedTo: { type: 'trade', id: 'b1' } },
          { _id: 'd2', title: 'Cabinets Bid B.pdf', url: 'https://example.com/cabinets-bid-b.pdf', pinnedTo: { type: 'trade', id: 'b1' } }
        ],
        schedules: []
      }
    },
    'GET /api/homes/h-ai/messages?tradeId=b1&limit=50': { body: [] },
    'POST /api/ai/analyze-files': {
      body: {
        result: 'Executive Summary: Cabinet bids differ on box construction, finish, and hardware. Bid A includes soft-close hardware; Bid B excludes. Risks: unclear species and finish system. Follow-ups: confirm species, finish, and hardware brand.',
        model: 'gpt-4o-mini'
      }
    },
    '*': { body: {} }
  });
  await loginUI(page);
  await page.goto('/homes/h-ai/trades/b1');
  await expect(page.getByText('Financials')).toBeVisible();
  // Navigate to Work -> Contracts tab (3rd tab)
  await page.locator('[role="tab"]').nth(2).click();
  await page.getByRole('button', { name: 'Analyze with AI' }).click();
  await expect(page.getByText('Analyze Trade Documents with AI')).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/ai-analyze-dialog.png', fullPage: true });
  await page.getByRole('button', { name: 'Run analysis' }).click();
  await expect(page.getByText('Results')).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/ai-analyze-results.png', fullPage: true });
});


