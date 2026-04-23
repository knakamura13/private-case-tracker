import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { listMembers } from '$lib/server/services/workspace.service';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		const next = encodeURIComponent(url.pathname + url.search);
		throw redirect(303, `/login?next=${next}`);
	}
	if (!locals.workspace) throw redirect(303, '/onboarding');

	const members = await listMembers(locals.workspace.id);

	return {
		user: locals.user,
		workspace: locals.workspace,
		members: members.map((m) => ({
			id: m.user.id,
			email: m.user.email,
			name: m.user.name,
			image: m.user.image,
			role: m.role
		}))
	};
};
