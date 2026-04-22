import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { createWorkspace } from '$lib/server/services/workspace.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (locals.workspace) throw redirect(303, '/dashboard');
	const totalWorkspaces = await db.workspace.count();
	return { isFirstUser: totalWorkspaces === 0 };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		if (locals.workspace) throw redirect(303, '/dashboard');
		const totalWorkspaces = await db.workspace.count();
		if (totalWorkspaces > 0) {
			return fail(403, { error: 'Workspace already exists. Ask the owner to invite you.' });
		}
		const form = await request.formData();
		const name = ((form.get('name') as string) || '').trim();
		if (!name) return fail(400, { error: 'Workspace name required' });
		await createWorkspace({ name, ownerUserId: locals.user.id });
		throw redirect(303, '/dashboard');
	}
};
