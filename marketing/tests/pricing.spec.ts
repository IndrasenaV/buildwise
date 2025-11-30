import { test, expect } from '@playwright/test';

test('pricing shows correct plans and prices', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Pricing/i }).click();
  await page.waitForTimeout(300);

  // Guide
  await expect(page.getByText('Guide', { exact: true })).toBeVisible();
  await expect(page.getByText('$99/month/home')).toBeVisible();

  // AI Assurance
  await expect(page.getByText('AI Assurance', { exact: true })).toBeVisible();
  await expect(page.getByText('$299/month/home')).toBeVisible();

  // Concierge
  await expect(page.getByText('Concierge', { exact: true })).toBeVisible();
  await expect(page.getByText('Talk to sales')).toBeVisible();
});


