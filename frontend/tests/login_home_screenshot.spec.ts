import { test, expect } from '@playwright/test';
import { loginUI } from './helpers';

// Fill in valid credentials for your environment:
const EMAIL = 'sravya.ksr@gmail.com';
const PASSWORD = 'test1234';

test('login via UI and capture home page screenshot', async ({ page }) => {
  await loginUI(page, EMAIL, PASSWORD);
  await page.goto('/homes');
  await expect(page.getByText('Homes')).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/home-page.png', fullPage: true });
});


