import { beforeEach, describe, expect, it } from 'vitest';

import { ddbGet, ddbPut, ddbQueryAll, ddbUpdate } from '$lib/server/dynamo/ops';

function resetMem() {
    (globalThis as unknown as { __ddbMem?: Map<string, unknown> }).__ddbMem = new Map();
}

describe('dynamo ops', () => {
    beforeEach(resetMem);

    it('queries every page instead of returning only the first limited page', async () => {
        await ddbPut({ PK: 'PAGED', SK: 'A', createdAt: 'now', updatedAt: 'now' });
        await ddbPut({ PK: 'PAGED', SK: 'B', createdAt: 'now', updatedAt: 'now' });
        await ddbPut({ PK: 'PAGED', SK: 'C', createdAt: 'now', updatedAt: 'now' });

        const rows = await ddbQueryAll<{ SK: string }>({
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: { ':pk': 'PAGED' },
            Limit: 1
        });

        expect(rows.map((r) => r.SK).sort()).toEqual(['A', 'B', 'C']);
    });

    it('rejects conditional updates when the target item does not exist', async () => {
        await expect(
            ddbUpdate(
                { PK: 'MISSING', SK: 'ROW' },
                'SET #updatedAt = :u',
                { ':u': 'later' },
                { '#updatedAt': 'updatedAt' },
                { ConditionExpression: 'attribute_exists(PK) AND attribute_exists(SK)' }
            )
        ).rejects.toThrow('ConditionalCheckFailed');

        await expect(ddbGet({ PK: 'MISSING', SK: 'ROW' })).resolves.toBeUndefined();
    });
});
