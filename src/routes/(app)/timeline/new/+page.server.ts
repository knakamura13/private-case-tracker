import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { logActionError } from '$lib/server/services/actionError.service';
import { createMilestone } from '$lib/server/services/milestone.service';
import { milestoneCreateSchema } from '$lib/schemas/milestone';
import { getMembers } from '$lib/server/cache/membersCache';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const members = await getMembers(workspace.id);
	return {
		members: members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email })),
		defaultPhase: event.url.searchParams.get('phase') ?? 'PREPARATION'
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = milestoneCreateSchema.safeParse(raw);
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		const m = await createMilestone(workspace.id, user.id, parsed.data);
		throw redirect(303, `/timeline#${m.id}`);
	}
};
