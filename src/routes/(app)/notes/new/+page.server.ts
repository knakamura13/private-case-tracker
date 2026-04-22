import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { createNote } from '$lib/server/services/note.service';
import { noteCreateSchema } from '$lib/schemas/note';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [tasks, forms, evidence, appointments] = await Promise.all([
		db.task.findMany({
			where: { workspaceId: workspace.id, deletedAt: null },
			select: { id: true, title: true }
		}),
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
		})
	]);
	return { links: { tasks, forms, evidence, appointments } };
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
