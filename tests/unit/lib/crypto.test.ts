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

	it('handles special characters and unicode', () => {
		const plaintext = 'Hello 世界 🌍 !@#$%';
		const ciphertext = encryptString(plaintext);
		expect(decryptString(ciphertext)).toBe(plaintext);
	});

	it('handles very long strings', () => {
		const plaintext = 'a'.repeat(10000);
		const ciphertext = encryptString(plaintext);
		expect(decryptString(ciphertext)).toBe(plaintext);
	});

	it('rejects tampered ciphertext', () => {
		const ciphertext = encryptString('secret');
		// Replace the first character with a different one to ensure tampering
		const tampered = ciphertext.replace(ciphertext[0], ciphertext[0] === 'A' ? 'B' : 'A');
		expect(() => decryptString(tampered)).toThrow();
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

	it('handles IPv6 addresses', () => {
		const hash = hashIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
		expect(hash).not.toBeNull();
		expect(hash).toHaveLength(16);
	});

	it('handles malformed IP addresses gracefully', () => {
		const hash = hashIp('not-an-ip');
		expect(hash).not.toBeNull(); // Still hashes the string
		expect(hash).toHaveLength(16);
	});

	it('hashes are not reversible', () => {
		const hash = hashIp('192.168.1.1')!;
		expect(hash).not.toContain('192');
		expect(hash).not.toContain('168');
	});
});
