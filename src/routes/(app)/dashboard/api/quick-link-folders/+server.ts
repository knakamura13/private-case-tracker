import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { createQuickLinkFolder } from '$lib/server/services/quickLinkFolder.service';
import { quickLinkFolderCreateSchema } from '$lib/schemas/quickLink';

export const POST: RequestHandler = async (event) => {
	const { workspace, user } = requireWorkspace(event);
	const body = await event.request.json();
	const parsed = quickLinkFolderCreateSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.message }, { status: 400 });
	}
	try {
		const folder = await createQuickLinkFolder(workspace.id, user.id, parsed.data.name);
		return json(folder);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to create folder';
		return json({ error: message }, { status: 500 });
	}
};
