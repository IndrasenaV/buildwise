import { test, expect } from '@playwright/test';

test('contact form submits and shows confirmation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Get in touch/i }).click();
  await page.waitForTimeout(300);

  await page.getByLabel('Name').fill('Test User');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Company').fill('Example Co');
  await page.getByLabel('Segment').click();
  await page.getByRole('option', { name: 'Custom High‑End' }).click();
  await page.getByLabel('Pricing mode').click();
  await page.getByRole('option', { name: /Per home • monthly/i }).click();
  await page.getByLabel('Homes / year').fill('5');
  await page.getByLabel('Message').fill('Interested in a demo.');

  await page.getByRole('button', { name: /^Send$/ }).click();
  await expect(page.getByText(/Thanks! We received your message/i)).toBeVisible();
});


