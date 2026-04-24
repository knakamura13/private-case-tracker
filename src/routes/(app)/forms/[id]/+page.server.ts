import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import {
	getForm,
	updateForm,
	softDeleteForm,
	replaceSupportingItems,
	revealReceipt,
	maskReceipt
} from '$lib/server/services/form.service';
import { formUpdateSchema } from '$lib/schemas/form';
import { listEvidence } from '$lib/server/services/evidence.service';
import { listDocuments } from '$lib/server/services/document.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const form = await getForm(workspace.id, event.params.id);
	if (!form) throw error(404, { message: 'Form not found' });
	const [evidence, files] = await Promise.all([
		listEvidence(workspace.id).then((r) => r.map((e) => ({ id: e.id, title: e.title }))),
		listDocuments(workspace.id).then((r) => r.map((d) => ({ id: d.id, title: d.title })))
	]);
	return {
		form: {
			...form,
			receiptNumberEncrypted: undefined,
			receiptMask: maskReceipt(form.receiptNumberEncrypted)
		},
		evidence,
		files
	};
};

export const actions: Actions = {
	update: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = formUpdateSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.message });
		await updateForm(workspace.id, user.id, event.params.id, parsed.data);
		return { ok: true };
	},
	delete: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		await softDeleteForm(workspace.id, user.id, event.params.id);
		throw redirect(303, '/forms');
	},
	reveal: async (event) => {
		const { workspace } = requireWorkspace(event);
		const form = await getForm(workspace.id, event.params.id);
		if (!form) throw error(404, { message: 'Form not found' });
		return { revealed: revealReceipt(form.receiptNumberEncrypted) };
	},
	supporting: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const form = await event.request.formData();
		const items: Array<{
			label: string;
			required: boolean;
			done: boolean;
			satisfiedByEvidenceId: string | null;
			satisfiedByFileId: string | null;
		}> = [];
		let idx = 0;
		while (form.has(`items[${idx}][label]`)) {
			const label = String(form.get(`items[${idx}][label]`) ?? '').trim();
			const required = form.get(`items[${idx}][required]`) === 'on';
			const done = form.get(`items[${idx}][done]`) === 'on';
			const ev = (form.get(`items[${idx}][satisfiedByEvidenceId]`) as string) || null;
			const fl = (form.get(`items[${idx}][satisfiedByFileId]`) as string) || null;
			if (label) {
				items.push({
					label,
					required,
					done,
					satisfiedByEvidenceId: ev,
					satisfiedByFileId: fl
				});
			}
			idx += 1;
		}
		await replaceSupportingItems(workspace.id, user.id, event.params.id, items);
		return { ok: true };
	}
};
