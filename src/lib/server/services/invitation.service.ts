import { randomBytes } from 'node:crypto';
import { addDays } from 'date-fns';
import { ENV } from '$lib/server/env';
import { logActivity } from '$lib/server/activity';
import type { MemberRole } from '$lib/types/enums';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbPut, ddbQuery, ddbUpdate, ddbDelete } from '$lib/server/dynamo/ops';
import { baPk, entitySk, gsi1Sk, gsi1UserPk, wsPk } from '$lib/server/dynamo/keys';
import { invalidateMembers } from '$lib/server/cache/membersCache';

export async function createInvitation(input: {
	workspaceId: string;
	email: string;
	role: MemberRole;
	invitedByUserId: string;
	inviterName: string;
	workspaceName: string;
}) {
	const token = randomBytes(32).toString('base64url');
	const now = new Date();
	const id = randomUUID();
	const invitation = {
		id,
		workspaceId: input.workspaceId,
		email: input.email.toLowerCase().trim(),
		role: input.role,
		token,
		invitedByUserId: input.invitedByUserId,
		expiresAt: addDays(now, 7).toISOString(),
		acceptedAt: null as string | null,
		createdAt: now.toISOString()
	};
	await ddbPut({
		PK: wsPk(input.workspaceId),
		SK: entitySk('Invitation', id),
		...invitation,
		workspaceName: input.workspaceName,
		GSI1PK: `INVITE#${token}`,
		GSI1SK: gsi1Sk('Invitation', id)
	});
	invalidateMembers(input.workspaceId);
	const url = `${ENV.APP_URL}/invite/${token}`;
	await logActivity({
		workspaceId: input.workspaceId,
		userId: input.invitedByUserId,
		action: 'USER_INVITED',
		entityType: 'Invitation',
		entityId: invitation.id,
		summary: `Invited ${invitation.email} as ${input.role.toLowerCase()}`
	});
	return { invitation, url };
}

export async function findActiveInvitation(token: string) {
	const now = new Date().toISOString();
	const rows = await ddbQuery<any>({
		IndexName: 'GSI1',
		KeyConditionExpression: 'GSI1PK = :pk',
		ExpressionAttributeValues: { ':pk': `INVITE#${token}` },
		Limit: 5
	});
	const hit = rows.find((r) => r.token === token && !r.acceptedAt && r.expiresAt > now);
	if (!hit) return null;
	return {
		...hit,
		expiresAt: new Date(hit.expiresAt),
		workspace: { id: hit.workspaceId, name: hit.workspaceName ?? 'Workspace' }
	};
}

export async function acceptInvitation(token: string, userId: string) {
	const now = new Date();
	const invitation = await findActiveInvitation(token);
	if (!invitation) throw new Error('Invitation not found or expired');

	// Better Auth user record is stored in DynamoDB under BA#user.
	const user = await ddbGet<any>({ PK: baPk('user'), SK: userId });
	if (!user) throw new Error('User not found');

	const membershipKey = { PK: wsPk(invitation.workspaceId), SK: entitySk('Membership', userId) };
	const existingMembership = await ddbGet<any>(membershipKey);
	const membership = {
		id: existingMembership?.id ?? randomUUID(),
		workspaceId: invitation.workspaceId,
		userId,
		role: invitation.role,
		acceptedAt: now.toISOString(),
		createdAt: existingMembership?.createdAt ?? now.toISOString(),
		GSI1PK: gsi1UserPk(userId),
		GSI1SK: gsi1Sk('Membership', invitation.workspaceId),
		workspaceName: invitation.workspace?.name ?? 'Workspace'
	};
	await ddbPut({ ...membershipKey, ...membership });
	invalidateMembers(invitation.workspaceId);

	await ddbUpdate(
		{ PK: wsPk(invitation.workspaceId), SK: entitySk('Invitation', invitation.id) },
		'SET #acceptedAt = :a',
		{ ':a': now.toISOString() },
		{ '#acceptedAt': 'acceptedAt' }
	);
	await logActivity({
		workspaceId: invitation.workspaceId,
		userId,
		action: 'INVITATION_ACCEPTED',
		entityType: 'Membership',
		entityId: membership.id,
		summary: `Accepted invitation to workspace`
	});
	return membership;
}

export async function listPendingInvitations(workspaceId: string) {
	const rows = await ddbQuery<any>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'Invitation#' }
	});
	return rows
		.filter((r) => !r.acceptedAt)
		.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
		.map((r) => ({ ...r, expiresAt: new Date(r.expiresAt) }));
}

export async function revokeInvitation(workspaceId: string, invitationId: string) {
	await ddbDelete({ PK: wsPk(workspaceId), SK: entitySk('Invitation', invitationId) });
	invalidateMembers(workspaceId);
}
