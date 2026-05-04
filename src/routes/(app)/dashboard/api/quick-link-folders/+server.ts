import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { createQuickLinkFolder } from '$lib/server/services/quickLinkFolder.service';
import { quickLinkFolderCreateSchema } from '$lib/schemas/quickLink';
import { logActionError } from '$lib/server/services/actionError.service';

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
        await logActionError(event, { message, status: 500, stack: e instanceof Error ? e.stack : undefined });
        return json({ error: message }, { status: 500 });
    }
};
