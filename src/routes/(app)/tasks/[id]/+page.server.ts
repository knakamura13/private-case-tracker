import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { logActionError } from '$lib/server/services/actionError.service';
import {
	getTask,
	updateTask,
	softDeleteTask,
	setChecklist
} from '$lib/server/services/task.service';
import { taskUpdateSchema } from '$lib/schemas/task';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const task = await getTask(workspace.id, event.params.id);
	if (!task) throw error(404, { message: 'Task not found' });

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
		task,
		forms,
		evidence,
		appointments,
		milestones,
		members: members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email }))
	};
};

export const actions: Actions = {
	update: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = taskUpdateSchema.safeParse(raw);
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		await updateTask(workspace.id, user.id, event.params.id, parsed.data);
		return { ok: true };
	},
	delete: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		await softDeleteTask(workspace.id, user.id, event.params.id);
		throw redirect(303, '/tasks');
	},
	checklist: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const form = await event.request.formData();
		const items: { text: string; done: boolean }[] = [];
		let idx = 0;
		while (form.has(`items[${idx}][text]`)) {
			const text = String(form.get(`items[${idx}][text]`) ?? '').trim();
			const done = form.get(`items[${idx}][done]`) === 'on';
			if (text) items.push({ text, done });
			idx += 1;
		}
		await setChecklist(workspace.id, user.id, event.params.id, items);
		return { ok: true };
	}
};
