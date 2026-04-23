import type { ActivityAction } from '@prisma/client';
import { hashIp } from './crypto';
import { ddbPut, ddbQuery } from './dynamo/ops';
import { entitySk, wsPk } from './dynamo/keys';
import { randomUUID } from 'node:crypto';

interface LogInput {
	workspaceId: string;
	userId?: string | null;
	action: ActivityAction;
	entityType: string;
	entityId: string;
	summary: string;
	ip?: string | null;
}

export async function logActivity(input: LogInput): Promise<void> {
	const now = new Date().toISOString();
	const id = randomUUID();
	// SK is time-sortable so "recent" queries are efficient.
	const sk = `ActivityLog#${now}#${id}`;
	await ddbPut({
		PK: wsPk(input.workspaceId),
		SK: sk,
		id,
		workspaceId: input.workspaceId,
		userId: input.userId ?? null,
		action: input.action,
		entityType: input.entityType,
		entityId: input.entityId,
		summary: input.summary.slice(0, 500),
		ipHash: hashIp(input.ip),
		createdAt: now
	});
}

export async function recentActivity(workspaceId: string, limit = 20) {
	// Note: we denormalize only `userId` here. If we want name/email, we can look it up
	// from Better Auth's data store, but for now the UI can render anonymous activity.
	const rows = await ddbQuery<{
		id: string;
		createdAt: string;
		userId: string | null;
		action: ActivityAction;
		entityType: string;
		entityId: string;
		summary: string;
	}>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: {
			':pk': wsPk(workspaceId),
			':prefix': 'ActivityLog#'
		},
		ScanIndexForward: false,
		Limit: limit
	});

	return rows.map((r) => ({
		...r,
		user: r.userId ? { id: r.userId, name: null, email: null } : null
	}));
}
