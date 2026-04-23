import { requireWorkspace } from '$lib/server/guards';
import { listTasks } from '$lib/server/services/task.service';
import type { PageServerLoad } from './$types';
import type { TaskStatus } from '$lib/types/enums';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'ARCHIVED'];

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const status = event.url.searchParams.get('status');
	const owner = event.url.searchParams.get('owner');
	const q = event.url.searchParams.get('q') ?? undefined;
	const overdueOnly = event.url.searchParams.get('view') === 'overdue';
	const view = event.url.searchParams.get('view');
	let ownerId: string | undefined;
	if (owner === 'me') ownerId = event.locals.user!.id;
	else if (owner && owner !== '') ownerId = owner;

	const tasks = await listTasks(workspace.id, {
		status: status && STATUSES.includes(status as TaskStatus) ? (status as TaskStatus) : undefined,
		ownerId,
		q,
		overdueOnly: overdueOnly || view === 'mine-overdue'
	});

	return { tasks, view };
};
