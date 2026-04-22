import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { markUploaded } from '$lib/server/services/document.service';

export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || !locals.workspace) return json({ error: 'Unauthorized' }, { status: 401 });
	try {
		const doc = await markUploaded(locals.workspace.id, locals.user.id, params.id);
		return json({ ok: true, status: doc.status });
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};
