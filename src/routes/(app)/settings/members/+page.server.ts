import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireOwner, requireWorkspace } from '$lib/server/guards';
import { createInvitation, listPendingInvitations, revokeInvitation } from '$lib/server/services/invitation.service';
import { removeMember } from '$lib/server/services/workspace.service';
import { getMembers } from '$lib/server/cache/membersCache';
import { inviteSchema } from '$lib/schemas/auth';

export const load: PageServerLoad = async (event) => {
    const { workspace } = requireWorkspace(event);
    const [members, invitations] = await Promise.all([getMembers(workspace.id), listPendingInvitations(workspace.id)]);
    return { members, invitations };
};

export const actions: Actions = {
    invite: async (event) => {
        const { workspace, user } = requireOwner(event);
        const raw = Object.fromEntries(await event.request.formData());
        const parsed = inviteSchema.safeParse(raw);
        if (!parsed.success) return fail(400, { error: parsed.error.message });
        const { url } = await createInvitation({
            workspaceId: workspace.id,
            email: parsed.data.email,
            role: parsed.data.role,
            invitedByUserId: user.id,
            inviterName: user.name ?? user.email,
            workspaceName: workspace.name
        });
        return { ok: true, inviteUrl: url };
    },
    revoke: async (event) => {
        const { workspace } = requireOwner(event);
        const form = await event.request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'Missing invitation id' });
        await revokeInvitation(workspace.id, id);
        return { ok: true };
    },
    removeMember: async (event) => {
        const { workspace } = requireOwner(event);
        const form = await event.request.formData();
        const userId = String(form.get('userId') ?? '');
        if (!userId) return fail(400, { error: 'Missing user id' });
        if (userId === event.locals.user!.id) return fail(400, { error: 'Cannot remove yourself' });
        await removeMember(workspace.id, userId);
        return { ok: true };
    }
};
