import type { ActivityAction } from '@prisma/client';
import { db } from './db';
import { hashIp } from './crypto';

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
	await db.activityLog.create({
		data: {
			workspaceId: input.workspaceId,
			userId: input.userId ?? null,
			action: input.action,
			entityType: input.entityType,
			entityId: input.entityId,
			summary: input.summary.slice(0, 500),
			ipHash: hashIp(input.ip)
		}
	});
}

export async function recentActivity(workspaceId: string, limit = 20) {
	return db.activityLog.findMany({
		where: { workspaceId },
		include: { user: { select: { id: true, name: true, email: true } } },
		orderBy: { createdAt: 'desc' },
		take: limit
	});
}
