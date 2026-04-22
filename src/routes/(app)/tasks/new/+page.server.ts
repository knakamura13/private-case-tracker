import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { createTask } from '$lib/server/services/task.service';
import { taskCreateSchema } from '$lib/schemas/task';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [forms, evidence, appointments, milestones, members] = await Promise.all([
		db.formRecord.findMany({
			where: { workspaceId: workspace.id, deletedAt: null },
			select: { id: true, code: true, name: true }
		}),
		db.evidenceItem.findMany({
			where: { workspaceId: workspace.id, deletedAt: null },
			select: { id: true, title: true }
		}),
		db.appointment.findMany({
			where: { workspaceId: workspace.id, deletedAt: null },
			select: { id: true, title: true }
		}),
		db.timelineMilestone.findMany({
			where: { workspaceId: workspace.id, deletedAt: null },
			select: { id: true, title: true, phase: true }
		}),
		db.membership.findMany({
			where: { workspaceId: workspace.id, acceptedAt: { not: null } },
			include: { user: { select: { id: true, name: true, email: true } } }
		})
	]);
	return {
		forms,
		evidence,
		appointments,
		milestones,
		members: members.map((m) => ({
			id: m.user.id,
			name: m.user.name,
			email: m.user.email
		}))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = taskCreateSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.message, values: raw });
		const task = await createTask(workspace.id, user.id, parsed.data);
		throw redirect(303, `/tasks/${task.id}`);
	}
};
