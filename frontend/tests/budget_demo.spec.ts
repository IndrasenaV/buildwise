import { test, expect } from '@playwright/test';
import { stubApi, loginUI } from './helpers';

test('Budget demo: show pricing and invoices summary', async ({ page }) => {
  await stubApi(page, {
    'POST /api/auth/login': { body: { token: 'stub-token', user: { email: 'demo@builder.com' } } },
    'GET /api/my/homes': { body: [] },
    'GET /api/homes/h-demo': {
      body: {
        _id: 'h-demo',
        name: 'Showcase Home',
        trades: [
          { _id: 't1', name: 'Framing', totalPrice: 45000, invoices: [{ _id: 'i1', label: 'Deposit', amount: 10000, paid: true }] },
          { _id: 't2', name: 'Electrical', totalPrice: 28000, invoices: [{ _id: 'i2', label: 'Rough-in', amount: 12000, paid: false }] },
          { _id: 't3', name: 'Plumbing', totalPrice: 22000, invoices: [{ _id: 'i3', label: 'Final', amount: 8000, paid: false }] }
        ],
        documents: [],
        schedules: []
      }
    },
    '*': { body: {} }
  });
  await loginUI(page);
  await page.goto('/homes/h-demo/budget');
  await expect(page.getByText('Budget')).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/budget-overview.png', fullPage: true });
});


