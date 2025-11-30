import { test, expect } from '@playwright/test';
import { seedAuth, stubApi } from './helpers';

test('onboarding wizard with template and people, capture each step', async ({ page }) => {
  await seedAuth(page);
  const templates = [
    { _id: 'tpl-v2', templateKey: 'CustomHome', name: 'Custom Home v2', version: 2, status: 'frozen', description: 'Premium custom build' },
    { _id: 'tpl-v1', templateKey: 'CustomHome', name: 'Custom Home v1', version: 1, status: 'draft', description: 'Initial draft' }
  ];
  const people = [
    { fullName: 'Alex Client', email: 'alex.client@example.com', phone: '555-0100' },
    { fullName: 'Mia Monitor', email: 'mia.monitor@example.com', phone: '555-0101' },
    { fullName: 'Sam Builder', email: 'sam.builder@example.com', phone: '555-0120' }
  ];
  await stubApi(page, {
    'GET /api/templates': { body: templates },
    'GET /api/people': { body: people },
    'GET /api/people?role=builder': { body: [people[2]] },
    'POST /api/onboarding': { body: { home: { _id: 'h-onboarded' } } },
    '*': { body: {} }
  });

  await page.goto('/onboarding');
  await page.screenshot({ path: 'tests/screenshots/onboarding-1-details.png', fullPage: true });

  // Step 1
  await page.getByLabel('Home Name').fill('Showcase Home');
  await page.getByText('Custom Home v2').click();
  await page.screenshot({ path: 'tests/screenshots/onboarding-1-details-selected.png', fullPage: true });
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 2
  await page.getByLabel('Select Existing Client').fill('Alex Client');
  await page.getByRole('option', { name: /Alex Client/ }).click();
  await page.getByLabel('Select Monitors').fill('Mia Monitor');
  await page.getByRole('option', { name: /Mia Monitor/ }).click();
  await page.screenshot({ path: 'tests/screenshots/onboarding-2-people.png', fullPage: true });
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 3
  await page.getByLabel('Select Existing Builder').fill('Sam Builder');
  await page.getByRole('option', { name: /Sam Builder/ }).click();
  await page.screenshot({ path: 'tests/screenshots/onboarding-3-builder.png', fullPage: true });
  await page.getByRole('button', { name: 'Create Home' }).click();

  await expect(page).toHaveURL(/\/homes\/h-onboarded/);
});


