import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ddbPut, ddbQuery, ddbGet } from '$lib/server/dynamo/ops';

const MAX_MESSAGE_CHARS = 2_000;
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
	const message =
		input.message.length > MAX_MESSAGE_CHARS
			? input.message.slice(0, MAX_MESSAGE_CHARS)
			: input.message;
	const stack =
		typeof input.stack === 'string' && input.stack.length > MAX_STACK_CHARS
			? input.stack.slice(0, MAX_STACK_CHARS)
			: (input.stack ?? null);

	const id = randomUUID();
	const occurredAt = new Date().toISOString();
	const pk = input.workspaceId ? `ERR#WS#${input.workspaceId}` : 'ERR#GLOBAL';
	const sk = `ErrorLog#${occurredAt}#${id}`;
	const item = {
		PK: pk,
		SK: sk,
		id,
		occurredAt,
		requestId: input.requestId ?? null,
		source: input.source,
		status: input.status ?? null,
		route: input.route ?? null,
		method: input.method ?? null,
		message,
		stack,
		userId: input.userId ?? null,
		workspaceId: input.workspaceId ?? null,
		userAgent: input.userAgent ?? null,
		context: input.context ?? null
	};
	await ddbPut(item);
	return item;
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
	const pks: string[] = [];
	if (input.workspaceId) pks.push(`ERR#WS#${input.workspaceId}`);
	if (input.includeGlobal) pks.push('ERR#GLOBAL');

	const all: Array<{
		id: string;
		occurredAt: string;
		source: LogErrorInput['source'];
		status: number | null;
		route: string | null;
		method: string | null;
		message: string;
		requestId: string | null;
		workspaceId: string | null;
	}> = [];

	for (const pk of pks) {
		const rows = await ddbQuery<any>({
			KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
			ExpressionAttributeValues: { ':pk': pk, ':prefix': 'ErrorLog#' },
			ScanIndexForward: false,
			Limit: input.limit + (input.cursor ? 1 : 0)
		});
		for (const r of rows) all.push(r);
	}

	const filtered = all
		.filter((r) => (input.status != null ? r.status === input.status : true))
		.filter((r) => (input.source ? r.source === input.source : true))
		.filter((r) =>
			input.route ? (r.route ?? '').toLowerCase().includes(input.route.toLowerCase()) : true
		)
		.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));

	const startIdx = input.cursor ? filtered.findIndex((r) => r.id === input.cursor) + 1 : 0;
	return filtered.slice(startIdx, startIdx + input.limit).map((r) => ({
		id: r.id,
		occurredAt: new Date(r.occurredAt),
		source: r.source,
		status: r.status,
		route: r.route,
		method: r.method,
		message: r.message,
		requestId: r.requestId
	}));
}

export async function getError(id: string, workspaceId: string | null, includeGlobal = false) {
	const pks: string[] = [];
	if (workspaceId) pks.push(`ERR#WS#${workspaceId}`);
	if (includeGlobal) pks.push('ERR#GLOBAL');

	for (const pk of pks) {
		const rows = await ddbQuery<any>({
			KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
			ExpressionAttributeValues: { ':pk': pk, ':prefix': 'ErrorLog#' },
			ScanIndexForward: false,
			Limit: 50
		});
		const hit = rows.find((r) => r.id === id);
		if (hit) return { ...hit, occurredAt: new Date(hit.occurredAt) };
	}

	return null;
}
