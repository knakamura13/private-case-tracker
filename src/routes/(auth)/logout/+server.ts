import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request }) => {
	try {
		await auth.api.signOut({ headers: request.headers });
	} catch (err) {
		console.error('[logout]', err);
	}
	throw redirect(303, '/login');
};

export const GET: RequestHandler = async ({ request }) => {
	try {
		await auth.api.signOut({ headers: request.headers });
	} catch (err) {
		console.error('[logout]', err);
	}
	throw redirect(303, '/login');
};
