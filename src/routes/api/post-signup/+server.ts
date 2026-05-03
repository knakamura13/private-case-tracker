import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';
import { createWorkspace } from '$lib/server/services/workspace.service';
import { acceptInvitation } from '$lib/server/services/invitation.service';
import { ddbQuery } from '$lib/server/dynamo/ops';

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

    if (inviteToken) {
        try {
            await acceptInvitation(inviteToken, session.user.id);
            return json({ ok: true });
        } catch (err) {
            return json({ error: (err as Error).message }, { status: 400 });
        }
    }

    // We don't know the workspaceId yet; simplest is to rely on hooks membership load later.
    // If the user is already attached to any workspace, no-op.
    const existing = await ddbQuery<Record<string, unknown>>({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: { ':pk': `USER#${session.user.id}` },
        Limit: 1
    }).catch(() => [] as Record<string, unknown>[]);
    if (existing) return json({ ok: true });

    const totalWorkspaces = (
        await ddbQuery<Record<string, unknown>>({
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: { ':pk': 'WS_INDEX' },
            Limit: 1
        }).catch(() => [] as Record<string, unknown>[])
    ).length;
    if (totalWorkspaces > 0) {
        return json({ error: 'Signup is closed. Ask the workspace owner for an invitation.' }, { status: 403 });
    }

    await createWorkspace({ name: workspaceName, ownerUserId: session.user.id });
    return json({ ok: true });
};
