import type { Prisma } from '@prisma/client';
import { db } from '$lib/server/db';

const MAX_STACK_CHARS = 50_000;

export type LogErrorInput = {
	requestId?: string | null;
	source: 'SERVER' | 'CLIENT' | 'ACTION' | 'API';
	status?: number | null;
	route?: string | null;
	method?: string | null;
	message: string;
	stack?: string | null;
	userId?: string | null;
	workspaceId?: string | null;
	userAgent?: string | null;
	context?: Prisma.InputJsonValue;
};

export async function logError(input: LogErrorInput) {
	const stack =
		typeof input.stack === 'string' && input.stack.length > MAX_STACK_CHARS
			? input.stack.slice(0, MAX_STACK_CHARS)
			: input.stack ?? null;

	return db.errorLog.create({
		data: {
			requestId: input.requestId ?? null,
			source: input.source,
			status: input.status ?? null,
			route: input.route ?? null,
			method: input.method ?? null,
			message: input.message,
			stack,
			userId: input.userId ?? null,
			workspaceId: input.workspaceId ?? null,
			userAgent: input.userAgent ?? null,
			context: input.context ?? undefined
		}
	});
}

export type ListErrorsInput = {
	workspaceId: string | null;
	includeGlobal?: boolean;
	limit: number;
	cursor?: string;
	status?: number;
	source?: LogErrorInput['source'];
	route?: string;
};

export async function listErrors(input: ListErrorsInput) {
	const workspaceWhere: Prisma.ErrorLogWhereInput = input.workspaceId
		? input.includeGlobal
			? { OR: [{ workspaceId: input.workspaceId }, { workspaceId: null }] }
			: { workspaceId: input.workspaceId }
		: input.includeGlobal
			? { workspaceId: null }
			: { workspaceId: '__never__' };

	const where: Prisma.ErrorLogWhereInput = {
		AND: [
			workspaceWhere,
			input.status != null ? { status: input.status } : {},
			input.source ? { source: input.source } : {},
			input.route ? { route: { contains: input.route, mode: 'insensitive' } } : {}
		]
	};

	const rows = await db.errorLog.findMany({
		where,
		orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
		take: input.limit,
		skip: input.cursor ? 1 : 0,
	cursor: input.cursor ? { id: input.cursor } : undefined,
	select: {
		id: true,
		occurredAt: true,
		source: true,
		status: true,
		route: true,
		method: true,
		message: true,
		requestId: true
	}
});

	return rows;
}

export async function getError(id: string, workspaceId: string | null, includeGlobal = false) {
	const where: Prisma.ErrorLogWhereInput = {
		id,
		AND: [
			workspaceId
				? includeGlobal
					? { OR: [{ workspaceId }, { workspaceId: null }] }
					: { workspaceId }
				: includeGlobal
					? { workspaceId: null }
					: { workspaceId: '__never__' }
		]
	};

	return db.errorLog.findFirst({ where });
}
