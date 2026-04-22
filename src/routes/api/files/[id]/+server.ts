import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSignedGetUrl } from '$lib/server/services/document.service';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || !locals.workspace) throw error(401, { message: 'Unauthorized' });
	const url = await getSignedGetUrl(locals.workspace.id, params.id);
	if (!url) throw error(404, { message: 'Not found' });
	throw redirect(302, url);
};
