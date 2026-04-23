import { describe, it, expect } from 'vitest';
import { quickLinkCreateSchema } from '$lib/schemas/quickLink';

describe('quickLinkCreateSchema', () => {
	it('prepends https for bare host', () => {
		const r = quickLinkCreateSchema.safeParse({
			url: 'example.com/path',
			title: '',
			description: '',
			notes: ''
		});
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.url).toBe('https://example.com/path');
	});

	it('accepts explicit https URL', () => {
		const r = quickLinkCreateSchema.safeParse({
			url: 'https://example.com',
			title: 'Ex',
			description: '',
			notes: ''
		});
		expect(r.success).toBe(true);
		if (r.success) {
			expect(r.data.url).toBe('https://example.com');
			expect(r.data.title).toBe('Ex');
		}
	});

	it('rejects javascript URLs', () => {
		const r = quickLinkCreateSchema.safeParse({
			url: 'javascript:alert(1)',
			description: '',
			notes: ''
		});
		expect(r.success).toBe(false);
	});

	it('rejects non-http(s) protocols', () => {
		const r = quickLinkCreateSchema.safeParse({
			url: 'ftp://example.com',
			description: '',
			notes: ''
		});
		expect(r.success).toBe(false);
	});

	it('coerces empty title to null', () => {
		const r = quickLinkCreateSchema.safeParse({
			url: 'https://a.test',
			title: '   ',
			description: '',
			notes: ''
		});
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.title).toBeNull();
	});
});
