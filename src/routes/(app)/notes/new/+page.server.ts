import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { createNote } from '$lib/server/services/note.service';
import { noteCreateSchema } from '$lib/schemas/note';
import { listForms } from '$lib/server/services/form.service';
import { listEvidence } from '$lib/server/services/evidence.service';
import { listAppointments } from '$lib/server/services/appointment.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [forms, evidence, appointments] = await Promise.all([
		listForms(workspace.id).then((r) => r.map((f) => ({ id: f.id, code: f.code, name: f.name }))),
		listEvidence(workspace.id).then((r) => r.map((e) => ({ id: e.id, title: e.title }))),
		listAppointments(workspace.id).then((r) => r.map((a) => ({ id: a.id, title: a.title })))
	]);
	return { links: { tasks: [] as { id: string; title: string }[], forms, evidence, appointments } };
};

export const actions: Actions = {
	default: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = noteCreateSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.message });
		const note = await createNote(workspace.id, user.id, parsed.data);
		throw redirect(303, `/notes/${note.id}`);
	}
};
