import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listForms } from '$lib/server/services/form.service';
import { listEvidence } from '$lib/server/services/evidence.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [forms, evidence, translations, photos] = await Promise.all([
		listForms(workspace.id),
		listEvidence(workspace.id).then((r) =>
			r
				.filter((e) => e.includedInPacket)
				.sort((a, b) => String(a.type).localeCompare(String(b.type)))
		),
		listEvidence(workspace.id, { status: 'NEEDS_TRANSLATION' as any }),
		listEvidence(workspace.id, { type: 'Photos' })
	]);

	forms.sort((a, b) => String(a.code).localeCompare(String(b.code)));

	const readyForms = forms.filter(
		(f) =>
			f.filingStatus === 'READY_FOR_REVIEW' ||
			f.filingStatus === 'FILED' ||
			f.filingStatus === 'RECEIVED'
	);

	const supportingUnsatisfied = forms
		.flatMap((f) => f.supportingItems.map((s) => ({ ...s, formCode: f.code, formId: f.id })))
		.filter((s) => s.required && !s.done);

	return {
		totals: {
			forms: forms.length,
			readyForms: readyForms.length,
			evidenceInPacket: evidence.length,
			translationsNeeded: translations.length,
			photos: photos.length,
			supportingOutstanding: supportingUnsatisfied.length
		},
		forms,
		evidence,
		translations,
		photos,
		supportingUnsatisfied
	};
};
