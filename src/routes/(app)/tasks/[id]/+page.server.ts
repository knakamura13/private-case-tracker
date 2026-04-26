import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { logActionError } from '$lib/server/services/actionError.service';
import { getTask, updateTask, softDeleteTask } from '$lib/server/services/task.service';
import { taskUpdateSchema } from '$lib/schemas/task';
import { getMembers } from '$lib/server/cache/membersCache';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const members = await getMembers(workspace.id);
	const task = await getTask(workspace.id, event.params.id);
	if (!task) throw redirect(303, '/tasks');
	return {
		task,
		members: members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email }))
	};
};

export const actions: Actions = {
	update: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		let checklist = undefined;
		if (raw.checklist) {
			try {
				checklist = JSON.parse(raw.checklist as string);
			} catch {
				const errorId = await logActionError(event, { message: 'Invalid checklist format', status: 400 });
				return fail(400, { error: 'Invalid checklist format', errorId });
			}
		}
		const parsed = taskUpdateSchema.safeParse({
			...raw,
			checklist
		});
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		await updateTask(workspace.id, user.id, event.params.id, parsed.data);
		throw redirect(303, '/tasks');
	},
	delete: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		await softDeleteTask(workspace.id, user.id, event.params.id);
		throw redirect(303, '/tasks');
	}
};
