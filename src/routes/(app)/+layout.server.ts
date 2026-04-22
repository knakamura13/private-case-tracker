import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		const next = encodeURIComponent(url.pathname + url.search);
		throw redirect(303, `/login?next=${next}`);
	}
	if (!locals.workspace) throw redirect(303, '/onboarding');

	const members = await db.membership.findMany({
		where: { workspaceId: locals.workspace.id, acceptedAt: { not: null } },
		include: { user: { select: { id: true, email: true, name: true, image: true } } }
	});

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
