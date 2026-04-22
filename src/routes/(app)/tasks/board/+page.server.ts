import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listTasks, reorderOnBoard } from '$lib/server/services/task.service';
import type { Actions } from './$types';
import type { TaskStatus } from '@prisma/client';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const tasks = await listTasks(workspace.id);
	return { tasks };
};

export const actions: Actions = {
	reorder: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const body = (await event.request.json().catch(() => null)) as {
			updates?: { id: string; status: TaskStatus; order: number }[];
		} | null;
		if (!body?.updates) return { ok: false };
		await reorderOnBoard(workspace.id, user.id, body.updates);
		return { ok: true };
	}
};
