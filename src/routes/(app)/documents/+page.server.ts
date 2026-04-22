import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listDocuments } from '$lib/server/services/document.service';
import { DOCUMENT_CATEGORIES } from '$lib/constants/categories';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const category = event.url.searchParams.get('category') ?? undefined;
	const q = event.url.searchParams.get('q') ?? undefined;
	const docs = await listDocuments(workspace.id, { category, q });
	return { docs, categories: DOCUMENT_CATEGORIES };
};
