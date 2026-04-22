import { test, expect } from '@playwright/test';

test.describe('auth gating', () => {
	test('redirects unauthenticated users to /login', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login/);
		await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
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
