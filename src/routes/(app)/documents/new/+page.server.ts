import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { createExternalDocument } from '$lib/server/services/document.service';
import { documentMetadataSchema } from '$lib/schemas/document';
import { db } from '$lib/server/db';
import { DOCUMENT_CATEGORIES } from '$lib/constants/categories';
import { storageConfigured } from '$lib/server/env';

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
	return {
		categories: DOCUMENT_CATEGORIES,
		links: { tasks, forms, evidence, appointments },
		uploadEnabled: storageConfigured()
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = documentMetadataSchema.safeParse({ ...raw, storageMode: 'EXTERNAL_LINK' });
		if (!parsed.success) return fail(400, { error: parsed.error.message });
		if (!parsed.data.externalUrl) {
			return fail(400, { error: 'External URL required' });
		}
		const doc = await createExternalDocument(workspace.id, user.id, {
			...parsed.data,
			externalUrl: parsed.data.externalUrl
		});
		throw redirect(303, `/documents/${doc.id}`);
	}
};
