import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { createExternalLink } from '$lib/server/services/external-link.service';
import { documentMetadataSchema } from '$lib/schemas/document';
import { DOCUMENT_CATEGORIES } from '$lib/constants/categories';
import { storageConfigured } from '$lib/server/env';
import { listForms } from '$lib/server/services/form.service';
import { listEvidence } from '$lib/server/services/evidence.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [forms, evidence] = await Promise.all([
		listForms(workspace.id).then((r) => r.map((f) => ({ id: f.id, code: f.code, name: f.name }))),
		listEvidence(workspace.id).then((r) => r.map((e) => ({ id: e.id, title: e.title })))
	]);
	return {
		categories: DOCUMENT_CATEGORIES,
		links: { tasks: [] as { id: string; title: string }[], forms, evidence },
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
		const doc = await createExternalLink(workspace.id, user.id, {
			...parsed.data,
			externalUrl: parsed.data.externalUrl
		});
		throw redirect(303, `/documents/${doc.id}`);
	}
};
