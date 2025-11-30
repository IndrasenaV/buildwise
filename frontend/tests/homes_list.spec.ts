import { test, expect } from '@playwright/test';
import { seedAuth, stubApi } from './helpers';

test('homes list shows tiles and capture screenshot', async ({ page }) => {
  await seedAuth(page);
  await stubApi(page, {
    'GET /api/my/homes': {
      body: [
        { _id: 'h1', name: 'Lakeview Residence', address: '12 Lakeside Ave' },
        { _id: 'h2', name: 'Modern Loft', address: '22 Union St' },
        { _id: 'h3', name: 'Townhome Model A', address: '45 Birch Rd' }
      ]
    },
    '*': { body: {} }
  });
  await page.goto('/homes');
  await expect(page.getByText('Homes')).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/homes-list.png', fullPage: true });
});


