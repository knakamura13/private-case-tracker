import { describe, it, expect } from 'vitest';
import { encryptString, decryptString, maskReceiptNumber, hashIp } from '$lib/server/crypto';

describe('crypto', () => {
	it('round-trips strings via AES-GCM', () => {
		const plaintext = 'IOE1234567890';
		const ciphertext = encryptString(plaintext);
		expect(ciphertext).not.toContain(plaintext);
		expect(ciphertext.split('.')).toHaveLength(3);
		expect(decryptString(ciphertext)).toBe(plaintext);
	});

	it('produces a different ciphertext on each encryption (random IV)', () => {
		const a = encryptString('hello world');
		const b = encryptString('hello world');
		expect(a).not.toBe(b);
		expect(decryptString(a)).toBe('hello world');
		expect(decryptString(b)).toBe('hello world');
	});

	it('rejects malformed payloads', () => {
		expect(() => decryptString('not-a-real-payload')).toThrow();
	});
});

describe('maskReceiptNumber', () => {
	it('masks the middle while keeping prefix and last 4', () => {
		expect(maskReceiptNumber('IOE1234567890')).toBe('IOE••••••7890');
	});

	it('handles short inputs', () => {
		expect(maskReceiptNumber('ABC')).toBe('ABC');
		expect(maskReceiptNumber('ABCDE')).toBe('ABC••');
	});

	it('strips whitespace before masking', () => {
		expect(maskReceiptNumber(' IOE 123 4567 890 ')).toBe('IOE••••••7890');
	});
});

describe('hashIp', () => {
	it('returns null for empty input', () => {
		expect(hashIp(null)).toBeNull();
		expect(hashIp(undefined)).toBeNull();
	});

	it('produces deterministic 16-char hashes', () => {
		const a = hashIp('1.2.3.4')!;
		const b = hashIp('1.2.3.4')!;
		expect(a).toBe(b);
		expect(a).toHaveLength(16);
		expect(hashIp('5.6.7.8')).not.toBe(a);
	});
});
