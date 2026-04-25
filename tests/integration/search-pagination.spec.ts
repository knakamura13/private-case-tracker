import { test, expect } from '@playwright/test';

/* eslint-disable security/detect-object-injection */

test.describe('search endpoint pagination', () => {
	test('search endpoint respects limit parameter', async ({ request }) => {
		// Test that the search API returns limited results
		const res = await request.get('/api/search?q=test');
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty('results');
		// Verify each entity type has limited results
		const entityTypes = ['tasks', 'forms', 'evidence', 'documents', 'questions', 'notes', 'milestones', 'quickLinks'];
		for (const type of entityTypes) {
			if (body.results[type]) {
				expect(body.results[type].length).toBeLessThanOrEqual(10); // LIMIT_PER_GROUP
			}
		}
	});

	test('export endpoint uses pagination limits', async ({ request }) => {
		// Test that the export API limits query sizes
		const res = await request.get('/api/export');
		expect(res.status()).toBe(200);
		const body = await res.json();
		// Verify export returns data structure
		expect(body).toHaveProperty('tasks');
		expect(body).toHaveProperty('forms');
		expect(body).toHaveProperty('evidence');
		// The export should have reasonable limits (5000 per entity type)
		expect(body.tasks.length).toBeLessThanOrEqual(5000);
	});
});

/* eslint-enable security/detect-object-injection */
