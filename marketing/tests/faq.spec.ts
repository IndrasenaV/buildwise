import { test, expect } from '@playwright/test';

test('faq expands to show answers', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /FAQ/i }).click();
  await page.waitForTimeout(300);

  const q1 = page.getByRole('button', { name: /How is pricing structured\?/i });
  await q1.click();
  await expect(page.getByText(/Pricing is per home/i)).toBeVisible();

  const q2 = page.getByRole('button', { name: /What file types do you support\?/i });
  await q2.click();
  await expect(page.getByText(/Typical architectural plan formats/i)).toBeVisible();
});


