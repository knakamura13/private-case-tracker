import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import {
	getMilestone,
	updateMilestone,
	softDeleteMilestone
} from '$lib/server/services/milestone.service';
import { milestoneUpdateSchema } from '$lib/schemas/milestone';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const milestone = await getMilestone(workspace.id, event.params.id);
	if (!milestone) throw error(404, { message: 'Milestone not found' });
	const members = await db.membership.findMany({
		where: { workspaceId: workspace.id, acceptedAt: { not: null } },
		include: { user: { select: { id: true, name: true, email: true } } }
	});
	return {
		milestone,
		members: members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email }))
	};
};

export const actions: Actions = {
	update: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = milestoneUpdateSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.message });
		await updateMilestone(workspace.id, user.id, event.params.id, parsed.data);
		return { ok: true };
	},
	delete: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		await softDeleteMilestone(workspace.id, user.id, event.params.id);
		throw redirect(303, '/timeline');
	}
};
