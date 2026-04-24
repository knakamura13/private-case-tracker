import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { logActionError } from '$lib/server/services/actionError.service';
import {
	getMilestone,
	updateMilestone,
	softDeleteMilestone
} from '$lib/server/services/milestone.service';
import { milestoneUpdateSchema } from '$lib/schemas/milestone';
import { getMembers } from '$lib/server/cache/membersCache';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const milestone = await getMilestone(workspace.id, event.params.id);
	if (!milestone) throw error(404, { message: 'Milestone not found' });
	const members = await getMembers(workspace.id);
	return {
		milestone: milestone as unknown as {
			phase: import('$lib/types/enums').MilestonePhase;
		} & typeof milestone,
		members: members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email }))
	};
};

export const actions: Actions = {
	update: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = milestoneUpdateSchema.safeParse({
			...raw,
			subTasks: raw.subTasks ? JSON.parse(raw.subTasks as string) : []
		});
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		await updateMilestone(workspace.id, user.id, event.params.id, parsed.data);
		return { ok: true };
	},
	delete: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		await softDeleteMilestone(workspace.id, user.id, event.params.id);
		throw redirect(303, '/timeline');
	}
};
