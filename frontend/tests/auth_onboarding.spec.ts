import { test, expect } from '@playwright/test';
import { stubApi } from './helpers';

test('login to onboarding and capture screenshots', async ({ page }) => {
  await stubApi(page, {
    'POST /api/auth/login': { body: { token: 'stub-token', user: { email: 'demo@builder.com' } } },
    'GET /api/my/homes': { body: [] },
    'GET /api/templates': { body: [] },
    'GET /api/people': { body: [] },
    '*': { body: {} }
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Home Tracker' })).toBeVisible();
  await page.getByLabel('Email').fill('demo@builder.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/onboarding$/);

  // Screenshot of Onboarding Step 1 (Home Details)
  await page.screenshot({ path: 'tests/screenshots/onboarding-step1.png', fullPage: true });

  // Step 1 minimal valid input to enable Next
  await page.getByLabel('Home Name').fill('Marketing Showcase Home');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.screenshot({ path: 'tests/screenshots/onboarding-step2.png', fullPage: true });
});


