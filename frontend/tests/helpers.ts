import { Page, Route } from '@playwright/test';

const API_BASE_RE = /\/api(\/|$)/;

export async function seedAuth(page: Page, email = 'demo@buildwise.ai') {
  await page.addInitScript((mail) => {
    try {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('userEmail', mail as string);
    } catch {}
  }, email);
}

export async function stubApi(page: Page, handlers: Record<string, any>) {
  await page.route('**/*', async (route: Route) => {
    const url = new URL(route.request().url());
    if (!API_BASE_RE.test(url.pathname)) {
      return route.continue();
    }
    const path = url.pathname.replace(/.*\/api/, '/api');
    const method = route.request().method();
    const key = `${method} ${path}`;
    const handler = handlers[key] || handlers[path] || handlers['*'];
    if (handler) {
      const res = typeof handler === 'function' ? await handler({ url, route }) : handler;
      return route.fulfill({
        status: res.status ?? 200,
        contentType: 'application/json',
        body: JSON.stringify(res.body ?? res),
      });
    }
    return route.fulfill({ status: 404, contentType: 'text/plain', body: 'stub: not found' });
  });
}


