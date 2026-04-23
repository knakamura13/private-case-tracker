import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import {
	getDocument,
	updateDocumentMetadata
} from '$lib/server/services/document.service';
import {
	deleteUploadedDocument,
	getUploadedDocumentUrl
} from '$lib/server/services/uploaded-document.service';
import {
	deleteExternalLink,
	getExternalLinkUrl,
	updateExternalLinkMetadata
} from '$lib/server/services/external-link.service';
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
		const doc = await getDocument(workspace.id, event.params.id);
		if (!doc) throw error(404, { message: 'Document not found' });
		
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = documentMetadataSchema.partial().safeParse(raw);
		if (!parsed.success) return { error: parsed.error.message };
		
		if (doc.storageMode === 'EXTERNAL_LINK') {
			await updateExternalLinkMetadata(workspace.id, user.id, event.params.id, parsed.data);
		} else {
			await updateDocumentMetadata(workspace.id, user.id, event.params.id, parsed.data);
		}
		return { ok: true };
	},
	delete: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const doc = await getDocument(workspace.id, event.params.id);
		if (!doc) throw error(404, { message: 'Document not found' });
		
		if (doc.storageMode === 'EXTERNAL_LINK') {
			await deleteExternalLink(workspace.id, user.id, event.params.id);
		} else {
			await deleteUploadedDocument(workspace.id, user.id, event.params.id);
		}
		throw redirect(303, '/documents');
	},
	download: async (event) => {
		const { workspace } = requireWorkspace(event);
		const doc = await getDocument(workspace.id, event.params.id);
		if (!doc) throw error(404, { message: 'Document not found' });
		
		let url: string | null;
		if (doc.storageMode === 'EXTERNAL_LINK') {
			url = await getExternalLinkUrl(workspace.id, event.params.id);
		} else {
			url = await getUploadedDocumentUrl(workspace.id, event.params.id);
		}
		
		if (!url) throw error(404, { message: 'No downloadable content' });
		throw redirect(303, url);
	}
};
