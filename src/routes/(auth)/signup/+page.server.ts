import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { ENV } from '$lib/server/env';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const userCount = await db.user.count();
	const isFirstUser = userCount === 0;
	const inviteToken = url.searchParams.get('invite');

	if (!isFirstUser && !ENV.ALLOW_OPEN_SIGNUP && !inviteToken) {
		throw error(403, {
			message: 'Signup is closed. Ask the workspace owner to invite you by email.'
		});
	}
	if (inviteToken) {
		const invite = await db.invitation.findFirst({
			where: { token: inviteToken, acceptedAt: null, expiresAt: { gt: new Date() } }
		});
		if (!invite) throw redirect(303, '/login?invalidInvite=1');
	}
	return { isFirstUser, inviteToken };
};
