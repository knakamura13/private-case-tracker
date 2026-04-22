import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { createWorkspace } from '$lib/server/services/workspace.service';
import { acceptInvitation } from '$lib/server/services/invitation.service';

// Called immediately after successful sign-up.
// - First user in the system becomes an OWNER of a freshly created workspace.
// - A signed-up user with a matching invitation token joins the inviter's workspace.
// - Otherwise we reject — auth is invite-only after the first owner.

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) return json({ error: 'Not authenticated' }, { status: 401 });

	const form = await request.formData();
	const workspaceName = ((form.get('workspaceName') as string) || 'Our case').trim();
	const inviteToken = (form.get('inviteToken') as string) || null;

	const existing = await db.membership.findFirst({ where: { userId: session.user.id } });
	if (existing) return json({ ok: true });

	if (inviteToken) {
		try {
			await acceptInvitation(inviteToken, session.user.id);
			return json({ ok: true });
		} catch (err) {
			return json({ error: (err as Error).message }, { status: 400 });
		}
	}

	const totalWorkspaces = await db.workspace.count();
	if (totalWorkspaces > 0) {
		return json(
			{ error: 'Signup is closed. Ask the workspace owner for an invitation.' },
			{ status: 403 }
		);
	}

	await createWorkspace({ name: workspaceName, ownerUserId: session.user.id });
	return json({ ok: true });
};
