import { requireWorkspace } from '$lib/server/guards';
import { getQuickLinksFor } from '$lib/server/services/quickLink.service';
import { getQuickLinkFoldersFor } from '$lib/server/services/quickLinkFolder.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [links, folders] = await Promise.all([
		getQuickLinksFor(workspace.id),
		getQuickLinkFoldersFor(workspace.id)
	]);
	return {
		quickLinks: links,
		quickLinkFolders: folders
	};
};
