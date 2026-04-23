import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireOwner } from '$lib/server/guards';
import { getError } from '$lib/server/services/errorLog.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireOwner(event);
	const row = await getError(event.params.id, workspace.id, true);
	if (!row) throw error(404, 'Not found');
	return { row };
};
