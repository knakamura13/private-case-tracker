import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { logActionError } from '$lib/server/services/actionError.service';
import { createTask } from '$lib/server/services/task.service';
import { taskCreateSchema } from '$lib/schemas/task';
import { getMembers } from '$lib/server/cache/membersCache';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const members = await getMembers(workspace.id);
	return {
		members: members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email }))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		let checklist = [];
		if (raw.checklist) {
			try {
				checklist = JSON.parse(raw.checklist as string);
			} catch {
				const errorId = await logActionError(event, { message: 'Invalid checklist format', status: 400 });
				return fail(400, { error: 'Invalid checklist format', errorId });
			}
		}
		const parsed = taskCreateSchema.safeParse({
			...raw,
			checklist
		});
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		await createTask(workspace.id, user.id, parsed.data);
		throw redirect(303, '/tasks');
	}
};
