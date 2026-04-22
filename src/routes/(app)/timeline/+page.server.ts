import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listMilestones, currentPhase } from '$lib/server/services/milestone.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const milestones = await listMilestones(workspace.id);
	return { milestones, phase: currentPhase(milestones) };
};
