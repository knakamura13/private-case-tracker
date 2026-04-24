import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		const next = encodeURIComponent(url.pathname + url.search);
		throw redirect(303, `/login?next=${next}`);
	}
	if (!locals.workspace) throw redirect(303, '/onboarding');

	return {
		user: locals.user,
		workspace: locals.workspace
	};
};
