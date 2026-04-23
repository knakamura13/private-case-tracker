import { logActivity } from '$lib/server/activity';
import type { MemberRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ddbPut, ddbGet, ddbQuery, ddbUpdate, ddbDelete } from '$lib/server/dynamo/ops';
import { entitySk, gsi1Sk, gsi1UserPk, wsPk } from '$lib/server/dynamo/keys';

export async function createWorkspace(input: { name: string; ownerUserId: string }) {
	const now = new Date().toISOString();
	const workspaceId = randomUUID();
	const ws = {
		id: workspaceId,
		name: input.name,
		ownerId: input.ownerUserId,
		evidenceTargets: null as any,
		createdAt: now,
		updatedAt: now
	};

	await ddbPut({
		PK: wsPk(workspaceId),
		SK: entitySk('Workspace', workspaceId),
		...ws
	});
	// Singleton marker used by onboarding to detect "first workspace created".
	await ddbPut({ PK: 'WS_INDEX', SK: `Workspace#${workspaceId}` });

	await ddbPut({
		PK: wsPk(workspaceId),
		SK: entitySk('Membership', input.ownerUserId),
		id: randomUUID(),
		workspaceId,
		userId: input.ownerUserId,
		role: 'OWNER' as const,
		acceptedAt: now,
		createdAt: now,
		GSI1PK: gsi1UserPk(input.ownerUserId),
		GSI1SK: gsi1Sk('Membership', workspaceId),
		workspaceName: ws.name
	});
	await logActivity({
		workspaceId: ws.id,
		userId: input.ownerUserId,
		action: 'WORKSPACE_UPDATED',
		entityType: 'Workspace',
		entityId: ws.id,
		summary: `Workspace "${ws.name}" created`
	});
	return ws;
}

export async function getMembership(workspaceId: string, userId: string) {
	return ddbGet<{
		workspaceId: string;
		userId: string;
		role: MemberRole;
		acceptedAt: string | null;
	}>({
		PK: wsPk(workspaceId),
		SK: entitySk('Membership', userId)
	});
}

export async function listMembers(workspaceId: string) {
	const rows = await ddbQuery<any>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'Membership#' }
	});
	// We no longer have a relational join to user; return userId only.
	return rows
		.map((r) => ({
			id: r.id ?? `${r.workspaceId}:${r.userId}`,
			workspaceId: r.workspaceId,
			userId: r.userId,
			role: r.role,
			acceptedAt: r.acceptedAt ? new Date(r.acceptedAt) : null,
			createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
			user: { id: r.userId, email: '', name: null, image: null, createdAt: new Date() }
		}))
		.sort((a, b) =>
			a.role === b.role
				? a.createdAt.getTime() - b.createdAt.getTime()
				: a.role.localeCompare(b.role)
		);
}

export async function changeRole(workspaceId: string, userId: string, role: MemberRole) {
	return ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk('Membership', userId) },
		'SET #role = :r',
		{ ':r': role },
		{ '#role': 'role' }
	);
}

export async function removeMember(workspaceId: string, userId: string) {
	await ddbDelete({ PK: wsPk(workspaceId), SK: entitySk('Membership', userId) });
}

export async function renameWorkspace(workspaceId: string, name: string, actorId: string) {
	const updated =
		(await ddbUpdate<any>(
			{ PK: wsPk(workspaceId), SK: entitySk('Workspace', workspaceId) },
			'SET #name = :n, #updatedAt = :u',
			{ ':n': name, ':u': new Date().toISOString() },
			{ '#name': 'name', '#updatedAt': 'updatedAt' }
		)) ?? null;
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'WORKSPACE_UPDATED',
		entityType: 'Workspace',
		entityId: workspaceId,
		summary: `Renamed workspace to "${name}"`
	});
	return updated;
}

export async function deleteWorkspace(workspaceId: string) {
	// Minimal delete: remove workspace root item. (Full cleanup can be added later.)
	await ddbDelete({ PK: wsPk(workspaceId), SK: entitySk('Workspace', workspaceId) });
}
