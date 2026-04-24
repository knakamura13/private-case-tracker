import { error, redirect } from '@sveltejs/kit';
import { ENV } from '$lib/server/env';
import type { PageServerLoad } from './$types';
import { ddbQuery } from '$lib/server/dynamo/ops';
import { baPk } from '$lib/server/dynamo/keys';
import { findActiveInvitation } from '$lib/server/services/invitation.service';

export const load: PageServerLoad = async ({ url }) => {
	const users = await ddbQuery<Record<string, unknown>>({
		KeyConditionExpression: 'PK = :pk',
		ExpressionAttributeValues: { ':pk': baPk('user') },
		Limit: 1
	});
	const userCount = users.length;
	const isFirstUser = userCount === 0;
	const inviteToken = url.searchParams.get('invite');

	if (!isFirstUser && !ENV.ALLOW_OPEN_SIGNUP && !inviteToken) {
		throw error(403, {
			message: 'Signup is closed. Ask the workspace owner to invite you by email.'
		});
	}
	if (inviteToken) {
		const invite = await findActiveInvitation(inviteToken);
		if (!invite) throw redirect(303, '/login?invalidInvite=1');
	}
	return { isFirstUser, inviteToken };
};
