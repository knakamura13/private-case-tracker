import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity';
import type { MemberRole } from '@prisma/client';

export async function createWorkspace(input: { name: string; ownerUserId: string }) {
	const ws = await db.$transaction(async (tx) => {
		const workspace = await tx.workspace.create({
			data: {
				name: input.name,
				ownerId: input.ownerUserId
			}
		});
		await tx.membership.create({
			data: {
				workspaceId: workspace.id,
				userId: input.ownerUserId,
				role: 'OWNER',
				acceptedAt: new Date()
			}
		});
		return workspace;
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
	return db.membership.findUnique({
		where: { workspaceId_userId: { workspaceId, userId } }
	});
}

export async function listMembers(workspaceId: string) {
	return db.membership.findMany({
		where: { workspaceId },
		include: {
			user: { select: { id: true, email: true, name: true, image: true, createdAt: true } }
		},
		orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]
	});
}

export async function changeRole(workspaceId: string, userId: string, role: MemberRole) {
	return db.membership.update({
		where: { workspaceId_userId: { workspaceId, userId } },
		data: { role }
	});
}

export async function removeMember(workspaceId: string, userId: string) {
	return db.membership.delete({
		where: { workspaceId_userId: { workspaceId, userId } }
	});
}

export async function renameWorkspace(workspaceId: string, name: string, actorId: string) {
	const updated = await db.workspace.update({ where: { id: workspaceId }, data: { name } });
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
	await db.workspace.delete({ where: { id: workspaceId } });
}
