import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import {
	getDocument,
	softDeleteDocument,
	updateDocumentMetadata,
	getSignedGetUrl
} from '$lib/server/services/document.service';
import { documentMetadataSchema } from '$lib/schemas/document';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const doc = await getDocument(workspace.id, event.params.id);
	if (!doc) throw error(404, { message: 'Document not found' });
	return { doc };
};

export const actions: Actions = {
	update: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = documentMetadataSchema.partial().safeParse(raw);
		if (!parsed.success) return { error: parsed.error.message };
		await updateDocumentMetadata(workspace.id, user.id, event.params.id, parsed.data);
		return { ok: true };
	},
	delete: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		await softDeleteDocument(workspace.id, user.id, event.params.id);
		throw redirect(303, '/documents');
	},
	download: async (event) => {
		const { workspace } = requireWorkspace(event);
		const url = await getSignedGetUrl(workspace.id, event.params.id);
		if (!url) throw error(404, { message: 'No downloadable content' });
		throw redirect(303, url);
	}
};
