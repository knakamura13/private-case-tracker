import { db } from './db';

export const DEV_USER = {
	id: 'dev_user_local',
	email: 'dev@localhost',
	name: 'Dev User',
	image: null
} as const;

export const DEV_WORKSPACE = {
	id: 'dev_workspace_local',
	name: 'Dev Workspace',
	role: 'OWNER' as const
};

export const DEV_SESSION = {
	id: 'dev_session_local',
	expiresAt: new Date('2099-01-01T00:00:00Z')
};

let seeded = false;

export async function ensureDevUserSeeded(): Promise<void> {
	if (seeded) return;
	await db.user.upsert({
		where: { id: DEV_USER.id },
		create: {
			id: DEV_USER.id,
			email: DEV_USER.email,
			name: DEV_USER.name,
			emailVerified: true
		},
		update: {}
	});
	await db.workspace.upsert({
		where: { id: DEV_WORKSPACE.id },
		create: {
			id: DEV_WORKSPACE.id,
			name: DEV_WORKSPACE.name,
			ownerId: DEV_USER.id
		},
		update: {}
	});
	await db.membership.upsert({
		where: { workspaceId_userId: { workspaceId: DEV_WORKSPACE.id, userId: DEV_USER.id } },
		create: {
			workspaceId: DEV_WORKSPACE.id,
			userId: DEV_USER.id,
			role: 'OWNER',
			acceptedAt: new Date()
		},
		update: {}
	});
	seeded = true;
}
