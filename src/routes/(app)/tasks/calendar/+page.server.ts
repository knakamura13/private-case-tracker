import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listTasks } from '$lib/server/services/task.service';
import { listAppointments } from '$lib/server/services/appointment.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [tasks, appointments] = await Promise.all([
		listTasks(workspace.id),
		listAppointments(workspace.id)
	]);
	return {
		items: [
			...tasks
				.filter((t) => t.dueDate)
				.map((t) => ({
					id: t.id,
					kind: 'task' as const,
					date: t.dueDate!,
					title: t.title,
					href: `/tasks/${t.id}`
				})),
			...appointments.map((a) => ({
				id: a.id,
				kind: 'appointment' as const,
				date: a.scheduledAt,
				title: a.title,
				href: `/appointments/${a.id}`
			}))
		]
	};
};
