import { db } from '$lib/server/db';
import { ENV } from '$lib/server/env';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const userCount = await db.user.count();
	return {
		allowSignup: ENV.ALLOW_OPEN_SIGNUP || userCount === 0
	};
};
