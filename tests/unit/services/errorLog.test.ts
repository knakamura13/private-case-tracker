import { describe, it, expect, beforeEach } from 'vitest';

import { logError, listErrors, getError } from '$lib/server/services/errorLog.service';

describe('errorLog.service', () => {
    beforeEach(() => {
        // Reset in-memory DynamoDB between tests.
        (globalThis as unknown as { __ddbMem?: Map<string, unknown> }).__ddbMem = new Map();
    });

    it('logError truncates long stacks', async () => {
        const longStack = 'x'.repeat(60_000);

        const row = await logError({
            source: 'SERVER',
            message: 'boom',
            stack: longStack,
            workspaceId: 'w1'
        });

        expect(row.stack?.length).toBeLessThanOrEqual(50_000);
    });

    it('logError truncates long messages', async () => {
        const longMessage = 'm'.repeat(5_000);

        const row = await logError({ source: 'CLIENT', message: longMessage, workspaceId: 'w1' });

        expect(row.message.length).toBeLessThanOrEqual(2_000);
    });

    it('listErrors scopes by workspace', async () => {
        await logError({ source: 'SERVER', message: 'w1', workspaceId: 'w1' });
        await logError({ source: 'SERVER', message: 'w2', workspaceId: 'w2' });
        await logError({ source: 'SERVER', message: 'global', workspaceId: null });

        const rows = await listErrors({ workspaceId: 'w1', includeGlobal: false, limit: 50 });
        expect(rows.length).toBe(1);
        expect(rows[0]?.message).toContain('w1');
    });

    it('getError returns null for wrong workspace', async () => {
        const created = await logError({ source: 'SERVER', message: 'boom', workspaceId: 'w1' });
        const row = await getError(created.id, 'w2', false);
        expect(row).toBeNull();
    });
});
