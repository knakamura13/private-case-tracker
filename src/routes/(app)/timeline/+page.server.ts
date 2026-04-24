import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listMilestones, currentPhase } from '$lib/server/services/milestone.service';
import type { MilestonePhase, MilestoneStatus } from '$lib/types/enums';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const milestones = await listMilestones(workspace.id);
	const phase = currentPhase(
		milestones.map((m) => ({
			phase: m.phase as MilestonePhase,
			status: m.status as MilestoneStatus
		}))
	);
	return { milestones, phase };
};
