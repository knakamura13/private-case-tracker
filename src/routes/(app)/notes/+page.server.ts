import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listNotes } from '$lib/server/services/note.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const q = event.url.searchParams.get('q') ?? undefined;
	const notes = await listNotes(workspace.id, { q });
	return { notes };
};
