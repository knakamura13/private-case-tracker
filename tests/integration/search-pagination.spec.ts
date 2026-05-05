import { test, expect } from '@playwright/test';

test.describe('search endpoint pagination', () => {
    test('search endpoint rejects unauthenticated requests', async ({ request }) => {
        const res = await request.get('/api/search?q=test');
        expect(res.status()).toBe(401);
    });

    test('export endpoint rejects unauthenticated requests', async ({ request }) => {
        const res = await request.get('/api/export');
        expect(res.status()).toBe(401);
    });
});
