import { test, expect } from '@playwright/test';

test('home loads and shows hero content', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/BuildWise AI/i);
  await expect(page.getByRole('heading', { name: /BuildWise AI/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Get in touch/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /See pricing/i })).toBeVisible();
});


