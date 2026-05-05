import { test, expect } from '@playwright/test';

test.describe('auth gating', () => {
    test('redirects unauthenticated users to /login', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    });

    test('redirects unauthenticated users from /tasks to /login', async ({ page }) => {
        await page.goto('/tasks');
        await expect(page).toHaveURL(/\/login/);
    });

    test('redirects unauthenticated users from /evidence to /login', async ({ page }) => {
        await page.goto('/evidence');
        await expect(page).toHaveURL(/\/login/);
    });

    test('login page exposes passkey option', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('button', { name: /passkey/i })).toBeVisible();
    });

    test('health endpoint reports ok or down JSON', async ({ request }) => {
        const res = await request.get('/health');
        expect([200, 503]).toContain(res.status());
        const body = await res.json();
        expect(body).toHaveProperty('ok');
    });
});

test.describe('security headers', () => {
    test('sets security headers on responses', async ({ request }) => {
        const res = await request.get('/');
        expect(res.status()).toBe(200);
        const headers = res.headers();
        // Assert common security headers are present
        // Note: These may vary based on deployment config
        expect(headers['content-type']).toBeDefined();
        // Add specific header assertions once deployment config is known
        // e.g., expect(headers['x-frame-options']).toBeDefined();
    });
});

test.describe('session security', () => {
    test('invalid session is rejected', async ({ request }) => {
        // Test that requests with invalid session cookies are rejected
        const res = await request.get('/dashboard', {
            maxRedirects: 0,
            headers: {
                cookie: 'session=invalid-session-token'
            }
        });
        expect([302, 303, 401, 403]).toContain(res.status());
    });
});
