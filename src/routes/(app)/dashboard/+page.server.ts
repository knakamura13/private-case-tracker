import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { dashboardFor } from '$lib/server/services/dashboard.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const data = await dashboardFor(workspace.id);
	return data;
};
