import { listTasks, reorderOnBoard } from '$lib/server/services/task.service';
import { fail, redirect } from '@sveltejs/kit';
import { taskStatusEnum } from '$lib/schemas/task';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const workspaceId = locals.session?.workspaceId;
	if (!workspaceId) throw redirect(302, '/onboarding');

	const tasks = await listTasks(workspaceId);
	const members = await locals.db
		.query('workspace_member')
		.where('workspace_id', '=', workspaceId)
		.join('user', 'user_id', 'id')
		.select();

	return {
		tasks,
		members: members.map((m) => ({
			id: m.user_id,
			name: m.user.name,
			email: m.user.email
		}))
	};
};

export const actions: Actions = {
	reorder: async ({ locals, request }) => {
		const workspaceId = locals.session?.workspaceId;
		if (!workspaceId) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const updatesJson = formData.get('updates') as string;
		if (!updatesJson) return fail(400, { error: 'Missing updates' });

		try {
			const rawUpdates = JSON.parse(updatesJson) as Array<{ id: string; status: string; order: number }>;
			const updates: Array<{ id: string; status: 'TODO' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE'; order: number }> = [];
			for (const u of rawUpdates) {
				const parsed = taskStatusEnum.safeParse(u.status);
				if (!parsed.success) {
					return fail(400, { error: `Invalid status: ${u.status}` });
				}
				updates.push({ id: u.id, status: parsed.data, order: u.order });
			}
			await reorderOnBoard(workspaceId, locals.session.userId, updates);
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to reorder tasks' });
		}
	}
};
