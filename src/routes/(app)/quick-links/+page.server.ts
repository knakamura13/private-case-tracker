import { requireWorkspace } from '$lib/server/guards';
import { listQuickLinks } from '$lib/server/services/quickLink.service';
import { listQuickLinkFolders } from '$lib/server/services/quickLinkFolder.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [links, folders] = await Promise.all([
		listQuickLinks(workspace.id),
		listQuickLinkFolders(workspace.id)
	]);
	return {
		quickLinks: links,
		quickLinkFolders: folders
	};
};
