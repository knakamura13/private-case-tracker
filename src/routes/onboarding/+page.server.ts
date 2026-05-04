import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createWorkspace } from '$lib/server/services/workspace.service';
import { ddbQuery } from '$lib/server/dynamo/ops';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw redirect(303, '/login');
    if (locals.workspace) throw redirect(303, '/dashboard');
    try {
        const totalWorkspaces = (
            await ddbQuery({
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: { ':pk': 'WS_INDEX' },
                Limit: 1
            })
        ).length;
        return { isFirstUser: totalWorkspaces === 0 };
    } catch (err) {
        console.error('[onboarding] failed to query workspaces', err);
        // Assume not first user on error to be safe
        return { isFirstUser: false };
    }
};

export const actions: Actions = {
    create: async ({ request, locals }) => {
        if (!locals.user) throw redirect(303, '/login');
        if (locals.workspace) throw redirect(303, '/dashboard');
        try {
            const totalWorkspaces = (
                await ddbQuery({
                    KeyConditionExpression: 'PK = :pk',
                    ExpressionAttributeValues: { ':pk': 'WS_INDEX' },
                    Limit: 1
                })
            ).length;
            if (totalWorkspaces > 0) {
                return fail(403, { error: 'Workspace already exists. Ask the owner to invite you.' });
            }
        } catch (err) {
            console.error('[onboarding] failed to query workspaces in create action', err);
            // Assume workspace exists on error to be safe
            return fail(403, { error: 'Workspace already exists. Ask the owner to invite you.' });
        }
        const form = await request.formData();
        const name = ((form.get('name') as string) || '').trim();
        if (!name) return fail(400, { error: 'Workspace name required' });
        await createWorkspace({ name, ownerUserId: locals.user.id });
        throw redirect(303, '/dashboard');
    }
};
