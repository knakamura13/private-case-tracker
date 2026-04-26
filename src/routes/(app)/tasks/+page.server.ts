import { listTasks, reorderOnBoard } from '$lib/server/services/task.service';
import { fail } from '@sveltejs/kit';
import { requireWorkspace } from '$lib/server/guards';
import { taskStatusEnum } from '$lib/schemas/task';
import { getMembers } from '$lib/server/cache/membersCache';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const tasks = await listTasks(workspace.id);
	const members = await getMembers(workspace.id);

	return {
		tasks,
		members: members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email }))
	};
};

export const actions: Actions = {
	reorder: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const formData = await event.request.formData();
		const updatesJson = formData.get('updates') as string;
		if (!updatesJson) return fail(400, { error: 'Missing updates' });

		try {
			const rawUpdates = JSON.parse(updatesJson) as Array<{ id: string; status: string; order: number }>;
			const updates: Array<{ id: string; status: 'TODO' | 'IN_PROGRESS' | 'DONE'; order: number }> = [];
			for (const u of rawUpdates) {
				const parsed = taskStatusEnum.safeParse(u.status);
				if (!parsed.success) {
					return fail(400, { error: `Invalid status: ${u.status}` });
				}
				updates.push({ id: u.id, status: parsed.data, order: u.order });
			}
			await reorderOnBoard(workspace.id, user.id, updates);
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to reorder tasks' });
		}
	}
};
