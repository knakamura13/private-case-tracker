import { randomBytes } from 'node:crypto';
import { addDays } from 'date-fns';
import { db } from '$lib/server/db';
import { ENV } from '$lib/server/env';
import { logActivity } from '$lib/server/activity';
import { sendEmail, inviteEmail } from '$lib/server/email';
import type { MemberRole } from '@prisma/client';

export async function createInvitation(input: {
	workspaceId: string;
	email: string;
	role: MemberRole;
	invitedByUserId: string;
	inviterName: string;
	workspaceName: string;
}) {
	const token = randomBytes(32).toString('base64url');
	const invitation = await db.invitation.create({
		data: {
			workspaceId: input.workspaceId,
			email: input.email.toLowerCase().trim(),
			role: input.role,
			token,
			invitedByUserId: input.invitedByUserId,
			expiresAt: addDays(new Date(), 7)
		}
	});
	const url = `${ENV.APP_URL}/invite/${token}`;
	await sendEmail(
		inviteEmail({
			to: invitation.email,
			inviter: input.inviterName,
			workspace: input.workspaceName,
			url
		})
	);
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
	const now = new Date();
	return db.invitation.findFirst({
		where: { token, acceptedAt: null, expiresAt: { gt: now } },
		include: { workspace: true }
	});
}

export async function acceptInvitation(token: string, userId: string) {
	const now = new Date();
	const invitation = await db.invitation.findFirst({
		where: { token, acceptedAt: null, expiresAt: { gt: now } }
	});
	if (!invitation) throw new Error('Invitation not found or expired');

	const user = await db.user.findUnique({ where: { id: userId } });
	if (!user) throw new Error('User not found');
	if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
		throw new Error(
			`This invitation was sent to ${invitation.email}. Sign in with that account to accept.`
		);
	}

	const membership = await db.$transaction(async (tx) => {
		const m = await tx.membership.upsert({
			where: {
				workspaceId_userId: { workspaceId: invitation.workspaceId, userId }
			},
			create: {
				workspaceId: invitation.workspaceId,
				userId,
				role: invitation.role,
				acceptedAt: now
			},
			update: { acceptedAt: now, role: invitation.role }
		});
		await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: now } });
		return m;
	});
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
	return db.invitation.findMany({
		where: { workspaceId, acceptedAt: null },
		orderBy: { createdAt: 'desc' }
	});
}

export async function revokeInvitation(workspaceId: string, invitationId: string) {
	return db.invitation.delete({ where: { id: invitationId, workspaceId } });
}
