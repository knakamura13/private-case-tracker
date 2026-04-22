import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { acceptInvitation, findActiveInvitation } from '$lib/server/services/invitation.service';

export const load: PageServerLoad = async ({ params, locals }) => {
	const invitation = await findActiveInvitation(params.token);
	if (!invitation) throw error(410, { message: 'This invitation has expired or been used.' });
	return {
		invitation: {
			email: invitation.email,
			role: invitation.role,
			workspaceName: invitation.workspace.name
		},
		isSignedIn: Boolean(locals.user),
		currentUserEmail: locals.user?.email ?? null,
		token: params.token
	};
};

export const actions: Actions = {
	accept: async ({ params, locals }) => {
		if (!locals.user) throw redirect(303, `/signup?invite=${params.token}`);
		await acceptInvitation(params.token, locals.user.id);
		throw redirect(303, '/dashboard');
	}
};
