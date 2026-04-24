import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { logActionError } from '$lib/server/services/actionError.service';
import { createTask } from '$lib/server/services/task.service';
import { taskCreateSchema } from '$lib/schemas/task';
import { listForms } from '$lib/server/services/form.service';
import { listEvidence } from '$lib/server/services/evidence.service';
import { listAppointments } from '$lib/server/services/appointment.service';
import { listMilestones } from '$lib/server/services/milestone.service';
import { getMembers } from '$lib/server/cache/membersCache';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [forms, evidence, appointments, milestones, members] = await Promise.all([
		listForms(workspace.id).then((r) => r.map((f) => ({ id: f.id, code: f.code, name: f.name }))),
		listEvidence(workspace.id).then((r) => r.map((e) => ({ id: e.id, title: e.title }))),
		listAppointments(workspace.id).then((r) => r.map((a) => ({ id: a.id, title: a.title }))),
		listMilestones(workspace.id).then((r) =>
			r.map((m) => ({ id: m.id, title: m.title, phase: m.phase }))
		),
		getMembers(workspace.id)
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
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId, values: raw });
		}
		const task = await createTask(workspace.id, user.id, parsed.data);
		throw redirect(303, `/tasks/${task.id}`);
	}
};
