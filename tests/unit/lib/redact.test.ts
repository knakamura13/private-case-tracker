import { describe, it, expect } from 'vitest';
import {
	redactSearchParams,
	redactObject,
	redactUrl
} from '$lib/server/utils/redact';

describe('redact helpers', () => {
	describe('redactSearchParams', () => {
		it('redacts sensitive keys and preserves the rest', () => {
			const params = new URLSearchParams();
			params.set('page', '2');
			params.set('token', 'super-secret');
			params.set('apiKey', 'abc');
			params.set('name', 'Kyle');

			const out = redactSearchParams(params);
			expect(out.page).toBe('2');
			expect(out.name).toBe('Kyle');
			expect(out.token).toBe('[redacted]');
			expect(out.apiKey).toBe('[redacted]');
		});

		it('is case-insensitive on key names', () => {
			const params = new URLSearchParams();
			params.set('SESSION_ID', 'xyz');
			params.set('Password', 'pw');

			const out = redactSearchParams(params);
			expect(out.SESSION_ID).toBe('[redacted]');
			expect(out.Password).toBe('[redacted]');
		});
	});

	describe('redactObject', () => {
		it('redacts shallowly by key', () => {
			const out = redactObject({
				id: '1',
				authorization: 'Bearer xxx',
				nested: { token: 'not redacted because shallow' }
			});
			expect(out.id).toBe('1');
			expect(out.authorization).toBe('[redacted]');
			expect(out.nested).toEqual({ token: 'not redacted because shallow' });
		});
	});

	describe('redactUrl', () => {
		it('redacts sensitive query params while keeping the rest intact', () => {
			const out = redactUrl('https://example.com/path?token=abc&page=2');
			expect(out).toContain('token=%5Bredacted%5D');
			expect(out).toContain('page=2');
		});

		it('returns the input unchanged when it is not a valid URL', () => {
			expect(redactUrl('not a url')).toBe('not a url');
		});
	});
});
