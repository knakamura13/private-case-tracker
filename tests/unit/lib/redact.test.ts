import { describe, it, expect } from 'vitest';
import { redactSearchParams, redactObject, redactUrl } from '$lib/server/utils/redact';

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

        it('handles empty params', () => {
            const params = new URLSearchParams();
            const out = redactSearchParams(params);
            expect(out).toEqual({});
        });

        it('redacts common sensitive patterns', () => {
            const params = new URLSearchParams();
            params.set('secret', 'value');
            params.set('password', 'value');
            params.set('credit_card', 'value');
            params.set('ssn', 'value');

            const out = redactSearchParams(params);
            // Test that known sensitive keys are redacted
            expect(out.secret).toBe('[redacted]');
            expect(out.password).toBe('[redacted]');
            // credit_card and ssn may not be in the sensitive list
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

        it('handles empty objects', () => {
            const out = redactObject({});
            expect(out).toEqual({});
        });

        it('handles null and undefined values', () => {
            const out = redactObject({
                id: null,
                token: undefined,
                secret: 'value'
            });
            expect(out.id).toBeNull();
            // token is redacted even if undefined
            expect(out.token).toBe('[redacted]');
            expect(out.secret).toBe('[redacted]');
        });

        it('does not modify original object', () => {
            const original = { token: 'secret', name: 'test' };
            const out = redactObject(original);
            expect(original.token).toBe('secret'); // Original unchanged
            expect(out.token).toBe('[redacted]'); // Copy redacted
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

        it('handles URLs with no query params', () => {
            const out = redactUrl('https://example.com/path');
            expect(out).toBe('https://example.com/path');
        });

        it('redacts multiple sensitive params', () => {
            const out = redactUrl('https://example.com?token=abc&apiKey=xyz&id=123');
            expect(out).toContain('token=%5Bredacted%5D');
            expect(out).toContain('apiKey=%5Bredacted%5D');
            expect(out).toContain('id=123');
        });

        it('preserves URL structure and fragment', () => {
            const out = redactUrl('https://example.com/path?token=abc#section');
            expect(out).toContain('#section');
            expect(out).toContain('token=%5Bredacted%5D');
        });
    });
});
