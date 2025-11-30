import { test, expect } from '@playwright/test';

async function isNearTop(page, selector: string, threshold = 150) {
  return await page.evaluate(({ selector, threshold }) => {
    const el = document.querySelector(selector);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.top <= threshold;
  }, { selector, threshold });
}

test('navbar buttons scroll to sections', async ({ page }) => {
  await page.goto('/');
  // Features
  await page.getByRole('button', { name: /Features/i }).click();
  await page.waitForTimeout(300);
  expect(await isNearTop(page, '#features')).toBeTruthy();

  // Segments
  await page.getByRole('button', { name: /Segments/i }).click();
  await page.waitForTimeout(300);
  expect(await isNearTop(page, '#segments')).toBeTruthy();

  // Pricing
  await page.getByRole('button', { name: /Pricing/i }).click();
  await page.waitForTimeout(300);
  expect(await isNearTop(page, '#pricing')).toBeTruthy();

  // How it works
  await page.getByRole('button', { name: /How it works/i }).click();
  await page.waitForTimeout(300);
  expect(await isNearTop(page, '#how')).toBeTruthy();

  // FAQ
  await page.getByRole('button', { name: /FAQ/i }).click();
  await page.waitForTimeout(300);
  expect(await isNearTop(page, '#faq')).toBeTruthy();
});


