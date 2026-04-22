import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { getNote, updateNote, softDeleteNote } from '$lib/server/services/note.service';
import { noteUpdateSchema } from '$lib/schemas/note';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const note = await getNote(workspace.id, event.params.id);
	if (!note) throw error(404, { message: 'Note not found' });
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
	return { note, links: { tasks, forms, evidence, appointments } };
};

export const actions: Actions = {
	update: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = noteUpdateSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.message });
		await updateNote(workspace.id, user.id, event.params.id, parsed.data);
		return { ok: true };
	},
	delete: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		await softDeleteNote(workspace.id, user.id, event.params.id);
		throw redirect(303, '/notes');
	}
};
