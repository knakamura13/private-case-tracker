import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	findMany: vi.fn(),
	findFirst: vi.fn()
}));

vi.mock('$lib/server/db', () => {
	return {
		db: {
			errorLog: {
				create: mocks.create,
				findMany: mocks.findMany,
				findFirst: mocks.findFirst
			}
		}
	};
});

import { logError, listErrors, getError } from '$lib/server/services/errorLog.service';

describe('errorLog.service', () => {
	beforeEach(() => {
		mocks.create.mockReset();
		mocks.findMany.mockReset();
		mocks.findFirst.mockReset();
	});

	it('logError truncates long stacks', async () => {
		mocks.create.mockResolvedValue({ id: 'e1' });
		const longStack = 'x'.repeat(60_000);

		await logError({
			source: 'SERVER',
			message: 'boom',
			stack: longStack,
			workspaceId: 'w1'
		});

		expect(mocks.create).toHaveBeenCalled();
		const arg = mocks.create.mock.calls[0]?.[0] as any;
		expect(arg.data.stack.length).toBeLessThanOrEqual(50_000);
	});

	it('listErrors scopes by workspace', async () => {
		mocks.findMany.mockResolvedValue([]);
		await listErrors({ workspaceId: 'w1', includeGlobal: false, limit: 50 });

		expect(mocks.findMany).toHaveBeenCalled();
		const arg = mocks.findMany.mock.calls[0]?.[0] as any;
		expect(JSON.stringify(arg.where)).toContain('w1');
	});

	it('getError returns null for wrong workspace', async () => {
		mocks.findFirst.mockResolvedValue(null);
		const row = await getError('e1', 'w2', false);
		expect(row).toBeNull();
	});
});
