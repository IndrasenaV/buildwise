import { test, expect } from '@playwright/test';
import { seedAuth, stubApi } from './helpers';

test('trades table displays progress and capture screenshot', async ({ page }) => {
  await seedAuth(page);
  await stubApi(page, {
    'GET /api/homes/h1': {
      body: {
        _id: 'h1',
        name: 'Lakeview Residence',
        trades: [
          {
            _id: 't1',
            name: 'Framing',
            vendor: { name: 'FrameCo' },
            phaseKeys: ['preconstruction', 'exterior'],
            tasks: [{ status: 'done' }, { status: 'done' }, { status: 'todo' }]
          },
          {
            _id: 't2',
            name: 'Electrical',
            vendor: { name: 'VoltMasters' },
            phaseKeys: ['interior'],
            tasks: [{ status: 'todo' }, { status: 'todo' }]
          },
          {
            _id: 't3',
            name: 'Plumbing',
            vendor: { name: 'PipePros' },
            phaseKeys: ['interior'],
            tasks: [{ status: 'done' }, { status: 'todo' }, { status: 'todo' }, { status: 'done' }]
          }
        ]
      }
    },
    '*': { body: {} }
  });
  await page.goto('/homes/h1/trades');
  await expect(page.getByText('Trades')).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/trades-table.png', fullPage: true });
});


