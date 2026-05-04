import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { recentActivity } from '$lib/server/activity';

export const load: PageServerLoad = async (event) => {
    const { workspace } = requireWorkspace(event);
    const items = await recentActivity(workspace.id, 250);
    return { items };
};
