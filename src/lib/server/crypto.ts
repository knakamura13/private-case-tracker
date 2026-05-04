import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { ENV } from './env';

const ALG = 'aes-256-gcm';

function key(): Buffer {
    const buf = Buffer.from(ENV.FIELD_ENCRYPTION_KEY, 'base64');
    if (buf.length !== 32) {
        throw new Error('FIELD_ENCRYPTION_KEY must be a base64-encoded 32-byte key. Generate with: openssl rand -base64 32');
    }
    return buf;
}

export function encryptString(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALG, key(), iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

export function decryptString(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed ciphertext');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = createDecipheriv(ALG, key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function maskReceiptNumber(rn: string): string {
    const trimmed = rn.replace(/\s+/g, '');
    if (trimmed.length <= 7) return trimmed.slice(0, 3) + '•'.repeat(Math.max(0, trimmed.length - 3));
    const prefix = trimmed.slice(0, 3);
    const tail = trimmed.slice(-4);
    return `${prefix}${'•'.repeat(trimmed.length - 7)}${tail}`;
}

export function hashIp(ip: string | null | undefined): string | null {
    if (!ip) return null;
    return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}
